// src/utils/industryKeywords.js

export const INDUSTRY_KEYWORDS = {
    tech_faang: ["google", "meta", "amazon", "apple", "microsoft", "faang", "big tech", "software engineer", "devops", "cloud", "saas", "paas", "iaas"],
    tech_startup: ["startup", "scaleup", "series a", "series b", "venture backed", "founder", "seed stage", "unicorn", "agile", "lean startup"],
    finance_ib: ["goldman sachs", "jpmorgan", "investment banking", "mergers", "acquisitions", "m&a", "capital markets", "equity research", "leveraged finance"],
    consulting_mbb: ["mckinsey", "bain", "bcg", "strategy consulting", "management consulting", "strategic advisory"],
    consulting_big4: ["deloitte", "pwc", "ey", "kpmg", "big 4", "advisory", "audit", "tax consulting"],
    law_biglaw: ["law firm", "associate attorney", "partner track", "litigation", "corporate law", "amicus", "legal memorandum"],
    healthcare_public: ["who", "paho", "carpha", "cdc", "public health", "epidemiology", "surveillance", "health systems", "pandemic response"],
    intl_dev: ["world bank", "idb", "un", "united nations", "undp", "unicef", "usaid", "dfid", "international development", "humanitarian"],
    government: ["ministry", "government", "public sector", "civil service", "policy", "regulation", "legislation", "public administration"],
    ngo: ["ngo", "nonprofit", "non-profit", "civil society", "foundation", "charity", "advocacy", "grassroots"],
    education: ["university", "college", "school", "academic", "professor", "lecturer", "curriculum", "education", "higher ed", "k-12"],
    manufacturing: ["manufacturing", "factory", "plant", "production", "assembly", "quality control", "supply chain", "logistics", "warehouse"],
    retail: ["retail", "store", "e-commerce", "consumer goods", "fmcg", "merchandising", "inventory", "point of sale"],
    energy: ["oil", "gas", "petroleum", "renewable", "solar", "wind", "energy", "utilities", "grid", "power plant"],
    agriculture: ["agriculture", "farming", "crop", "livestock", "agribusiness", "food security", "rural development"],
    hospitality: ["hotel", "resort", "tourism", "hospitality", "restaurant", "catering", "event", "travel"]
  };
  
  export function detectIndustry(jdText) {
    if (!jdText || typeof jdText !== 'string') return "unknown";
    const lowerText = jdText.toLowerCase();
    
    let bestMatch = { industry: "unknown", score: 0 };
    
    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(lowerText)) {
          score++;
        }
      }
      if (score > bestMatch.score) {
        bestMatch = { industry, score };
      }
    }
    
    return bestMatch.industry;
  }