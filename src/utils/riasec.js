// src/utils/riasec.js

/**
 * Deterministic RIASEC Personality Matching Engine
 * Based on Holland Codes (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
 * 100% deterministic using keyword counting and hexagon distance mapping
 * No LLM required
 */

// ============================================================
// RIASEC KEYWORD DICTIONARIES
// ============================================================

export const RIASEC_KEYWORDS = {
    // Realistic (Hands-on, practical, mechanical)
    R: [
      'build', 'repair', 'operate', 'tools', 'mechanical', 'hardware', 'hands-on', 
      'fix', 'engineer', 'construct', 'assemble', 'maintain', 'physical', 'machinery', 
      'equipment', 'fabricate', 'install', 'calibrate', 'troubleshoot', 'diagnose',
      'manufacturing', 'production', 'assembly', 'welding', 'machinist', 'technician',
      'field service', 'maintenance', 'repair', 'construction', 'blueprint', 'cad',
      'prototype', 'testing', 'quality control', 'inspection', 'safety compliance',
      'lab equipment', 'instrumentation', 'robotics', 'automation', 'mechanical design'
    ],
  
    // Investigative (Analytical, research, data-driven)
    I: [
      'analyze', 'research', 'data', 'investigate', 'study', 'evaluate', 'assess', 
      'statistics', 'science', 'technical', 'model', 'examine', 'calculate', 'forecast', 
      'metrics', 'analytics', 'diagnose', 'scientist', 'laboratory', 'experiment',
      'hypothesis', 'methodology', 'quantitative', 'qualitative', 'literature review',
      'data collection', 'statistical analysis', 'regression', 'correlation', 'insight',
      'discovery', 'innovation', 'patent', 'publication', 'peer review', 'clinical trial',
      'epidemiology', 'biostatistics', 'data science', 'machine learning', 'algorithm'
    ],
  
    // Artistic (Creative, design, expression)
    A: [
      'create', 'design', 'write', 'innovate', 'artistic', 'creative', 'visualize', 
      'brand', 'sketch', 'illustrate', 'compose', 'develop', 'product', 'innovation', 
      'storyboard', 'conceptualize', 'imagine', 'curate', 'exhibit', 'portfolio',
      'typography', 'layout', 'aesthetic', 'user experience', 'ux', 'ui', 'interface',
      'wireframe', 'prototype', 'mockup', 'campaign', 'content', 'storytelling',
      'narrative', 'script', 'video production', 'animation', 'multimedia', 'photography',
      'illustration', 'painting', 'sculpture', 'architecture', 'fashion', 'interior design'
    ],
  
    // Social (Helping, teaching, supporting)
    S: [
      'help', 'teach', 'support', 'collaborate', 'communicate', 'facilitate', 'mentor', 
      'guide', 'train', 'assist', 'counsel', 'coordinate', 'liaise', 'stakeholder', 
      'partnership', 'advocate', 'serve', 'care', 'empathy', 'listening', 'counseling',
      'therapy', 'coaching', 'education', 'instruction', 'curriculum', 'workshop',
      'presentation', 'public speaking', 'community outreach', 'volunteer', 'nonprofit',
      'social services', 'healthcare', 'patient care', 'customer service', 'client relations',
      'team building', 'conflict resolution', 'mediation', 'human resources', 'recruiting'
    ],
  
    // Enterprising (Leading, persuading, business)
    E: [
      'lead', 'sell', 'persuade', 'negotiate', 'manage', 'direct', 'influence', 
      'business', 'revenue', 'profit', 'budget', 'strategize', 'own', 'drive', 
      'spearhead', 'orchestrate', 'oversee', 'executive', 'founder', 'entrepreneur',
      'business development', 'sales', 'marketing', 'brand management', 'client acquisition',
      'partnerships', 'strategic alliances', 'negotiation', 'deal closing', 'proposal',
      'pitch', 'presentation', 'board', 'c-suite', 'p&l', 'profit and loss', 'forecasting',
      'investor relations', 'fundraising', 'venture capital', 'startup', 'scale',
      'competitive analysis', 'market research', 'business strategy', 'turnaround'
    ],
  
    // Conventional (Organized, process-driven, detail-oriented)
    C: [
      'organize', 'process', 'document', 'record', 'coordinate', 'schedule', 'maintain', 
      'systematize', 'file', 'track', 'log', 'administer', 'procurement', 'compliance', 
      'register', 'inventory', 'timesheet', 'standardize', 'audit', 'verify',
      'data entry', 'record keeping', 'filing', 'archiving', 'bookkeeping', 'accounting',
      'payroll', 'invoicing', 'purchasing', 'ordering', 'logistics', 'supply chain',
      'inventory management', 'warehouse', 'shipping', 'receiving', 'quality assurance',
      'compliance reporting', 'regulatory compliance', 'policy implementation',
      'procedure', 'workflow', 'standard operating procedure', 'sop', 'checklist',
      'calendar management', 'travel coordination', 'office management', 'administration'
    ]
  };
  
  // Flatten for quick lookup (optional)
  const ALL_RIASEC_KEYWORDS = {};
  for (const [code, words] of Object.entries(RIASEC_KEYWORDS)) {
    for (const word of words) {
      ALL_RIASEC_KEYWORDS[word] = code;
    }
  }
  
  /**
   * Counts RIASEC keyword occurrences in text
   * @param {string} text - Text to analyze
   * @returns {Object} Scores for each RIASEC type (0-10 normalized)
   */
  function countRIASECScores(text) {
    if (!text || typeof text !== 'string') {
      return { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    }
    
    const lowerText = text.toLowerCase();
    const rawScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    
    for (const [code, words] of Object.entries(RIASEC_KEYWORDS)) {
      for (const word of words) {
        // Match whole word to avoid false positives
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\w*\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          rawScores[code] += matches.length;
        }
      }
    }
    
    // Normalize to 0-10 scale
    const maxScore = Math.max(...Object.values(rawScores));
    if (maxScore > 0) {
      for (const code in rawScores) {
        rawScores[code] = Math.min(10, Math.round((rawScores[code] / maxScore) * 10));
      }
    }
    
    return rawScores;
  }
  
  /**
   * Gets top 3 RIASEC codes (primary, secondary, tertiary)
   * @param {Object} scores - RIASEC scores object
   * @returns {string} Three-letter code (e.g., "EIC")
   */
  function getTopThreeCodes(scores) {
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code]) => code)
      .join('');
  }
  
  /**
   * Hexagon distance between two RIASEC codes (standard Holland hexagon order)
   * R → I → A → S → E → C → R
   */
  const HEXAGON_DISTANCE = {
    // Same code
    'R-R': 0, 'I-I': 0, 'A-A': 0, 'S-S': 0, 'E-E': 0, 'C-C': 0,
    // Adjacent (distance 1)
    'R-I': 1, 'I-R': 1, 'I-A': 1, 'A-I': 1, 'A-S': 1, 'S-A': 1,
    'S-E': 1, 'E-S': 1, 'E-C': 1, 'C-E': 1, 'C-R': 1, 'R-C': 1,
    // Two steps apart (distance 2)
    'R-A': 2, 'A-R': 2, 'I-S': 2, 'S-I': 2, 'A-E': 2, 'E-A': 2,
    'S-C': 2, 'C-S': 2, 'E-R': 2, 'R-E': 2, 'C-I': 2, 'I-C': 2,
    // Opposite (distance 3)
    'R-S': 3, 'S-R': 3, 'I-E': 3, 'E-I': 3, 'A-C': 3, 'C-A': 3
  };
  
  const MATCH_PERCENT_MAP = { 0: 100, 1: 70, 2: 50, 3: 30 };
  
  /**
   * Calculates match percentage between candidate and JD RIASEC codes
   * @param {string} candidateCodes - Three-letter candidate code (e.g., "EIC")
   * @param {string} jdCodes - Three-letter JD code (e.g., "ESC")
   * @param {boolean} isExecutiveMode - If true, only compare first letter
   * @returns {Object} Match percentage and multiplier
   */
  function calculateMatch(candidateCodes, jdCodes, isExecutiveMode = false) {
    if (!jdCodes) {
      return { matchPercent: null, multiplier: 1.0 };
    }
    
    if (isExecutiveMode) {
      // Executive mode: only compare the primary (first) letter
      if (candidateCodes[0] === jdCodes[0]) {
        return { matchPercent: 100, multiplier: 1.0 };
      } else {
        return { matchPercent: 50, multiplier: 0.85 };
      }
    }
    
    // Standard mode: compare all three letters using hexagon distance
    let totalSteps = 0;
    for (let i = 0; i < 3; i++) {
      const key = `${candidateCodes[i]}-${jdCodes[i]}`;
      totalSteps += HEXAGON_DISTANCE[key] !== undefined ? HEXAGON_DISTANCE[key] : 3;
    }
    const avgSteps = totalSteps / 3;
    const matchPercent = MATCH_PERCENT_MAP[Math.round(avgSteps)] || 50;
    const multiplier = 0.70 + (matchPercent / 100) * 0.30;
    
    return { matchPercent, multiplier };
  }
  
  /**
   * Generates insight text based on match percentage
   * @param {number} matchPercent - Match percentage (0-100)
   * @param {boolean} isExecutiveMode - Whether executive mode was used
   * @returns {string} Insight text
   */
  function generateInsight(matchPercent, isExecutiveMode = false) {
    if (matchPercent === null) {
      return "No job description provided for comparison. This is your RIASEC profile based on your resume alone.";
    }
    
    if (isExecutiveMode) {
      if (matchPercent >= 90) {
        return "Excellent leadership alignment. Your primary work style matches executive expectations for this role.";
      } else {
        return "Leadership style differs from role expectations. Consider how your approach aligns with firm culture during the interview.";
      }
    }
    
    if (matchPercent >= 90) {
      return "Excellent personality alignment. You'll likely enjoy this work and fit naturally into the team culture.";
    } else if (matchPercent >= 70) {
      return "Good alignment. Your work interests match the role well, with some minor differences.";
    } else if (matchPercent >= 50) {
      return "Moderate alignment. Consider if the core activities of this role appeal to you before moving forward.";
    } else {
      return "Low alignment. This role may not match your natural work interests. Proceed with caution or look for roles that better fit your style.";
    }
  }
  
  /**
   * Generates profile description based on top RIASEC codes
   * @param {string} codes - Three-letter RIASEC code
   * @returns {string} Profile description
   */
  function generateProfileDescription(codes) {
    const primary = codes[0];
    const descriptions = {
      R: "Realistic: You are hands-on and practical. You enjoy building, operating, or repairing physical things. You prefer working with tools and machines over paperwork or extensive social interaction.",
      I: "Investigative: You are analytical and curious. You enjoy research, data analysis, and solving complex problems. You prefer working independently and thinking systematically.",
      A: "Artistic: You are creative and innovative. You enjoy design, writing, artistic expression, and creating original work. You prefer environments that value self-expression.",
      S: "Social: You are collaborative and caring. You enjoy helping, teaching, counseling, and supporting others. You prefer team-oriented environments with meaningful human interaction.",
      E: "Enterprising: You are ambitious and persuasive. You enjoy leading, selling, influencing, and achieving business results. You prefer competitive environments with leadership opportunities.",
      C: "Conventional: You are organized and detail-oriented. You enjoy processing information, maintaining systems, and following established procedures. You prefer structured, predictable environments."
    };
    
    return descriptions[primary] || "You have a balanced mix of work styles across multiple categories.";
  }
  
  // ============================================================
  // MAIN RIASEC CALCULATION FUNCTION
  // ============================================================
  
  /**
   * Calculates RIASEC scores from resume and optional job description
   * @param {string} resumeText - Resume text
   * @param {string|null} jdText - Job description text (optional)
   * @param {boolean} isExecutiveMode - Whether to use executive mode (primary letter only)
   * @returns {Object} Complete RIASEC analysis
   */
  export function calculateRIASECDeterministic(resumeText, jdText = null, isExecutiveMode = false) {
    if (!resumeText || typeof resumeText !== 'string') {
      return {
        candidate_scores: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
        jd_scores: null,
        candidate_codes: "",
        jd_codes: null,
        match_percent: null,
        multiplier: 1.0,
        insight: "Unable to calculate RIASEC: No resume text provided.",
        confidence: 0,
        profile_description: ""
      };
    }
    
    // Score candidate resume
    const candidateScores = countRIASECScores(resumeText);
    const candidateCodes = getTopThreeCodes(candidateScores);
    
    // Score job description if provided
    let jdScores = null;
    let jdCodes = null;
    if (jdText && typeof jdText === 'string' && jdText.trim().length > 0) {
      jdScores = countRIASECScores(jdText);
      jdCodes = getTopThreeCodes(jdScores);
    }
    
    // Calculate match
    const { matchPercent, multiplier } = calculateMatch(candidateCodes, jdCodes, isExecutiveMode);
    
    // Generate insight
    const insight = generateInsight(matchPercent, isExecutiveMode);
    
    // Generate profile description (only for candidate)
    const profileDescription = generateProfileDescription(candidateCodes);
    
    return {
      candidate_scores: candidateScores,
      jd_scores: jdScores,
      candidate_codes: candidateCodes,
      jd_codes: jdCodes,
      match_percent: matchPercent,
      multiplier: multiplier,
      insight: insight,
      profile_description: profileDescription,
      confidence: 95
    };
  }
  
  // ============================================================
  // HELPER EXPORTS FOR UI COMPONENTS
  // ============================================================
  
  export const RIASEC_NAMES = {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional'
  };
  
  export const RIASEC_COLORS = {
    R: '#ef4444',
    I: '#3b82f6',
    A: '#ec4899',
    S: '#10b981',
    E: '#f59e0b',
    C: '#8b5cf6'
  };
  
  export const RIASEC_DESCRIPTIONS = {
    R: "Hands-on, practical, mechanical. Enjoys building, repairing, operating equipment.",
    I: "Analytical, curious, research-oriented. Enjoys solving complex problems with data.",
    A: "Creative, innovative, expressive. Enjoys design, writing, and artistic work.",
    S: "Collaborative, caring, supportive. Enjoys helping, teaching, and counseling others.",
    E: "Ambitious, persuasive, leadership-oriented. Enjoys selling, leading, and achieving results.",
    C: "Organized, detail-oriented, process-driven. Enjoys maintaining systems and following procedures."
  };
  
  /**
   * Gets the RIASEC profile summary for display
   * @param {Object} riasecResult - Result from calculateRIASECDeterministic
   * @returns {Object} Formatted for UI display
   */
  export function formatRIASECForDisplay(riasecResult) {
    if (!riasecResult) return null;
    
    const types = ['R', 'I', 'A', 'S', 'E', 'C'];
    
    return {
      candidate_scores: riasecResult.candidate_scores,
      jd_scores: riasecResult.jd_scores,
      candidate_codes: riasecResult.candidate_codes,
      jd_codes: riasecResult.jd_codes,
      match_percent: riasecResult.match_percent,
      insight: riasecResult.insight,
      profile_description: riasecResult.profile_description,
      top_traits: riasecResult.candidate_codes.split('').map(code => ({
        code,
        name: RIASEC_NAMES[code],
        description: RIASEC_DESCRIPTIONS[code],
        color: RIASEC_COLORS[code],
        score: riasecResult.candidate_scores[code]
      }))
    };
  }