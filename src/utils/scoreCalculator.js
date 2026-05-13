// src/utils/scoreCalculator.js

/**
 * Deterministic score calculator
 * All scoring moved from LLM to deterministic rules
 */

import { analyzeVerbs, getVerbCategory, getVerbStrength } from './verbs.js';
import { detectBuzzwords } from './buzzwords.js';
import { calculateMetricStrength, extractMetrics } from './metricsPatterns.js';
import { calculateDeterministicBloom, analyzeBulletBloom } from './deterministicBloom.js';
import { detectSeniorityFromText } from './seniorityDetector.js';
import { countTechnicalSkills } from './skillDictionary.js';
import { countCertifications } from './certifications.js';
import { countLanguages } from './commonDictionaries.js';

/**
 * Calculate ATS score (0-100)
 */
export function calculateATSScore(resumeText, jdText = null, extractedFeatures = {}) {
  if (!resumeText || typeof resumeText !== 'string') {
    return { total: 0, breakdown: {} };
  }
  
  // Header & Contact (10 points)
  let headerScore = 10;
  if (!resumeText.match(/[A-Z][a-z]+ [A-Z][a-z]+/)) headerScore -= 3;
  if (!resumeText.match(/[\d\s-]{10,}/)) headerScore -= 2;
  if (!resumeText.match(/@/)) headerScore -= 2;
  if (!resumeText.match(/linkedin\.com\/in\//i)) headerScore -= 2;
  if (resumeText.match(/^\d/)) headerScore -= 1; // stray numbers at top
  headerScore = Math.max(0, headerScore);
  
  // Keyword Density (20 points)
  let keywordScore = 15;
  if (extractedFeatures.keywordMatchRate !== undefined) {
    keywordScore = Math.min(20, Math.round((extractedFeatures.keywordMatchRate / 100) * 20));
  }
  
  // Quantified Results (20 points)
  const metricStrength = calculateMetricStrength(resumeText);
  let quantifiedScore = Math.min(20, Math.round((metricStrength / 100) * 20));
  
  // Action Verbs (15 points)
  const verbAnalysis = analyzeVerbs(resumeText);
  let verbScore = 0;
  const avgStrength = verbAnalysis.averageStrength;
  if (avgStrength >= 8) verbScore = 15;
  else if (avgStrength >= 7) verbScore = 13;
  else if (avgStrength >= 6) verbScore = 11;
  else if (avgStrength >= 5) verbScore = 9;
  else if (avgStrength >= 4) verbScore = 7;
  else if (avgStrength >= 3) verbScore = 5;
  else verbScore = 3;
  
  // Formatting & Structure (10 points)
  let formatScore = 10;
  const bulletChars = resumeText.match(/[•\-*○◆▶]/g);
  if (bulletChars && new Set(bulletChars).size > 1) formatScore -= 2;
  const dates = resumeText.match(/\b(19|20)\d{2}\b/g);
  if (dates && new Set(dates).size < 2) formatScore -= 2;
  if (resumeText.includes('table') || resumeText.includes('colspan')) formatScore -= 2;
  if (resumeText.match(/\n\s*\n\s*\n/)) formatScore -= 2; // excessive blank lines
  formatScore = Math.max(0, formatScore);
  
  // Skills Section (10 points)
  let skillsScore = 5;
  if (resumeText.match(/skills/i)) skillsScore += 2;
  if (extractedFeatures.skillsCount && extractedFeatures.skillsCount > 5) skillsScore += 2;
  if (extractedFeatures.certificationsCount && extractedFeatures.certificationsCount > 0) skillsScore += 1;
  skillsScore = Math.min(10, skillsScore);
  
  // Length & Brevity (5 points)
  let lengthScore = 5;
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount > 800) lengthScore = 3;
  if (wordCount > 1200) lengthScore = 1;
  if (wordCount > 2000) lengthScore = 0;
  
  // Publications & Projects (5 points)
  let publicationsScore = 0;
  if (resumeText.match(/publication|published|github|project/i)) publicationsScore = 3;
  if (resumeText.match(/doi|arxiv|conference|proceeding|peer-reviewed/i)) publicationsScore += 2;
  
  // Recruiter Scan Penalty
  let scanPenalty = 0;
  const firstFewLines = resumeText.split('\n').slice(0, 10).join(' ');
  if (!firstFewLines.match(/summary|profile|about/i)) scanPenalty += 2;
  if (!firstFewLines.match(/\d+%/)) scanPenalty += 3;
  if (!firstFewLines.match(/[A-Z][a-z]+ [A-Z][a-z]+/)) scanPenalty += 1;
  
  // Buzzword Penalty
  const buzzwords = detectBuzzwords(resumeText);
  const buzzwordPenalty = Math.min(5, Math.floor(buzzwords.penaltyScore / 2));
  
  // Calculate total
  let total = headerScore + keywordScore + quantifiedScore + verbScore + formatScore + 
              skillsScore + lengthScore + publicationsScore - scanPenalty - buzzwordPenalty;
  
  total = Math.max(0, Math.min(100, total));
  
  // Determine label
  let label = 'Needs Work';
  if (total >= 90) label = 'Excellent';
  else if (total >= 80) label = 'Good';
  else if (total >= 70) label = 'Moderate';
  
  return {
    total,
    label,
    breakdown: {
      header_contact: headerScore,
      keyword_density: keywordScore,
      quantified_results: quantifiedScore,
      action_verbs: verbScore,
      formatting_structure: formatScore,
      skills_section: skillsScore,
      length_brevity: lengthScore,
      publications_projects: publicationsScore,
      recruiter_scan_penalty: scanPenalty,
      buzzword_repetition_penalty: buzzwordPenalty
    }
  };
}

/**
 * Calculate credibility score (0-100)
 */
export function calculateCredibilityScore(resumeText, extractedFeatures = {}) {
  let score = 100;
  const flags = {
    career_plausibility_flags: [],
    education_title_flags: [],
    metric_plausibility_flags: [],
    acting_title_flags: [],
    promotion_signals: []
  };
  
  // Title jump detection
  const titles = extractedFeatures.titles || [];
  for (let i = 1; i < titles.length; i++) {
    const prevLevel = getTitleLevel(titles[i-1].title);
    const currLevel = getTitleLevel(titles[i].title);
    const yearsBetween = titles[i].startYear - titles[i-1].endYear;
    
    if (currLevel - prevLevel >= 2 && yearsBetween < 2) {
      flags.career_plausibility_flags.push({
        type: 'title_jump',
        issue: `Promoted from ${titles[i-1].title} to ${titles[i].title} in less than 2 years (${yearsBetween} years)`,
        suggestion: 'Add narrative explaining accelerated trajectory'
      });
      score -= 10;
    }
  }
  
  // Education-title fit
  const hasBachelors = /bachelor|ba|bs|bsc|undergraduate/i.test(resumeText);
  const hasMasters = /master|msc|ms|ma|mba|mph/i.test(resumeText);
  const hasDoctorate = /phd|doctorate|doctoral/i.test(resumeText);
  const hasExecutiveTitle = /executive|director|chief|vp|svp|evp|head of/i.test(resumeText);
  const hasDirectorTitle = /director|head of|manager of/i.test(resumeText);
  
  if (hasExecutiveTitle && !hasMasters && !hasDoctorate) {
    flags.education_title_flags.push({
      type: 'executive_without_advanced_degree',
      issue: 'Executive title but no advanced degree listed',
      suggestion: 'Highlight executive education, certifications, or equivalent experience'
    });
    score -= 10;
  }
  
  if (hasDirectorTitle && !hasBachelors) {
    flags.education_title_flags.push({
      type: 'director_without_bachelors',
      issue: 'Director title but no bachelor\'s degree listed',
      suggestion: 'Add relevant certifications or experience that compensates'
    });
    score -= 15;
  }
  
  // Metric plausibility
  const metrics = extractMetrics(resumeText);
  if (metrics.weak.length > 3) {
    flags.metric_plausibility_flags.push({
      type: 'missing_baseline',
      issue: `Multiple metrics (${metrics.weak.length}) without baseline context`,
      suggestion: 'Add before/after comparisons to make metrics meaningful'
    });
    score -= Math.min(15, metrics.weak.length * 3);
  }
  
  // Check for suspiciously round numbers
  const roundNumbers = metrics.percentages.filter(p => p === '100%' || p === '50%' || p === '25%');
  if (roundNumbers.length > 0) {
    flags.metric_plausibility_flags.push({
      type: 'suspiciously_round',
      issue: `${roundNumbers.length} metric(s) show exactly ${roundNumbers.join(', ')} without context`,
      suggestion: 'Add specific baseline numbers to support these figures'
    });
    score -= roundNumbers.length * 3;
  }
  
  // Acting title detection
  if (/(?:acting|interim)\s+(?:director|manager|lead|head)/i.test(resumeText)) {
    flags.acting_title_flags.push({
      type: 'acting_title',
      issue: 'Acting title detected without permanent transition evidence',
      suggestion: 'Clarify if role became permanent or add specific achievements during interim period'
    });
    score -= 5;
  }
  
  // Promotion signals (positive)
  const promotionMatches = resumeText.match(/(\w+)\s*[→>]\s*(\w+)/g);
  if (promotionMatches) {
    flags.promotion_signals = promotionMatches.map(m => m.trim());
    score += Math.min(10, promotionMatches.length * 2);
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let label = 'Low Credibility';
  if (score >= 90) label = 'Highly Credible';
  else if (score >= 80) label = 'Credible';
  else if (score >= 70) label = 'Moderately Credible';
  else if (score >= 60) label = 'Questionable';
  
  return { score, label, flags };
}

/**
 * Helper: Get title level (1-4)
 */
function getTitleLevel(title) {
  const lowerTitle = title.toLowerCase();
  if (/(?:executive|chief|director|head|vp|svp|evp|partner)/i.test(lowerTitle)) return 4;
  if (/(?:senior|lead|principal)/i.test(lowerTitle)) return 3;
  if (/(?:manager|coordinator|specialist|analyst|officer)/i.test(lowerTitle)) return 2;
  return 1;
}

/**
 * Calculate semantic position score (-5 to +5)
 */
export function calculateSemanticPosition(resumeText, detectedYears) {
  const verbAnalysis = analyzeVerbs(resumeText);
  const avgStrength = verbAnalysis.averageStrength;
  
  // Expected verb strength by years
  let expectedStrength = 3;
  if (detectedYears >= 10) expectedStrength = 8;
  else if (detectedYears >= 6) expectedStrength = 6;
  else if (detectedYears >= 3) expectedStrength = 5;
  
  const strengthGap = avgStrength - expectedStrength;
  
  // Convert to -5 to +5 scale
  let positionScore = 0;
  if (strengthGap > 3) positionScore = 4;
  else if (strengthGap > 2) positionScore = 3;
  else if (strengthGap > 1) positionScore = 2;
  else if (strengthGap > 0.5) positionScore = 1;
  else if (strengthGap < -3) positionScore = -4;
  else if (strengthGap < -2) positionScore = -3;
  else if (strengthGap < -1) positionScore = -2;
  else if (strengthGap < -0.5) positionScore = -1;
  
  // Determine label and color
  let label = 'Perfectly positioned';
  let color = 'green';
  let severity = 'none';
  
  if (Math.abs(positionScore) > 3.5) {
    label = positionScore > 0 ? 'Severely Over-positioned' : 'Severely Under-positioned';
    color = 'red';
    severity = 'severe';
  } else if (Math.abs(positionScore) > 1.5) {
    label = positionScore > 0 ? 'Moderately Over-positioned' : 'Moderately Under-positioned';
    color = 'orange';
    severity = 'moderate';
  }
  
  const semanticMultiplier = Math.max(0.5, Math.min(1.0, (100 - (Math.abs(positionScore) * 10)) / 100));
  
  let detectedLevel = 'Mid/Associate';
  if (detectedYears >= 9) detectedLevel = 'Executive/Director';
  else if (detectedYears >= 6) detectedLevel = 'Senior/Manager';
  else if (detectedYears <= 2) detectedLevel = 'Entry/Junior';
  
  return {
    position_score: positionScore,
    position_label: label,
    color: color,
    severity: severity,
    semantic_multiplier: semanticMultiplier,
    detected_level: detectedLevel,
    confidence: 85
  };
}

/**
 * Calculate fit score (0-100) based on JD comparison
 */
export function calculateFitScore(extractedFeatures) {
  let score = 70; // baseline
  
  // Keyword match contribution (up to 30 points)
  const keywordMatchRate = extractedFeatures.keywordMatchRate || 0;
  score += (keywordMatchRate / 100) * 30;
  
  // Level gap penalty
  const levelGap = extractedFeatures.levelGap || 0;
  if (levelGap < 0) {
    score += levelGap * 15; // negative: candidate below JD level
  } else if (levelGap > 2) {
    score -= 20; // severely overqualified
    extractedFeatures.overqualified = true;
  }
  
  // Years gap penalty
  const yearsGap = extractedFeatures.yearsGap || 0;
  if (yearsGap < 0) {
    score += yearsGap * 2; // negative: candidate has fewer years
  }
  
  // Certifications bonus
  const certCount = extractedFeatures.matchingCertifications || 0;
  score += Math.min(10, certCount * 3);
  
  // Skills bonus
  const skillsMatch = extractedFeatures.skillsMatchRate || 0;
  score += (skillsMatch / 100) * 10;
  
  score = Math.max(0, Math.min(100, score));
  
  let label = 'Poor';
  if (score >= 90) label = 'Excellent';
  else if (score >= 80) label = 'Good';
  else if (score >= 70) label = 'Moderate';
  else if (score >= 60) label = 'Fair';
  
  return { score, label };
}