// src/utils/deterministicScorer.js

import { analyzeVerbs, getVerbCategory } from './verbs.js';
import { detectBuzzwords } from './buzzwords.js';
import { calculateMetricStrength } from './metricsPatterns.js';
import { calculateDeterministicBloom, getBloomGapAnalysis } from './deterministicBloom.js';
import { detectJobHopping, detectCareerGaps } from './dateParser.js';
import { detectSeniorityFromText } from './seniorityDetector.js';
import { detectIndustry } from './industryKeywords.js';
import { countTechnicalSkills } from './skillDictionary.js';
import { countCertifications } from './certifications.js';
import { countLanguages } from './commonDictionaries.js';

/**
 * Complete deterministic ATS scorer
 * Calculates scores without LLM using only pattern matching and dictionaries
 */
export function calculateDeterministicATSScore(resumeText, extractedData = {}) {
  if (!resumeText) return { total: 0, breakdown: {} };
  
  // Header & Contact (10 points)
  let headerScore = 10;
  if (!resumeText.match(/[A-Z][a-z]+ [A-Z][a-z]+/)) headerScore -= 3;
  if (!resumeText.match(/[\d\s-]{10,}/)) headerScore -= 2;
  if (!resumeText.match(/@/)) headerScore -= 2;
  if (!resumeText.match(/linkedin\.com\/in\//i)) headerScore -= 2;
  headerScore = Math.max(0, headerScore);
  
  // Keyword Density (20 points) – requires extracted keywords from JD
  let keywordScore = 15; // Default moderate score
  if (extractedData.keywordMatchRate !== undefined) {
    keywordScore = Math.min(20, Math.round((extractedData.keywordMatchRate / 100) * 20));
  }
  
  // Quantified Results (20 points)
  const metricStrength = calculateMetricStrength(resumeText);
  let quantifiedScore = Math.min(20, Math.round((metricStrength / 100) * 20));
  
  // Action Verbs (15 points)
  const verbAnalysis = analyzeVerbs(resumeText);
  let verbScore = 0;
  if (verbAnalysis.averageStrength >= 7) verbScore = 15;
  else if (verbAnalysis.averageStrength >= 6) verbScore = 13;
  else if (verbAnalysis.averageStrength >= 5) verbScore = 11;
  else if (verbAnalysis.averageStrength >= 4) verbScore = 9;
  else if (verbAnalysis.averageStrength >= 3) verbScore = 6;
  else verbScore = 3;
  
  // Formatting & Structure (10 points)
  let formatScore = 10;
  const bulletChars = resumeText.match(/[•\-*○◆▶]/g);
  if (bulletChars && new Set(bulletChars).size > 1) formatScore -= 2;
  const datePattern = /(19|20)\d{2}/g;
  const dates = resumeText.match(datePattern);
  if (dates && new Set(dates).size < 2) formatScore -= 2;
  if (resumeText.includes("table") || resumeText.includes("colspan")) formatScore -= 2;
  formatScore = Math.max(0, formatScore);
  
  // Skills Section (10 points)
  let skillsScore = 7;
  if (resumeText.match(/skills/i)) skillsScore += 2;
  if (extractedData.skillsCount && extractedData.skillsCount > 5) skillsScore += 1;
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
  if (resumeText.match(/doi|arxiv|conference|proceeding/i)) publicationsScore += 2;
  
  // Recruiter Scan Penalty
  let scanPenalty = 0;
  const firstFewLines = resumeText.split('\n').slice(0, 10).join(' ');
  if (!firstFewLines.match(/summary|profile|about/i)) scanPenalty += 2;
  if (!firstFewLines.match(/\d+%/)) scanPenalty += 3;
  
  // Buzzword Penalty
  const buzzwords = detectBuzzwords(resumeText);
  const buzzwordPenalty = Math.min(5, Math.floor(buzzwords.penaltyScore / 2));
  
  // Calculate total
  const total = headerScore + keywordScore + quantifiedScore + verbScore + formatScore + 
                skillsScore + lengthScore + publicationsScore - scanPenalty - buzzwordPenalty;
  
  return {
    total: Math.max(0, Math.min(100, total)),
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
 * Calculates credibility score deterministically
 * @param {Object} extractedData - Extracted resume data
 * @returns {Object} Credibility score and flags
 */
export function calculateDeterministicCredibility(extractedData) {
  let score = 100;
  const flags = [];
  
  // Title jumps
  if (extractedData.titleJumps && extractedData.titleJumps.length > 0) {
    score -= extractedData.titleJumps.length * 10;
    flags.push(...extractedData.titleJumps);
  }
  
  // Education-title mismatch
  if (extractedData.hasDirectorTitle && !extractedData.hasBachelors) {
    score -= 15;
    flags.push({ type: "director_without_bachelors", severity: "high" });
  }
  
  if (extractedData.hasExecutiveTitle && !extractedData.hasMasters) {
    score -= 10;
    flags.push({ type: "executive_without_advanced_degree", severity: "medium" });
  }
  
  // Metric plausibility
  if (extractedData.suspiciousMetrics && extractedData.suspiciousMetrics.length > 0) {
    score -= extractedData.suspiciousMetrics.length * 5;
    flags.push(...extractedData.suspiciousMetrics);
  }
  
  // Acting titles
  if (extractedData.hasActingTitle) {
    score -= 5;
    flags.push({ type: "acting_title", severity: "low" });
  }
  
  // Career gaps
  if (extractedData.careerGaps && extractedData.careerGaps.totalGapMonths > 12) {
    score -= Math.min(15, Math.floor(extractedData.careerGaps.totalGapMonths / 6));
    flags.push({ type: "career_gap", severity: "info" });
  }
  
  // Job hopping
  if (extractedData.jobHopping && extractedData.jobHopping.isJobHopper) {
    score -= extractedData.jobHopping.shortTenures.length * 8;
    flags.push({ type: "job_hopping", severity: extractedData.jobHopping.severity });
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    flags,
    label: score >= 80 ? "Credible" : score >= 60 ? "Moderately Credible" : "Questionable"
  };
}

/**
 * Calculates semantic position score deterministically
 * @param {string} resumeText - Resume text
 * @param {number} detectedYears - Years of experience
 * @returns {Object} Position score
 */
export function calculateDeterministicSemanticPosition(resumeText, detectedYears) {
  const verbAnalysis = analyzeVerbs(resumeText);
  const verbCategory = getVerbCategory(verbAnalysis.averageStrength);
  
  // Expected verb category by years
  let expectedCategory = "entry";
  if (detectedYears >= 10) expectedCategory = "executive";
  else if (detectedYears >= 6) expectedCategory = "senior";
  else if (detectedYears >= 3) expectedCategory = "mid";
  
  // Calculate position score (-5 to +5)
  let positionScore = 0;
  
  if (verbCategory === "executive" && expectedCategory === "entry") positionScore = 4.5;
  else if (verbCategory === "executive" && expectedCategory === "mid") positionScore = 2.5;
  else if (verbCategory === "senior" && expectedCategory === "entry") positionScore = 3.0;
  else if (verbCategory === "senior" && expectedCategory === "mid") positionScore = 1.5;
  else if (verbCategory === "mid" && expectedCategory === "entry") positionScore = 1.0;
  else if (verbCategory === "entry" && expectedCategory === "executive") positionScore = -3.5;
  else if (verbCategory === "entry" && expectedCategory === "senior") positionScore = -2.5;
  else if (verbCategory === "mid" && expectedCategory === "executive") positionScore = -2.0;
  else if (verbCategory === "senior" && expectedCategory === "executive") positionScore = -1.0;
  
  return {
    position_score: Math.max(-5, Math.min(5, positionScore)),
    detected_level: expectedCategory,
    confidence: "high",
    label: Math.abs(positionScore) <= 1.5 ? "Perfectly positioned" : 
            Math.abs(positionScore) <= 3.5 ? "Moderately misaligned" : "Severely misaligned"
  };
}