// src/utils/buzzwords.js

/**
 * Comprehensive buzzword dictionary for deterministic detection
 * Separated by severity/annoyance level
 */

export const BUZZWORDS = {
    // High severity – meaningless, always flag if unsupported
    high: [
      "hardworking", "team player", "self-starter", "go-getter", "rockstar", "ninja",
      "guru", "wizard", "visionary", "synergy", "proactive", "results-driven",
      "passionate", "motivated", "dedicated", "enthusiastic", "dynamic"
    ],
    
    // Medium severity – overused but sometimes meaningful
    medium: [
      "detail-oriented", "fast learner", "creative", "innovative", "strategic thinker",
      "problem solver", "critical thinker", "thought leader", "best in class",
      "world class", "cutting edge", "best practices", "value add", "low hanging fruit"
    ],
    
    // Low severity – acceptable if supported by evidence
    low: [
      "leadership", "communication", "collaboration", "adaptability", "flexibility",
      "resilience", "initiative", "ownership", "accountability", "integrity"
    ]
  };
  
  // Flatten for lookup
  const ALL_BUZZWORDS = [...BUZZWORDS.high, ...BUZZWORDS.medium, ...BUZZWORDS.low];
  const BUZZWORD_SET = new Set(ALL_BUZZWORDS.map(w => w.toLowerCase()));
  
  /**
   * Detects buzzwords in text and classifies by severity
   * @param {string} text - The text to analyze
   * @returns {Object} Buzzword detection results
   */
  export function detectBuzzwords(text) {
    if (!text || typeof text !== 'string') {
      return { total: 0, high: [], medium: [], low: [], penaltyScore: 0 };
    }
    
    const lowerText = text.toLowerCase();
    const found = { high: [], medium: [], low: [] };
    
    // Check each buzzword
    for (const word of BUZZWORDS.high) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerText)) {
        found.high.push(word);
      }
    }
    
    for (const word of BUZZWORDS.medium) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerText)) {
        found.medium.push(word);
      }
    }
    
    for (const word of BUZZWORDS.low) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerText)) {
        found.low.push(word);
      }
    }
    
    const total = found.high.length + found.medium.length + found.low.length;
    
    // Calculate penalty (high severity words count more)
    const penaltyScore = (found.high.length * 3) + (found.medium.length * 2) + (found.low.length * 1);
    
    return {
      total,
      high: found.high,
      medium: found.medium,
      low: found.low,
      penaltyScore
    };
  }
  
  /**
   * Checks if a word is a buzzword
   * @param {string} word - The word to check
   * @returns {boolean} True if buzzword
   */
  export function isBuzzword(word) {
    return BUZZWORD_SET.has(word.toLowerCase());
  }