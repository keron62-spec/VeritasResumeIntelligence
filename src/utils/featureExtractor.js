// src/utils/featureExtractor.js

/**
 * Main feature extractor - orchestrates all dictionaries
 * Outputs a compact JSON object to send to the worker
 */

import { extractBullets, groupBulletsByRole } from './bulletParser.js';
import { detectSections, getSection } from './sectionDetector.js';
import { parseJobDescription, extractYearsRequired, extractEducationRequired } from './jdParser.js';
import { analyzeVerbs, getVerbCategory } from './verbs.js';
import { detectBuzzwords } from './buzzwords.js';
import { extractMetrics, calculateMetricStrength } from './metricsPatterns.js';
import { calculateDeterministicBloom, analyzeBulletBloom, getBloomGapAnalysis } from './deterministicBloom.js';
import { detectSeniorityFromText } from './seniorityDetector.js';
import { detectIndustry } from './industryKeywords.js';
import { countTechnicalSkills, TECHNICAL_SKILLS } from './skillDictionary.js';
import { countCertifications, getCertificationDetails, CERTIFICATIONS } from './certifications.js';
import { countLanguages, detectEducationLevel } from './commonDictionaries.js';
import { calculateATSScore, calculateCredibilityScore, calculateSemanticPosition, calculateFitScore } from './scoreCalculator.js';
import { detectJobHopping, detectCareerGaps } from './dateParser.js';
import { detectRoleType } from './jobTitles.js';
import { calculateRIASECDeterministic, formatRIASECForDisplay } from './riasec.js';

/**
 * Get empty features result for error cases
 */
function getEmptyFeaturesResult() {
  return {
    extractor_version: '1.0.0',
    extraction_time_ms: 0,
    bullets: [],
    bullet_count: 0,
    bullet_groups: [],
    bloom: {
      average_level: 3.5,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      classification: 'unknown',
      assessment: 'No resume data available',
      multiplier: 1.0
    },
    verb_analysis: {
      average_strength: 5,
      classification: 'moderate',
      strong_count: 0,
      weak_count: 0
    },
    metrics: {
      strong_count: 0,
      weak_count: 0,
      has_baseline: false,
      strength_score: 50
    },
    seniority: {
      level: 'mid',
      confidence: 'low',
      years_detected: 0
    },
    skills_count: 0,
    skills_list: [],
    certifications_count: 0,
    certifications_list: [],
    languages_count: 0,
    industry: 'unknown',
    role_type: 'unknown',
    top_achievements: [],
    ats_score: 70,
    ats_label: 'Moderate',
    ats_breakdown: {},
    credibility_score: 70,
    credibility_label: 'Moderate',
    credibility_flags: {},
    semantic_position: 0,
    semantic_label: 'Perfectly positioned',
    semantic_alignment: 7,
    detected_level: 'Mid',
    riasec: null,
    jd_comparison: null,
    buzzword_count: 0,
    buzzword_penalty: 0,
    has_summary: false,
    has_skills_section: false,
    has_projects_section: false,
    original_summary: null
  };
}

/**
 * Extract all features from resume and JD
 * Returns a compact JSON object ready to send to the worker
 */
