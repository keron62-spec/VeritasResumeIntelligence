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
    baseline_comparison: /(?:from|reduced|increased|grew|dropped)\s+(?:from\s+(\d+(?:,\d+)*)\s+(?:to\s+(\d+(?:,\d+)*))/gi
  };
  
  export function extractMetrics(text) {
    if (!text) return { currency: [], percentages: [], volume: [], time: [], scale: [], weak: [] };
    
    const results = {
      currency: [],
      percentages: [],
      volume: [],
      time: [],
      scale: [],
      weak: []
    };
    
    // Extract currency
    let match;
    while ((match = METRIC_PATTERNS.currency.exec(text)) !== null) {
      results.currency.push(match[0]);
    }
    
    // Extract percentages
    while ((match = METRIC_PATTERNS.percentage.exec(text)) !== null) {
      results.percentages.push(match[0]);
    }
    
    // Extract volume
    while ((match = METRIC_PATTERNS.volume.exec(text)) !== null) {
      results.volume.push(match[0]);
    }
    
    // Extract time comparisons
    while ((match = METRIC_PATTERNS.time.exec(text)) !== null) {
      results.time.push(match[0]);
    }
    
    // Extract scale
    while ((match = METRIC_PATTERNS.scale.exec(text)) !== null) {
      results.scale.push(match[0]);
    }
    
    // Detect weak metrics (number with no baseline context)
    const weakPattern = /\b(\d+(?:\.\d+)?)\b(?!.*(?:from|to|baseline|reduced|increased))/gi;
    while ((match = weakPattern.exec(text)) !== null) {
      // Only flag if not already captured as strong metric
      if (!results.currency.some(m => m.includes(match[0])) &&
          !results.percentages.some(m => m.includes(match[0])) &&
          !results.volume.some(m => m.includes(match[0]))) {
        results.weak.push(match[0]);
      }
    }
    
    return results;
  }
  
  export function calculateMetricStrength(text) {
    const metrics = extractMetrics(text);
    let score = 0;
    
    if (metrics.currency.length > 0) score += 5;
    if (metrics.percentage.length > 0) score += 3;
    if (metrics.volume.length > 0) score += 3;
    if (metrics.time.length > 0) score += 4;
    if (metrics.scale.length > 0) score += 3;
    
    // Penalize weak metrics
    score -= metrics.weak.length * 2;
    
    return Math.max(0, Math.min(100, score));
  }