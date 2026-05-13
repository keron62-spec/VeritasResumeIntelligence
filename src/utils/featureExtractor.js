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
import { countCertifications, getCertificationDetails } from './certifications.js';
import { countLanguages, detectEducationLevel } from './commonDictionaries.js';
import { calculateATSScore, calculateCredibilityScore, calculateSemanticPosition, calculateFitScore } from './scoreCalculator.js';
import { detectJobHopping, detectCareerGaps } from './dateParser.js';
import { detectRoleType } from './jobTitles.js';

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
  
  // Detect languages
  const languagesCount = countLanguages(resumeText);
  
  // Detect industry
  const industry = detectIndustry(resumeText);
  
  // Detect role type
  const roleType = detectRoleType(resumeText);
  
  // Detect sections
  const sections = detectSections(resumeText);
  
  // Calculate ATS score
  const atsScore = calculateATSScore(resumeText, jdText, {
    keywordMatchRate: 0, // Will be updated if JD provided
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
      classification: overallBloom.classification
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
    certifications_count: certificationsCount,
    languages_count: languagesCount,
    
    // Industry & role
    industry: industry,
    role_type: roleType,
    
    // Scores
    ats_score: atsScore.total,
    ats_label: atsScore.label,
    ats_breakdown: atsScore.breakdown,
    
    credibility_score: credibility.score,
    credibility_label: credibility.label,
    credibility_flags: credibility.flags,
    
    semantic_position: semanticPosition.position_score,
    semantic_label: semanticPosition.position_label,
    detected_level: semanticPosition.detected_level,
    
    // JD comparison (if available)
    jd_comparison: jdFeatures ? {
      seniority_gap: levelGap,
      years_gap: yearsGap,
      keyword_match_rate: keywordMatchRate,
      skills_match_rate: skillsMatchRate,
      certifications_match: matchingCertifications,
      fit_score: fitScore?.score || 50,
      fit_label: fitScore?.label || 'Moderate',
      critical_keywords_missing: jdFeatures.critical_keywords?.missing || []
    } : null,
    
    // Buzzwords
    buzzword_count: buzzwords.total,
    buzzword_penalty: buzzwords.penaltyScore,
    
    // Section presence
    has_summary: !!sections.summary,
    has_skills_section: !!sections.skills,
    has_projects_section: !!sections.projects
  };
  
  return output;
}

/**
 * Extract skills list from resume text
 */
function extractSkillsList(resumeText) {
  const skills = new Set();
  const lowerText = resumeText.toLowerCase();
  
  // Flatten all skill categories
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
 * Calculate keyword match rate between resume and JD
 */
function calculateKeywordMatchRate(resumeText, jdText) {
  // Extract important keywords from JD (common technical terms, capitalized words, etc.)
  const jdWords = jdText.split(/\s+/);
  const criticalKeywords = [];
  
  for (const word of jdWords) {
    const clean = word.replace(/[^\w]/g, '');
    if (clean.length > 3 && /[A-Z]/.test(clean) && !/^(the|and|for|with|this|that|from|have|will|should|would|could|their|they|what|when|where|which|while|your|please|note|please|refer)$/i.test(clean)) {
      criticalKeywords.push(clean.toLowerCase());
    }
  }
  
  const uniqueKeywords = [...new Set(criticalKeywords)];
  const lowerResume = resumeText.toLowerCase();
  
  let matchCount = 0;
  const matched = [];
  const missing = [];
  
  for (const keyword of uniqueKeywords.slice(0, 50)) { // Limit to 50 keywords
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
  for (const [category, certs] of Object.entries(resumeCerts.matches || {})) {
    certs.forEach(c => resumeCertSet.add(c.toLowerCase()));
  }
  
  const jdCertSet = new Set();
  for (const [category, certs] of Object.entries(jdCerts.matches || {})) {
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