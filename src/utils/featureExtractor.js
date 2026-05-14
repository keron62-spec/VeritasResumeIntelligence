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
 * Extract all features from resume and JD
 * Returns a compact JSON object ready to send to the worker
 */
export function extractAllFeatures(resumeText, jdText = null) {
  const startTime = Date.now();
  
  // ============================================================
  // RESUME EXTRACTION
  // ============================================================
  
  // Extract bullets
  const bulletResult = extractBullets(resumeText);
  const bullets = bulletResult.bullets;
  const bulletGroups = groupBulletsByRole(bullets);
  
  // Calculate deterministic Bloom across all bullets
  const bulletBloomResults = [];
  for (const bullet of bullets) {
    const bloom = calculateDeterministicBloom(bullet.original_text);
    bulletBloomResults.push(bloom);
  }
  const overallBloom = analyzeBulletBloom(bullets.map(b => b.original_text));
  
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
  const certificationsCount = certDetails.total_count;
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
  
  if (jdText) {
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
    keywordMatchRate = keywordAnalysis.matchRate;
    
    const certAnalysis = calculateCertMatchRate(certDetails, jdCertDetails);
    matchingCertifications = certAnalysis.matchCount;
    
    const skillsAnalysis = calculateSkillsMatchRate(skillsList, jdText);
    skillsMatchRate = skillsAnalysis.matchRate;
    
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
      responsibilities: jdParsed.responsibilities,
      requirements: jdParsed.requirements,
      preferred: jdParsed.preferred,
      critical_keywords: keywordAnalysis.criticalKeywords
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
    bullets: bullets.map(b => ({
      id: b.id,
      section: b.section,
      role: b.role,
      company: b.company,
      original_text: b.original_text,
      bloom_level: bulletBloomResults.find(bl => bl?.level)?.level || 3.0
    })),
    bullet_count: bullets.length,
    bullet_groups: bulletGroups.map(g => ({
      company: g.company,
      role: g.role,
      bullet_count: g.bullets.length
    })),
    
    // Bloom analysis
    bloom: {
      average_level: overallBloom.averageLevel,
      distribution: overallBloom.distribution,
      classification: overallBloom.classification,
      assessment: getBloomAssessment(overallBloom.averageLevel, seniority.level),
      multiplier: calculateBloomMultiplier(overallBloom.averageLevel, seniority.level)
    },
    
    // Verb analysis
    verb_analysis: {
      average_strength: verbAnalysis.averageStrength,
      classification: verbAnalysis.classification,
      strong_count: verbAnalysis.strongCount,
      weak_count: verbAnalysis.weakCount
    },
    
    // Metrics
    metrics: {
      strong_count: metrics.currency.length + metrics.percentages.length + metrics.volume.length,
      weak_count: metrics.weak.length,
      has_baseline: metrics.time.length > 0,
      strength_score: metricStrength
    },
    
    // Seniority
    seniority: {
      level: seniority.level,
      confidence: seniority.confidence,
      years_detected: seniority.years_detected
    },
    
    // Skills & certifications
    skills_count: skillsCount,
    skills_list: skillsList.slice(0, 30),
    certifications_count: certificationsCount,
    certifications_list: certificationsList.slice(0, 20),
    languages_count: languagesCount,
    
    // Industry & role
    industry: industry,
    role_type: roleType,
    
    // Top achievements
    top_achievements: topAchievements,
    
    // Scores
    ats_score: atsScore.total,
    ats_label: atsScore.label,
    ats_breakdown: atsScore.breakdown,
    
    credibility_score: credibility.score,
    credibility_label: credibility.label,
    credibility_flags: credibility.flags,
    
    semantic_position: semanticPosition.position_score,
    semantic_label: semanticPosition.position_label,
    semantic_alignment: 7,
    detected_level: semanticPosition.detected_level,
    
    // RIASEC
    riasec: {
      candidate_codes: riasecResult.candidate_codes,
      jd_codes: riasecResult.jd_codes,
      candidate_scores: riasecResult.candidate_scores,
      jd_scores: riasecResult.jd_scores,
      match_percent: riasecResult.match_percent,
      multiplier: riasecResult.multiplier,
      insight: riasecResult.insight,
      profile_description: riasecResult.profile_description,
      confidence: riasecResult.confidence
    },
    
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
      responsibilities: jdFeatures.responsibilities,
      requirements: jdFeatures.requirements
    } : null,
    
    // Buzzwords
    buzzword_count: buzzwords.total,
    buzzword_penalty: buzzwords.penaltyScore,
    
    // Section presence
    has_summary: !!sections.summary,
    has_skills_section: !!sections.skills,
    has_projects_section: !!sections.projects,
    
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
  
  const allSkills = [];
  for (const category of Object.values(TECHNICAL_SKILLS)) {
    if (Array.isArray(category)) {
      allSkills.push(...category);
    }
  }
  
  for (const skill of allSkills) {
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
  
  for (const category of Object.values(CERTIFICATIONS)) {
    if (Array.isArray(category)) {
      for (const cert of category) {
        const escaped = cert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(lowerText)) {
          certs.add(cert);
        }
      }
    }
  }
  
  return Array.from(certs);
}

/**
 * Extract top 3-5 achievements from bullets
 */
function extractTopAchievements(bullets, bloomResults) {
  const bulletScores = bullets.map((bullet, idx) => ({
    text: bullet.original_text,
    bloom_level: bloomResults[idx]?.level || 3.0,
    has_metric: /\d+%|\$\d+|\d+\s*(million|billion|thousand|k|m)/i.test(bullet.original_text)
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
  const gap = averageLevel - expected;
  
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
  const ratio = averageLevel / expected;
  return Math.min(1.25, Math.max(0.75, ratio));
}

/**
 * Extract original summary from resume
 */
function extractOriginalSummary(resumeText, sections) {
  if (sections.summary) {
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
  const jdWords = jdText.split(/\s+/);
  const criticalKeywords = [];
  
  for (const word of jdWords) {
    const clean = word.replace(/[^\w]/g, '');
    if (clean.length > 3 && /[A-Z]/.test(clean) && !/^(the|and|for|with|this|that|from|have|will|should|would|could|their|they|what|when|where|which|while|your|please|note|refer)$/i.test(clean)) {
      criticalKeywords.push(clean.toLowerCase());
    }
  }
  
  const uniqueKeywords = [...new Set(criticalKeywords)];
  const lowerResume = resumeText.toLowerCase();
  
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
  for (const certs of Object.values(resumeCerts.matches || {})) {
    certs.forEach(c => resumeCertSet.add(c.toLowerCase()));
  }
  
  const jdCertSet = new Set();
  for (const certs of Object.values(jdCerts.matches || {})) {
    certs.forEach(c => jdCertSet.add(c.toLowerCase()));
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
  const jdSkills = extractSkillsList(jdText);
  const resumeSkillSet = new Set(resumeSkills.map(s => s.toLowerCase()));
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
  for (const group of bulletGroups) {
    if (group.role) {
      titles.push({ title: group.role, company: group.company });
    }
  }
  return titles;
}