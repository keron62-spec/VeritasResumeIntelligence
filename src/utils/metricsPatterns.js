// src/utils/metricsPatterns.js

export const METRIC_PATTERNS = {
  // Dollar amounts
  currency: /\$\s*(\d+(?:\.\d+)?)\s*(million|billion|thousand|k|m|b)?/gi,
  
  // Percentages
  percentage: /(\d+(?:\.\d+)?)\s*%/gi,
  
  // Volume (people, users, customers, etc.)
  volume: /(\d+(?:,\d+)*(?:\.\d+)?)\s*(people|user|customer|client|employee|staff|member|participant|beneficiary|patient|student|trainee)/gi,
  
  // Time (reduction, improvement)
  time: /reduced?\s+from\s+(\d+)\s+(days?|hours?|weeks?|months?)\s+to\s+(\d+)\s+(days?|hours?|weeks?|months?)/gi,
  
  // Scale (countries, locations, sites)
  scale: /(\d+)\s*(countries?|states?|locations?|sites?|offices?|branches?|regions?|continents?)/gi,
  
  // Team size
  team_size: /team\s+of\s+(\d+)\s*(people?|staff|members?|employees?)/gi,
  
  // Budget
  budget: /budget\s+(?:of\s+)?\$\s*(\d+(?:\.\d+)?)\s*(million|billion|thousand|k|m|b)?/gi,
  
  // Improvement (without baseline - weak)
  vague_improvement: /improved\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*%/gi,
  
  // Baseline comparison (strong)
  baseline_comparison: /(?:from|reduced|increased|grew|dropped)\s+(?:from\s+)?(\d+(?:,\d+)*)\s+(?:to\s+(\d+(?:,\d+)*))?/gi
};

/**
 * Extracts metrics from text
 * @param {string} text - The text to analyze
 * @returns {Object} Extracted metrics with safe defaults
 */
export function extractMetrics(text) {
  // SAFE: Return default object if text is invalid
  if (!text || typeof text !== 'string') {
    return { 
      currency: [], 
      percentages: [], 
      volume: [], 
      time: [], 
      scale: [], 
      weak: [] 
    };
  }
  
  const results = {
    currency: [],
    percentages: [],
    volume: [],
    time: [],
    scale: [],
    weak: []
  };
  
  try {
    // Extract currency
    const currencyPattern = /\$\s*(\d+(?:\.\d+)?)\s*(million|billion|thousand|k|m|b)?/gi;
    let match;
    while ((match = currencyPattern.exec(text)) !== null) {
      results.currency.push(match[0]);
    }
    
    // Extract percentages
    const percentPattern = /(\d+(?:\.\d+)?)\s*%/gi;
    while ((match = percentPattern.exec(text)) !== null) {
      results.percentages.push(match[0]);
    }
    
    // Extract volume
    const volumePattern = /(\d+(?:,\d+)*(?:\.\d+)?)\s*(people|user|customer|client|employee|staff|member|participant|beneficiary|patient|student|trainee)/gi;
    while ((match = volumePattern.exec(text)) !== null) {
      results.volume.push(match[0]);
    }
    
    // Extract time comparisons
    const timePattern = /reduced?\s+from\s+(\d+)\s+(days?|hours?|weeks?|months?)\s+to\s+(\d+)\s+(days?|hours?|weeks?|months?)/gi;
    while ((match = timePattern.exec(text)) !== null) {
      results.time.push(match[0]);
    }
    
    // Extract scale
    const scalePattern = /(\d+)\s*(countries?|states?|locations?|sites?|offices?|branches?|regions?|continents?)/gi;
    while ((match = scalePattern.exec(text)) !== null) {
      results.scale.push(match[0]);
    }
    
  } catch (e) {
    console.warn('Error extracting metrics:', e);
  }
  
  return results;
}

/**
 * Calculate metric strength score (0-100)
 * @param {string} text - The text to analyze
 * @returns {number} Strength score
 */