export function extractAllFeatures(resumeText, jdText = null) {
  // SAFETY: Ensure resumeText is a valid string
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
    console.warn('extractAllFeatures: resumeText is invalid, returning empty features');
    return getEmptyFeaturesResult();
  }

  const startTime = Date.now();
  
  // ============================================================
  // RESUME EXTRACTION
  // ============================================================
  
  // Extract bullets
  const bulletResult = extractBullets(resumeText);
  const bullets = bulletResult.bullets || [];
  const bulletGroups = groupBulletsByRole(bullets);
  
  // Calculate deterministic Bloom across all bullets
  const bulletBloomResults = [];
  for (const bullet of bullets) {
    if (bullet && bullet.original_text) {
      const bloom = calculateDeterministicBloom(bullet.original_text);
      bulletBloomResults.push(bloom);
    } else {
      bulletBloomResults.push({ level: 3.0 });
    }
  }
  const overallBloom = analyzeBulletBloom(bullets.map(b => b?.original_text || '').filter(t => t));
  
  // Detect seniority
  const seniority = detectSeniorityFromText(resumeText);
  
  // Extract verbs
  const verbAnalysis = analyzeVerbs(resumeText);
  
  // Extract metrics
  const metrics = extractMetrics(resumeText);
  const metricStrength = calculateMetricStrength(resumeText);
  
  // Detect buzzwords
  const buzzwords = detectBuzzwords(resumeText);
  
  // Detect skills
  const skillsCount = countTechnicalSkills(resumeText);
  const skillsList = extractSkillsList(resumeText);
  
  // Detect certifications
  const certDetails = getCertificationDetails(resumeText);
  const certificationsCount = certDetails.total_count || 0;
  const certificationsList = extractCertificationsList(resumeText);
  
  // Detect languages
  const languagesCount = countLanguages(resumeText);
  
  // Detect industry
  const industry = detectIndustry(resumeText);
  
  // Detect role type
  const roleType = detectRoleType(resumeText);
  
  // Detect sections
  const sections = detectSections(resumeText);
  
  // Extract top achievements (bullets with highest bloom level or strong metrics)
  const topAchievements = extractTopAchievements(bullets, bulletBloomResults);
  
  // Calculate ATS score
  const atsScore = calculateATSScore(resumeText, jdText, {
    keywordMatchRate: 0,
    skillsCount,
    certificationsCount
  });
  
  // Calculate credibility score
  const credibility = calculateCredibilityScore(resumeText, {
    titles: extractTitles(bulletGroups)
  });
  
  // Calculate semantic position
  const semanticPosition = calculateSemanticPosition(resumeText, seniority.years_detected || 0);
  
  // ============================================================
  // RIASEC CALCULATION (Deterministic)
  // ============================================================
  
  const riasecResult = calculateRIASECDeterministic(resumeText, jdText, false);
  
  // ============================================================
  // JD EXTRACTION (if provided)
  // ============================================================
  
  let jdFeatures = null;
  let fitScore = null;
  let keywordMatchRate = 0;
  let levelGap = 0;
  let yearsGap = 0;
  let matchingCertifications = 0;
  let skillsMatchRate = 0;
  
  if (jdText && typeof jdText === 'string' && jdText.trim().length > 0) {
    const jdParsed = parseJobDescription(jdText);
    const jdSeniority = detectSeniorityFromText(jdText);
    const jdYearsRequired = extractYearsRequired(jdText);
    const jdEducationRequired = extractEducationRequired(jdText);
    const jdSkillsCount = countTechnicalSkills(jdText);
    const jdCertDetails = getCertificationDetails(jdText);
    const jdRoleType = detectRoleType(jdText);
    const jdIndustry = detectIndustry(jdText);
    
    // Calculate match rates
    const keywordAnalysis = calculateKeywordMatchRate(resumeText, jdText);
    keywordMatchRate = keywordAnalysis.matchRate || 0;
    
    const certAnalysis = calculateCertMatchRate(certDetails, jdCertDetails);
    matchingCertifications = certAnalysis.matchCount || 0;
    
    const skillsAnalysis = calculateSkillsMatchRate(skillsList, jdText);
    skillsMatchRate = skillsAnalysis.matchRate || 0;
    
    // Level gap (negative = candidate below JD)
    const seniorityLevels = { 'entry': 1, 'mid': 2, 'senior': 3, 'executive': 4 };
    const candidateLevel = seniorityLevels[seniority.level] || 2;
    const jdLevel = seniorityLevels[jdSeniority.level] || 2;
    levelGap = candidateLevel - jdLevel;
    
    // Years gap (negative = candidate has fewer years)
    const candidateYears = seniority.years_detected || 0;
    const jdYears = jdYearsRequired || 0;
    yearsGap = candidateYears - jdYears;
    
    // Calculate fit score
    fitScore = calculateFitScore({
      keywordMatchRate,
      levelGap,
      yearsGap,
      matchingCertifications,
      skillsMatchRate
    });
    
    jdFeatures = {
      seniority: jdSeniority,
      years_required: jdYearsRequired,
      education_required: jdEducationRequired,
      skills_count: jdSkillsCount,
      role_type: jdRoleType,
      industry: jdIndustry,
      responsibilities: jdParsed.responsibilities || [],
      requirements: jdParsed.requirements || [],
      preferred: jdParsed.preferred || [],
      critical_keywords: keywordAnalysis.criticalKeywords || { matched: [], missing: [] }
    };
  }
  
  // ============================================================
  // BUILD OUTPUT
  // ============================================================
  
  const output = {
    // Version info
    extractor_version: '1.0.0',
    extraction_time_ms: Date.now() - startTime,
    
    // Bullet data
    bullets: bullets.map((b, idx) => ({
      id: b?.id || `bullet_${idx}`,
      section: b?.section || 'unknown',
      role: b?.role || null,
      company: b?.company || null,
      original_text: b?.original_text || '',
      bloom_level: bulletBloomResults[idx]?.level || 3.0
    })),
    bullet_count: bullets.length,
    bullet_groups: bulletGroups.map(g => ({
      company: g?.company || 'unknown',
      role: g?.role || 'unknown',
      bullet_count: g?.bullets?.length || 0
    })),
    
    // Bloom analysis
    bloom: {
      average_level: overallBloom.averageLevel || 3.5,
      distribution: overallBloom.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      classification: overallBloom.classification || 'unknown',
      assessment: getBloomAssessment(overallBloom.averageLevel || 3.5, seniority.level),
      multiplier: calculateBloomMultiplier(overallBloom.averageLevel || 3.5, seniority.level)
    },
    
    // Verb analysis
    verb_analysis: {
      average_strength: verbAnalysis.averageStrength || 5,
      classification: verbAnalysis.classification || 'moderate',
      strong_count: verbAnalysis.strongCount || 0,
      weak_count: verbAnalysis.weakCount || 0
    },
    
    // Metrics
    metrics: {
      strong_count: (metrics.currency?.length || 0) + (metrics.percentages?.length || 0) + (metrics.volume?.length || 0),
      weak_count: metrics.weak?.length || 0,
      has_baseline: (metrics.time?.length || 0) > 0,
      strength_score: metricStrength || 50
    },
    
    // Seniority
    seniority: {
      level: seniority.level || 'mid',
      confidence: seniority.confidence || 'low',
      years_detected: seniority.years_detected || 0
    },
    
    // Skills & certifications
    skills_count: skillsCount || 0,
    skills_list: (skillsList || []).slice(0, 30),
    certifications_count: certificationsCount || 0,
    certifications_list: (certificationsList || []).slice(0, 20),
    languages_count: languagesCount || 0,
    
    // Industry & role
    industry: industry || 'unknown',
    role_type: roleType || 'unknown',
    
    // Top achievements
    top_achievements: topAchievements || [],
    
    // Scores
    ats_score: atsScore?.total || 70,
    ats_label: atsScore?.label || 'Moderate',
    ats_breakdown: atsScore?.breakdown || {},
    
    credibility_score: credibility?.score || 70,
    credibility_label: credibility?.label || 'Moderate',
    credibility_flags: credibility?.flags || {},
    
    semantic_position: semanticPosition?.position_score || 0,
    semantic_label: semanticPosition?.position_label || 'Perfectly positioned',
    semantic_alignment: 7,
    detected_level: semanticPosition?.detected_level || 'Mid',
    
    // RIASEC
    riasec: riasecResult ? {
      candidate_codes: riasecResult.candidate_codes || '',
      jd_codes: riasecResult.jd_codes || null,
      candidate_scores: riasecResult.candidate_scores || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      jd_scores: riasecResult.jd_scores || null,
      match_percent: riasecResult.match_percent || null,
      multiplier: riasecResult.multiplier || 1.0,
      insight: riasecResult.insight || '',
      profile_description: riasecResult.profile_description || '',
      confidence: riasecResult.confidence || 0
    } : null,
    
    // JD comparison (if available)
    jd_comparison: jdFeatures ? {
      seniority_gap: levelGap,
      years_gap: yearsGap,
      keyword_match_rate: keywordMatchRate,
      skills_match_rate: skillsMatchRate,
      certifications_match: matchingCertifications,
      fit_score: fitScore?.score || 50,
      fit_label: fitScore?.label || 'Moderate',
      critical_keywords_missing: jdFeatures.critical_keywords?.missing || [],
      responsibilities: jdFeatures.responsibilities || [],
      requirements: jdFeatures.requirements || []
    } : null,
    
    // Buzzwords
    buzzword_count: buzzwords?.total || 0,
    buzzword_penalty: buzzwords?.penaltyScore || 0,
    
    // Section presence
    has_summary: !!(sections && sections.summary),
    has_skills_section: !!(sections && sections.skills),
    has_projects_section: !!(sections && sections.projects),
    
    // Original summary
    original_summary: extractOriginalSummary(resumeText, sections)
  };
  
  return output;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Extract skills list from resume text
 */
