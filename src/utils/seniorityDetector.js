// src/utils/seniorityDetector.js

export const SENIORITY_PATTERNS = {
    executive: {
      titles: ["chief", "c", "executive director", "managing director", "vp", "evp", "svp", "head of"],
      years: [10, 12, 15],
      years_min: 10
    },
    senior: {
      titles: ["senior", "lead", "principal", "director"],
      years: [6, 7, 8, 9],
      years_min: 6
    },
    mid: {
      titles: ["manager", "specialist", "coordinator", "analyst", "officer"],
      years: [3, 4, 5],
      years_min: 3
    },
    entry: {
      titles: ["associate", "junior", "assistant", "intern", "trainee", "graduate"],
      years: [0, 1, 2],
      years_min: 0
    }
  };
  
  export function detectSeniorityFromText(jdText) {
    if (!jdText || typeof jdText !== 'string') return { level: "mid", confidence: "low" };
    const lowerText = jdText.toLowerCase();
    
    // Check for explicit experience requirements first (most reliable)
    const yearMatch = lowerText.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience)/i);
    if (yearMatch) {
      const years = parseInt(yearMatch[1]);
      if (years >= 10) return { level: "executive", confidence: "high", years_detected: years };
      if (years >= 6) return { level: "senior", confidence: "high", years_detected: years };
      if (years >= 3) return { level: "mid", confidence: "high", years_detected: years };
      if (years < 3) return { level: "entry", confidence: "high", years_detected: years };
    }
    
    // Fallback to title detection
    for (const [level, config] of Object.entries(SENIORITY_PATTERNS)) {
      for (const title of config.titles) {
        const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(lowerText)) {
          return { level, confidence: "medium" };
        }
      }
    }
    
    return { level: "mid", confidence: "low" };
  }