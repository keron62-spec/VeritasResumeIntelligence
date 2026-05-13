// src/utils/verbs.js

/**
 * Comprehensive action verb dictionary with strength scoring (1-10)
 * Used for deterministic verb strength calculation without LLM
 */

export const VERBS = {
    // STRONGEST VERBS (9-10) – Executive / Strategic level
    strongest: [
      { verb: "architected", strength: 10, bloom: 6 },
      { verb: "founded", strength: 10, bloom: 6 },
      { verb: "pioneered", strength: 10, bloom: 6 },
      { verb: "transformed", strength: 10, bloom: 6 },
      { verb: "revolutionized", strength: 10, bloom: 6 },
      { verb: "directed", strength: 9, bloom: 5 },
      { verb: "spearheaded", strength: 9, bloom: 5 },
      { verb: "orchestrated", strength: 9, bloom: 5 },
      { verb: "championed", strength: 9, bloom: 5 },
      { verb: "established", strength: 9, bloom: 5 },
      { verb: "built", strength: 9, bloom: 5 },
      { verb: "created", strength: 9, bloom: 6 },
      { verb: "designed", strength: 9, bloom: 6 },
      { verb: "formulated", strength: 9, bloom: 5 },
      { verb: "engineered", strength: 9, bloom: 5 }
    ],
  
    // STRONG VERBS (7-8) – Management / Ownership level
    strong: [
      { verb: "led", strength: 8, bloom: 5 },
      { verb: "managed", strength: 7, bloom: 5 },
      { verb: "drove", strength: 8, bloom: 5 },
      { verb: "executed", strength: 7, bloom: 4 },
      { verb: "delivered", strength: 7, bloom: 3 },
      { verb: "achieved", strength: 7, bloom: 3 },
      { verb: "owned", strength: 8, bloom: 5 },
      { verb: "operationalized", strength: 8, bloom: 4 },
      { verb: "implemented", strength: 7, bloom: 4 },
      { verb: "deployed", strength: 7, bloom: 4 },
      { verb: "developed", strength: 7, bloom: 6 },
      { verb: "initiated", strength: 7, bloom: 4 },
      { verb: "launched", strength: 7, bloom: 4 },
      { verb: "oversaw", strength: 7, bloom: 5 },
      { verb: "supervised", strength: 7, bloom: 5 },
      { verb: "coordinated", strength: 7, bloom: 4 },
      { verb: "negotiated", strength: 7, bloom: 5 },
      { verb: "closed", strength: 8, bloom: 3 },
      { verb: "generated", strength: 7, bloom: 3 },
      { verb: "increased", strength: 7, bloom: 3 },
      { verb: "reduced", strength: 7, bloom: 3 },
      { verb: "improved", strength: 7, bloom: 3 },
      { verb: "optimized", strength: 8, bloom: 4 },
      { verb: "streamlined", strength: 8, bloom: 4 },
      { verb: "accelerated", strength: 8, bloom: 3 }
    ],
  
    // MODERATE VERBS (4-6) – Associate / Coordinator level
    moderate: [
      { verb: "facilitated", strength: 5, bloom: 4 },
      { verb: "coordinated", strength: 5, bloom: 4 },
      { verb: "organized", strength: 4, bloom: 4 },
      { verb: "planned", strength: 5, bloom: 3 },
      { verb: "scheduled", strength: 4, bloom: 3 },
      { verb: "monitored", strength: 5, bloom: 4 },
      { verb: "tracked", strength: 4, bloom: 3 },
      { verb: "analyzed", strength: 6, bloom: 4 },
      { verb: "evaluated", strength: 6, bloom: 5 },
      { verb: "assessed", strength: 5, bloom: 5 },
      { verb: "researched", strength: 5, bloom: 4 },
      { verb: "investigated", strength: 6, bloom: 4 },
      { verb: "documented", strength: 4, bloom: 2 },
      { verb: "prepared", strength: 4, bloom: 3 },
      { verb: "compiled", strength: 4, bloom: 3 },
      { verb: "maintained", strength: 4, bloom: 2 },
      { verb: "updated", strength: 4, bloom: 2 },
      { verb: "supported", strength: 5, bloom: 3 },
      { verb: "assisted", strength: 4, bloom: 2 },
      { verb: "collaborated", strength: 5, bloom: 4 },
      { verb: "partnered", strength: 5, bloom: 4 },
      { verb: "liaised", strength: 5, bloom: 4 },
      { verb: "communicated", strength: 4, bloom: 2 },
      { verb: "presented", strength: 5, bloom: 3 },
      { verb: "reported", strength: 4, bloom: 2 }
    ],
  
    // WEAK VERBS (1-3) – Entry level / Passive
    weak: [
      { verb: "helped", strength: 2, bloom: 2 },
      { verb: "assisted with", strength: 2, bloom: 2 },
      { verb: "supported", strength: 2, bloom: 2 },
      { verb: "contributed to", strength: 2, bloom: 2 },
      { verb: "participated in", strength: 1, bloom: 2 },
      { verb: "worked on", strength: 1, bloom: 2 },
      { verb: "responsible for", strength: 2, bloom: 2 },
      { verb: "tasked with", strength: 2, bloom: 2 },
      { verb: "involved in", strength: 1, bloom: 2 },
      { verb: "aided", strength: 2, bloom: 2 },
      { verb: "served as", strength: 2, bloom: 2 },
      { verb: "acted as", strength: 2, bloom: 2 }
    ]
  };
  
  // Flatten for quick lookup
  const VERB_LOOKUP = new Map();
  
  [...VERBS.strongest, ...VERBS.strong, ...VERBS.moderate, ...VERBS.weak].forEach(v => {
    VERB_LOOKUP.set(v.verb, { strength: v.strength, bloom: v.bloom });
  });
  
  /**
   * Gets the strength score for a verb (1-10)
   * @param {string} verb - The verb to check
   * @returns {number} Strength score (1-10), defaults to 3 if not found
   */
  export function getVerbStrength(verb) {
    const lowerVerb = verb.toLowerCase().trim();
    const found = VERB_LOOKUP.get(lowerVerb);
    return found ? found.strength : 3; // Default to moderate-low if unknown
  }
  
  /**
   * Gets the Bloom level contribution for a verb (1-6)
   * @param {string} verb - The verb to check
   * @returns {number} Bloom level (1-6), defaults to 3 if not found
   */
  export function getVerbBloomLevel(verb) {
    const lowerVerb = verb.toLowerCase().trim();
    const found = VERB_LOOKUP.get(lowerVerb);
    return found ? found.bloom : 3;
  }
  
  /**
   * Analyzes all verbs in a text and returns average strength
   * @param {string} text - The text to analyze
   * @returns {Object} Analysis results
   */
  export function analyzeVerbs(text) {
    if (!text || typeof text !== 'string') {
      return { averageStrength: 0, strongCount: 0, weakCount: 0, moderateCount: 0, verbsFound: [] };
    }
    
    const words = text.toLowerCase().split(/\s+/);
    let totalStrength = 0;
    let strongCount = 0;
    let weakCount = 0;
    let moderateCount = 0;
    const verbsFound = [];
    
    for (const word of words) {
      // Remove punctuation
      const cleanWord = word.replace(/[^\w\s]/g, '');
      const strength = getVerbStrength(cleanWord);
      
      if (strength > 0) {
        verbsFound.push({ verb: cleanWord, strength });
        totalStrength += strength;
        
        if (strength >= 7) strongCount++;
        else if (strength >= 4) moderateCount++;
        else weakCount++;
      }
    }
    
    const averageStrength = verbsFound.length > 0 ? totalStrength / verbsFound.length : 0;
    
    return {
      averageStrength,
      strongCount,
      moderateCount,
      weakCount,
      verbsFound,
      classification: averageStrength >= 7 ? "strong" : averageStrength >= 4 ? "moderate" : "weak"
    };
  }
  
  /**
   * Categorizes verb strength level for JD seniority matching
   * @param {number} strength - Average verb strength
   * @returns {string} Category
   */
  export function getVerbCategory(strength) {
    if (strength >= 8) return "executive";
    if (strength >= 6) return "senior";
    if (strength >= 4) return "mid";
    return "entry";
  }