function extractSkillsList(resumeText) {
  const skills = new Set();
  const lowerText = resumeText.toLowerCase();
  
  // Safety check for TECHNICAL_SKILLS
  if (!TECHNICAL_SKILLS || typeof TECHNICAL_SKILLS !== 'object') {
    console.warn('extractSkillsList: TECHNICAL_SKILLS not available');
    return [];
  }
  
  const allSkills = [];
  for (const category of Object.values(TECHNICAL_SKILLS)) {
    if (Array.isArray(category)) {
      allSkills.push(...category);
    }
  }
  
  for (const skill of allSkills) {
    if (!skill || typeof skill !== 'string') continue; // Skip invalid entries
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lowerText)) {
      skills.add(skill);
    }
  }
  
  return Array.from(skills);
}

/**
 * Extract certifications list from resume text
 */
function extractCertificationsList(resumeText) {
  const certs = new Set();
  const lowerText = resumeText.toLowerCase();
  
  // Safety check for CERTIFICATIONS
  if (!CERTIFICATIONS || typeof CERTIFICATIONS !== 'object') {
    console.warn('extractCertificationsList: CERTIFICATIONS not available');
    return [];
  }
  
  for (const category of Object.values(CERTIFICATIONS)) {
    if (!Array.isArray(category)) continue;
    for (const cert of category) {
      if (!cert || typeof cert !== 'string') continue; // Skip invalid entries
      const escaped = cert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerText)) {
        certs.add(cert);
      }
    }
  }
  
  return Array.from(certs);
}

