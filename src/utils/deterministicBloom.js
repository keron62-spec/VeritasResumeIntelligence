// src/utils/deterministicBloom.js

import { getVerbBloomLevel, analyzeVerbs } from './verbs.js';
import { extractMetrics, calculateMetricStrength } from './metricsPatterns.js';
import { detectBuzzwords } from './buzzwords.js';

/**
 * Deterministic Bloom Taxonomy Engine
 * Scores bullet points based on verb strength, metrics, scope, and authority indicators
 * No LLM required – 100% deterministic rules
 */

// Authority indicators – words that reduce or increase ownership perception
const AUTHORITY_INDICATORS = {
  // Reduces authority (shared or limited ownership)
  reduces: [
    "assisted", "supported", "helped", "contributed", "participated", "aided",
    "under supervision", "assisted with", "helped with", "shadowed", "observed"
  ],
  
  // Increases authority (full ownership)
  increases: [
    "founded", "architected", "spearheaded", "directed", "owned", "led",
    "established", "built", "created", "designed", "transformed"
  ]
};

// Scale indicators for contextual adjustment
const SCALE_INDICATORS = {
  small: ["team of", "small team", "few", "couple of", "handful", "less than 5"],
  medium: ["team of", "several", "multiple", "group of"],
  large: ["team of 20+", "department of", "division of", "enterprise", "global"],
  enterprise: ["fortune", "global", "enterprise-wide", "company-wide", "multi-national"]
};

// Scope indicators
const SCOPE_INDICATORS = {
  local: ["local", "office", "site", "branch", "departmental"],
  regional: ["regional", "multi-site", "area", "district", "territory"],
  national: ["national", "country-wide", "nationwide", "federal"],
  international: ["international", "global", "worldwide", "multi-country", "cross-border"]
};

/**
 * Extracts team size from bullet text
 * @param {string} text - Bullet text
 * @returns {number} Team size (0 if not found)
 */
function extractTeamSize(text) {
  const patterns = [
    /team\s+of\s+(\d+)/i,
    /(\d+)\s*(?:person|member|staff|employee|people)\s+team/i,
    /leading\s+(\d+)/i,
    /managing\s+(\d+)/i,
    /supervising\s+(\d+)/i,
    /(\d+)\s*(?:direct|indirect)\s+report/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return 0;
}

/**
 * Determines scale adjustment based on team size
 * @param {number} teamSize - Number of team members
 * @returns {number} Adjustment (-1.0 to +1.0)
 */
function getScaleAdjustment(teamSize) {
  if (teamSize === 0) return 0;
  if (teamSize < 5) return -0.5;
  if (teamSize < 20) return 0;
  if (teamSize < 100) return 0.5;
  return 1.0;
}

/**
 * Detects scope of impact from text
 * @param {string} text - Bullet text
 * @returns {string} Scope level and adjustment
 */
function detectScope(text) {
  const lowerText = text.toLowerCase();
  
  for (const scope of Object.keys(SCOPE_INDICATORS)) {
    for (const indicator of SCOPE_INDICATORS[scope]) {
      if (lowerText.includes(indicator)) {
        const adjustments = {
          local: -0.5,
          regional: 0,
          national: 0.5,
          international: 1.0
        };
        return { scope, adjustment: adjustments[scope] };
      }
    }
  }
  
  return { scope: "unknown", adjustment: 0 };
}

/**
 * Detects authority level based on verb choice and indicators
 * @param {string} text - Bullet text
 * @param {string} firstVerb - First verb in the bullet
 * @returns {number} Authority adjustment (-1.0 to +1.0)
 */
function getAuthorityAdjustment(text, firstVerb) {
  const lowerText = text.toLowerCase();
  let adjustment = 0;
  
  // Check for authority-reducing phrases
  for (const indicator of AUTHORITY_INDICATORS.reduces) {
    if (lowerText.includes(indicator) || (firstVerb && firstVerb === indicator)) {
      adjustment -= 0.75;
      break;
    }
  }
  
  // Check for authority-increasing phrases
  for (const indicator of AUTHORITY_INDICATORS.increases) {
    if (lowerText.includes(indicator) || (firstVerb && firstVerb === indicator)) {
      adjustment += 0.5;
      break;
    }
  }
  
  return Math.max(-1.0, Math.min(1.0, adjustment));
}

/**
 * Gets metric bonus based on metric quality
 * @param {string} text - Bullet text
 * @returns {number} Bonus (0 to 1.0)
 */
// In deterministicBloom.js, update the getMetricBonus function
function getMetricBonus(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  const metricStrength = calculateMetricStrength(text);
  
  if (metricStrength >= 80) return 1.0;
  if (metricStrength >= 60) return 0.75;
  if (metricStrength >= 40) return 0.5;
  if (metricStrength >= 20) return 0.25;
  return 0;
}

/**
 * Detects if the bullet describes systemic change
 * @param {string} text - Bullet text
 * @returns {boolean} True if systemic change is indicated
 */
function hasSystemicChange(text) {
  const indicators = [
    "system", "process", "workflow", "methodology", "framework", "standard",
    "procedure", "protocol", "transformed", "changed", "re-engineered",
    "restructured", "reorganized", "redesigned", "rebuilt", "from scratch"
  ];
  
  const lowerText = text.toLowerCase();
  return indicators.some(indicator => lowerText.includes(indicator));
}

/**
 * Calculates deterministic Bloom level for a bullet
 * @param {string} bulletText - The bullet point text
 * @returns {Object} Bloom level and breakdown
 */
export function calculateDeterministicBloom(bulletText) {
  if (!bulletText || typeof bulletText !== 'string') {
    return { level: 2.0, breakdown: { baseLevel: 2, adjustments: [], finalLevel: 2 } };
  }
  
  // Extract first verb
  const words = bulletText.split(/\s+/);
  const firstVerb = words[0]?.replace(/[^\w\s]/g, '').toLowerCase();
  
  // 1. Base Bloom level from verb
  let baseLevel = getVerbBloomLevel(firstVerb);
  
  // 2. Team size adjustment
  const teamSize = extractTeamSize(bulletText);
  const scaleAdjust = getScaleAdjustment(teamSize);
  
  // 3. Scope adjustment
  const { scope, adjustment: scopeAdjust } = detectScope(bulletText);
  
  // 4. Authority adjustment
  const authorityAdjust = getAuthorityAdjustment(bulletText, firstVerb);
  
  // 5. Metric bonus
  const metricBonus = getMetricBonus(bulletText);
  
  // 6. Systemic change bonus
  const systemicBonus = hasSystemicChange(bulletText) ? 0.5 : 0;
  
  // Calculate adjustments
  let adjustments = [
    { name: "scale", value: scaleAdjust },
    { name: "scope", value: scopeAdjust },
    { name: "authority", value: authorityAdjust },
    { name: "metrics", value: metricBonus },
    { name: "systemic", value: systemicBonus }
  ];
  
  let totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.value, 0);
  
  // Cap total adjustment between -1.5 and +1.5
  totalAdjustment = Math.max(-1.5, Math.min(1.5, totalAdjustment));
  
  let finalLevel = baseLevel + totalAdjustment;
  
  // Clamp to 1-6 range
  finalLevel = Math.max(1.0, Math.min(6.0, finalLevel));
  
  // Round to 1 decimal
  finalLevel = Math.round(finalLevel * 10) / 10;
  
  return {
    level: finalLevel,
    breakdown: {
      baseLevel,
      adjustments,
      totalAdjustment,
      teamSize,
      scope
    },
    interpretation: getBloomInterpretation(finalLevel)
  };
}