export function calculateMetricStrength(text) {
  // SAFE: Return 0 if text is invalid
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  try {
    const metrics = extractMetrics(text);
    
    let score = 0;
    
    // SAFE: Check each property exists before accessing .length
    if (metrics.currency && Array.isArray(metrics.currency) && metrics.currency.length > 0) {
      score += 20;
    }
    if (metrics.percentage && Array.isArray(metrics.percentage) && metrics.percentage.length > 0) {
      score += 15;
    }
    if (metrics.volume && Array.isArray(metrics.volume) && metrics.volume.length > 0) {
      score += 15;
    }
    if (metrics.time && Array.isArray(metrics.time) && metrics.time.length > 0) {
      score += 20;
    }
    if (metrics.scale && Array.isArray(metrics.scale) && metrics.scale.length > 0) {
      score += 15;
    }
    
    // Weak metrics penalty (only if weak exists and is array)
    if (metrics.weak && Array.isArray(metrics.weak)) {
      score -= Math.min(25, metrics.weak.length * 3);
    }
    
    // Cap at 0-100
    return Math.max(0, Math.min(100, score));
    
  } catch (e) {
    console.warn('Error calculating metric strength:', e);
    return 50; // Return neutral score on error
  }
}

/**
 * Calculate baseline comparison strength
 * @param {string} text - The text to analyze
 * @returns {boolean} Whether baseline comparison exists
 */
export function hasBaselineComparison(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  try {
    const baselinePattern = /(?:from|reduced|increased|grew|dropped)\s+(?:from\s+)?\d+(?:,\d+)*\s+(?:to\s+\d+(?:,\d+)*)/i;
    return baselinePattern.test(text);
  } catch (e) {
    return false;
  }
}

/**
 * Extract specific metric values
 * @param {string} text - The text to analyze
 * @returns {Object} Extracted values with safe defaults
 */
export function extractMetricValues(text) {
  if (!text || typeof text !== 'string') {
    return {
      dollar_values: [],
      percentages: [],
      volumes: [],
      time_savings: []
    };
  }
  
  const results = {
    dollar_values: [],
    percentages: [],
    volumes: [],
    time_savings: []
  };
  
  try {
    // Extract dollar values
    const dollarMatches = text.match(/\$\s*(\d+(?:\.\d+)?)\s*(million|billion|thousand|k|m|b)?/gi);
    if (dollarMatches && Array.isArray(dollarMatches)) {
      results.dollar_values = dollarMatches;
    }
    
    // Extract percentages
    const percentMatches = text.match(/(\d+(?:\.\d+)?)\s*%/gi);
    if (percentMatches && Array.isArray(percentMatches)) {
      results.percentages = percentMatches;
    }
    
    // Extract volume numbers (with units)
    const volumeMatches = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:people|users|customers|clients|employees|staff|members|participants|beneficiaries|patients|students|trainees)\b/gi);
    if (volumeMatches && Array.isArray(volumeMatches)) {
      results.volumes = volumeMatches;
    }
    
    // Extract time savings
    const timeMatches = text.match(/reduced?\s+from\s+\d+\s+(?:days?|hours?|weeks?|months?)\s+to\s+\d+\s+(?:days?|hours?|weeks?|months?)/gi);
    if (timeMatches && Array.isArray(timeMatches)) {
      results.time_savings = timeMatches;
    }
    
  } catch (e) {
    console.warn('Error extracting metric values:', e);
  }
  
  return results;
}

/**
 * Check if text has any metrics at all
 * @param {string} text - The text to analyze
 * @returns {boolean} Whether metrics exist
 */
export function hasMetrics(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  try {
    const hasCurrency = /\$\s*\d+/.test(text);
    const hasPercentage = /\d+\s*%/.test(text);
    const hasVolume = /\d+\s*(?:people|users|customers|clients|employees|staff|members)/i.test(text);
    const hasTime = /reduced?\s+from\s+\d+\s+(?:days?|hours?|weeks?|months?)\s+to/i.test(text);
    
    return hasCurrency || hasPercentage || hasVolume || hasTime;
  } catch (e) {
    return false;
  }
}