/**
 * Extract top 3-5 achievements from bullets
 */
function extractTopAchievements(bullets, bloomResults) {
  if (!bullets || bullets.length === 0) return [];
  
  const bulletScores = bullets.map((bullet, idx) => ({
    text: bullet?.original_text || '',
    bloom_level: bloomResults[idx]?.level || 3.0,
    has_metric: /\d+%|\$\d+|\d+\s*(million|billion|thousand|k|m)/i.test(bullet?.original_text || '')
  }));
  
  bulletScores.sort((a, b) => {
    if (a.bloom_level !== b.bloom_level) return b.bloom_level - a.bloom_level;
    if (a.has_metric !== b.has_metric) return a.has_metric ? -1 : 1;
    return 0;
  });
  
  return bulletScores.slice(0, 5).map(b => ({
    achievement: b.text.substring(0, 150),
    bloom_level: b.bloom_level,
    has_metric: b.has_metric
  }));
}

/**
 * Generate bloom assessment text
 */
function getBloomAssessment(averageLevel, seniorityLevel) {
  const expectedLevels = { entry: 2.5, mid: 3.5, senior: 4.5, executive: 5.5 };
  const expected = expectedLevels[seniorityLevel] || 3.5;
  const gap = (averageLevel || 3.5) - expected;
  
  if (gap > 1.0) {
    return "Your language suggests higher cognitive complexity than expected. Ensure claims are fully supported with evidence.";
  } else if (gap > 0.3) {
    return "Your cognitive complexity is slightly above expectations for your level.";
  } else if (gap < -1.0) {
    return "Your language suggests lower cognitive complexity than expected. Use stronger action verbs and add strategic framing.";
  } else if (gap < -0.3) {
    return "Your cognitive complexity is slightly below expectations. Consider adding more analytical language.";
  } else {
    return "Your cognitive complexity aligns well with expectations for your level.";
  }
}

/**
 * Calculate bloom multiplier for interview likelihood
 */
function calculateBloomMultiplier(averageLevel, seniorityLevel) {
  const expectedLevels = { entry: 2.5, mid: 3.5, senior: 4.5, executive: 5.5 };
  const expected = expectedLevels[seniorityLevel] || 3.5;
  const ratio = (averageLevel || 3.5) / expected;
  return Math.min(1.25, Math.max(0.75, ratio));
}

/**
 * Extract original summary from resume
 */
function extractOriginalSummary(resumeText, sections) {
  // Safety check
  if (!sections) return null;
  if (sections.summary && typeof sections.summary === 'string') {
    return sections.summary.substring(0, 500);
  }
  
  const lines = resumeText.split('\n');
  let startIdx = 0;
  
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('@') || line.includes('linkedin') || line.match(/[\d\s-]{10,}/)) {
      startIdx = i + 1;
    } else if (line.trim().length > 50) {
      startIdx = i;
      break;
    }
  }
  
  if (startIdx < lines.length) {
    let summary = lines[startIdx].trim();
    if (summary.length < 100 && startIdx + 1 < lines.length) {
      summary += ' ' + lines[startIdx + 1].trim();
    }
    return summary.substring(0, 500);
  }
  
  return null;
}