/**
 * Returns interpretation of Bloom level
 * @param {number} level - Bloom level (1-6)
 * @returns {string} Interpretation
 */
function getBloomInterpretation(level) {
  if (level >= 5.5) return "Create/Evaluate – Strategic leadership, vision setting, transformational work";
  if (level >= 4.5) return "Evaluate/Analyze – Strategic judgment, cross-functional leadership";
  if (level >= 3.5) return "Analyze/Apply – Analytical problem-solving, independent execution";
  if (level >= 2.5) return "Apply/Understand – Practical application, following established frameworks";
  if (level >= 1.5) return "Understand/Remember – Foundational knowledge, supervised work";
  return "Remember – Basic tasks, following instructions";
}

/**
 * Calculates average deterministic Bloom for multiple bullets
 * @param {string[]} bullets - Array of bullet texts
 * @returns {Object} Average Bloom analysis
 */
export function analyzeBulletBloom(bullets) {
  if (!bullets || bullets.length === 0) {
    return { averageLevel: 3.0, bullets: [], distribution: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 } };
  }
  
  const results = [];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let totalLevel = 0;
  
  for (const bullet of bullets) {
    const result = calculateDeterministicBloom(bullet);
    results.push(result);
    totalLevel += result.level;
    const levelBucket = Math.floor(result.level);
    distribution[levelBucket] = (distribution[levelBucket] || 0) + 1;
  }
  
  const averageLevel = totalLevel / bullets.length;
  
  return {
    averageLevel: Math.round(averageLevel * 10) / 10,
    bullets: results,
    distribution,
    classification: averageLevel >= 4.5 ? "strategic" : averageLevel >= 3.0 ? "analytical" : "executional"
  };
}

/**
 * Compares candidate Bloom to expected level for seniority
 * @param {number} candidateBloom - Candidate's average Bloom level
 * @param {string} seniority - Seniority level (entry/mid/senior/executive)
 * @returns {Object} Gap analysis
 */
export function getBloomGapAnalysis(candidateBloom, seniority) {
  const expectedLevels = {
    entry: 2.5,
    mid: 3.5,
    senior: 4.5,
    executive: 5.5
  };
  
  const expectedLevel = expectedLevels[seniority] || 3.5;
  const gap = candidateBloom - expectedLevel;
  
  let interpretation = "";
  let flag = null;
  
  if (gap > 1.0) {
    interpretation = "Your language sounds significantly more strategic than expected. Potential over-positioning risk.";
    flag = "bloom_inflation";
  } else if (gap > 0.5) {
    interpretation = "Your language is somewhat advanced for this level. Ensure claims are supported.";
    flag = "potential_inflation";
  } else if (gap < -1.0) {
    interpretation = "Your language sounds significantly less strategic than expected. Consider stronger action verbs and outcome framing.";
    flag = "bloom_under_selling";
  } else if (gap < -0.5) {
    interpretation = "Your language is somewhat basic for this level. Add strategic context and stronger verbs.";
    flag = "potential_under_selling";
  } else {
    interpretation = "Your cognitive complexity aligns well with expectations for this level.";
    flag = null;
  }
  
  return {
    candidateBloom,
    expectedLevel,
    gap: Math.round(gap * 10) / 10,
    interpretation,
    flag,
    multiplier: Math.min(1.25, Math.max(0.75, candidateBloom / expectedLevel))
  };
}