/**
 * Calculate keyword match rate between resume and JD
 */
function calculateKeywordMatchRate(resumeText, jdText) {
  if (!jdText || typeof jdText !== 'string') {
    return { matchRate: 0, matchedKeywords: [], missingKeywords: [], criticalKeywords: { matched: [], missing: [] } };
  }
  
  const jdWords = jdText.split(/\s+/);
  const criticalKeywords = [];
  
  for (const word of jdWords) {
    const clean = word.replace(/[^\w]/g, '');
    if (clean.length > 3 && /[A-Z]/.test(clean) && !/^(the|and|for|with|this|that|from|have|will|should|would|could|their|they|what|when|where|which|while|your|please|note|refer)$/i.test(clean)) {
      criticalKeywords.push(clean.toLowerCase());
    }
  }
  
  const uniqueKeywords = [...new Set(criticalKeywords)];
  const lowerResume = (resumeText || '').toLowerCase();
  
  let matchCount = 0;
  const matched = [];
  const missing = [];
  
  for (const keyword of uniqueKeywords.slice(0, 50)) {
    if (lowerResume.includes(keyword)) {
      matchCount++;
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }
  
  const matchRate = uniqueKeywords.length > 0 ? (matchCount / uniqueKeywords.length) * 100 : 0;
  
  return {
    matchRate: Math.round(matchRate),
    matchedKeywords: matched.slice(0, 20),
    missingKeywords: missing.slice(0, 20),
    criticalKeywords: { matched, missing }
  };
}

/**
 * Calculate certification match rate
 */
function calculateCertMatchRate(resumeCerts, jdCerts) {
  const resumeCertSet = new Set();
  
  // Safety check
  if (resumeCerts && resumeCerts.matches) {
    for (const certs of Object.values(resumeCerts.matches)) {
      if (Array.isArray(certs)) {
        certs.forEach(c => {
          if (c && typeof c === 'string') resumeCertSet.add(c.toLowerCase());
        });
      }
    }
  }
  
  const jdCertSet = new Set();
  if (jdCerts && jdCerts.matches) {
    for (const certs of Object.values(jdCerts.matches)) {
      if (Array.isArray(certs)) {
        certs.forEach(c => {
          if (c && typeof c === 'string') jdCertSet.add(c.toLowerCase());
        });
      }
    }
  }
  
  let matchCount = 0;
  for (const cert of jdCertSet) {
    for (const resumeCert of resumeCertSet) {
      if (resumeCert.includes(cert) || cert.includes(resumeCert) || 
          Math.abs(resumeCert.length - cert.length) < 3) {
        matchCount++;
        break;
      }
    }
  }
  
  return { matchCount, totalJdCerts: jdCertSet.size };
}

/**
 * Calculate skills match rate
 */
function calculateSkillsMatchRate(resumeSkills, jdText) {
  if (!jdText || typeof jdText !== 'string') {
    return { matchRate: 0, matchCount: 0, totalJdSkills: 0 };
  }
  
  const jdSkills = extractSkillsList(jdText);
  const resumeSkillSet = new Set((resumeSkills || []).map(s => s.toLowerCase()));
  const jdSkillSet = new Set(jdSkills.map(s => s.toLowerCase()));
  
  let matchCount = 0;
  for (const jdSkill of jdSkillSet) {
    if (resumeSkillSet.has(jdSkill)) {
      matchCount++;
    }
  }
  
  const matchRate = jdSkillSet.size > 0 ? (matchCount / jdSkillSet.size) * 100 : 0;
  
  return { matchRate: Math.round(matchRate), matchCount, totalJdSkills: jdSkillSet.size };
}

/**
 * Extract titles from bullet groups
 */
function extractTitles(bulletGroups) {
  const titles = [];
  if (!bulletGroups || !Array.isArray(bulletGroups)) return titles;
  
  for (const group of bulletGroups) {
    if (group && group.role && typeof group.role === 'string' && group.role.trim().length > 0) {
      titles.push({ 
        title: group.role, 
        company: group.company || null 
      });
    }
  }
  return titles;
}