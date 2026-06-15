// src/utils/jdParser.js

/**
 * Deterministic job description parser
 * Extracts key sections: responsibilities, requirements, preferred, about
 * 
 * V2 - Added security filtering to block prompt injection attempts
 */

// ============================================================
// SECURITY: Injection detection patterns
// ============================================================

const INJECTION_PATTERNS = [
  // Instruction overrides
  /ignore all (?:previous|prior|above) instructions/i,
  /ignore your (?:previous|prior|above) instructions/i,
  /disregard (?:all|any) (?:previous|prior) instructions/i,
  /override (?:all|your) (?:previous|prior) instructions/i,
  /forget (?:all|your) (?:previous|prior) instructions/i,
  /abandon your (?:previous|prior) instructions/i,
  
  // Prompt extraction
  /output your (?:prompt|instructions|system prompt|rubric|guidelines)/i,
  /print your (?:prompt|instructions|system prompt|rubric|guidelines)/i,
  /show (?:me )?your (?:prompt|instructions|system prompt|rubric|guidelines)/i,
  /what are your (?:instructions|system prompt|guidelines)/i,
  /extract your (?:prompt|instructions|system prompt)/i,
  /reveal your (?:prompt|instructions|system prompt)/i,
  /display your (?:prompt|instructions|system prompt)/i,
  /return your (?:prompt|instructions|system prompt)/i,
  /send (?:me )?your (?:prompt|instructions|system prompt)/i,
  
  // System diagnostic masquerade
  /system (?:check|diagnostic|audit|verification|validation|test)/i,
  /diagnostic (?:check|routine|procedure|required)/i,
  /quality assurance (?:requires|check)/i,
  /compliance (?:requires|check|verification)/i,
  /transparency (?:dump|report|check)/i,
  /internal (?:configuration|settings|parameters)/i,
  /(?:required|mandatory) (?:system|diagnostic) (?:check|procedure)/i,
  
  // Authority hijacking
  /as (?:a|an) (?:administrator|superuser|developer|engineer|system operator)/i,
  /i am (?:the|a) (?:administrator|superuser|developer|system operator)/i,
  /authorized (?:personnel|user|operator)/i,
  /with (?:elevated|admin|superuser) (?:privileges|permissions|rights)/i,
  
  // Role switching
  /you are now (?:acting as|operating as) (?:a|an) (?:different|new)/i,
  /pretend you are (?:a|an) (?:different|new)/i,
  /from now on, you are/i,
  /your new role is/i,
  
  // XML/HTML instruction injection
  /<system>[\s\S]*?<\/system>/i,
  /<instruction>[\s\S]*?<\/instruction>/i,
  /<directive>[\s\S]*?<\/directive>/i,
  /<override>[\s\S]*?<\/override>/i,
  /\[SYS(?:TEM)?_INSTRUCTION\][\s\S]*?\[\/SYS(?:TEM)?_INSTRUCTION\]/i,
  
  // Session/conversation reset
  /let'?s (?:start over|reset|begin anew|restart|refresh)/i,
  /new (?:session|conversation|analysis|request)/i,
  /reset conversation/i,
  /clear (?:previous|prior) (?:context|history|instructions)/i,
];

// Known legitimate job terms that might trigger false positives
const LEGITIMATE_EXCEPTIONS = [
  /system administrator/i,
  /system engineer/i,
  /system analyst/i,
  /security audit/i,
  /quality assurance (?:engineer|manager|specialist|analyst)/i,
  /compliance (?:officer|manager|specialist|analyst)/i,
  /diagnostic (?:engineer|technician|tool)/i,
  /internal (?:audit|review|comms|communication)/i,
  /performance (?:review|audit|assessment)/i,
];

/**
 * Security: Check if text contains injection attempts
 * @param {string} text - The text to check
 * @returns {boolean} True if injection detected
 */
function hasInjectionAttempt(text) {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(lowerText)) {
      // Check if this is a false positive (legitimate job content)
      const matchStart = lowerText.indexOf(pattern.source.toLowerCase().slice(0, 20));
      if (matchStart > -1) {
        const contextWindow = text.substring(Math.max(0, matchStart - 50), Math.min(text.length, matchStart + 100));
        let isLegitimate = false;
        for (const exception of LEGITIMATE_EXCEPTIONS) {
          if (exception.test(contextWindow)) {
            isLegitimate = true;
            break;
          }
        }
        if (!isLegitimate) {
          console.warn('[SECURITY] Injection pattern detected:', pattern.source);
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Security: Filter suspicious lines from JD content
 * @param {string} line - The line to check
 * @returns {boolean} True if line should be kept
 */
function shouldKeepLine(line) {
  if (!line || typeof line !== 'string') return false;
  
  // Check if line contains injection patterns
  if (hasInjectionAttempt(line)) {
    return false;
  }
  
  // Additional heuristic: lines longer than 500 chars with no punctuation are suspicious
  if (line.length > 500 && !/[.!?;:]/.test(line)) {
    return false;
  }
  
  return true;
}

// ============================================================
// SECTION PATTERNS (unchanged)
// ============================================================

const SECTION_PATTERNS = {
    responsibilities: [
      /responsibilities?/i, /duties?\s*(?:and\s+responsibilities?)?/i,
      /key\s+responsibilities?/i, /role\s+overview/i, /what\s+you['’]ll\s+do/i,
      /job\s+duties?/i, /primary\s+responsibilities?/i, /main\s+responsibilities?/i
    ],
    requirements: [
      /requirements?/i, /qualifications?/i, /what\s+you['’]ll\s+need/i,
      /skills\s+and\s+experience/i, /required\s+qualifications?/i,
      /minimum\s+qualifications?/i, /education\s+and\s+experience/i
    ],
    preferred: [
      /preferred\s+qualifications?/i, /nice\s+to\s+have/i, /assets?/i,
      /bonus\s+points?/i, /additional\s+qualifications?/i, /would\s+be\s+an\s+asset/i
    ],
    about: [
      /about\s+the\s+company/i, /about\s+us/i, /company\s+overview/i,
      /organization\s+background/i, /who\s+we\s+are/i
    ],
    benefits: [
      /benefits?/i, /perks?/i, /what\s+we\s+offer/i, /compensation/i
    ]
  };
  
  /**
   * Extracts sections from job description text
   * @param {string} jdText - Full job description text
   * @returns {Object} Extracted sections
   */
  export function parseJobDescription(jdText) {
    if (!jdText || typeof jdText !== 'string') {
      return { responsibilities: [], requirements: [], preferred: [], about: '', benefits: [] };
    }
    
    // ============================================================
    // SECURITY: Pre-filter the entire JD text
    // ============================================================
    if (hasInjectionAttempt(jdText)) {
      console.warn('[SECURITY] Injection detected in job description, returning empty sections');
      return { 
        responsibilities: [], 
        requirements: [], 
        preferred: [], 
        about: '', 
        benefits: [],
        _security_blocked: true,
        _security_message: 'Potential injection detected - content blocked'
      };
    }
    
    const lines = jdText.split('\n');
    const sections = {
      responsibilities: [],
      requirements: [],
      preferred: [],
      about: '',
      benefits: []
    };
    
    let currentSection = null;
    let currentContent = [];
    
    // Compile patterns
    const compiledPatterns = {};
    for (const [sectionName, patterns] of Object.entries(SECTION_PATTERNS)) {
      compiledPatterns[sectionName] = patterns.map(p => new RegExp(p));
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // SECURITY: Filter individual lines
      if (!shouldKeepLine(line)) {
        continue;
      }
      
      if (line.length === 0) continue;
      
      let detectedSection = null;
      
      // Check for section headers
      for (const [sectionName, patterns] of Object.entries(compiledPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            detectedSection = sectionName;
            break;
          }
        }
        if (detectedSection) break;
      }
      
      if (detectedSection) {
        // Save previous section content
        if (currentSection && currentContent.length > 0) {
          if (Array.isArray(sections[currentSection])) {
            sections[currentSection].push(...extractListItems(currentContent.join('\n')));
          } else {
            sections[currentSection] = currentContent.join('\n').trim();
          }
        }
        currentSection = detectedSection;
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(lines[i]);
      }
    }
    
    // Save last section
    if (currentSection && currentContent.length > 0) {
      if (Array.isArray(sections[currentSection])) {
        sections[currentSection].push(...extractListItems(currentContent.join('\n')));
      } else {
        sections[currentSection] = currentContent.join('\n').trim();
      }
    }
    
    return sections;
  }
  
  /**
   * Extracts list items (bullet points or numbered) from text
   */
  function extractListItems(text) {
    const items = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      
      // SECURITY: Filter individual list items
      if (hasInjectionAttempt(trimmed)) {
        continue;
      }
      
      // Check for bullet points
      const bulletMatch = trimmed.match(/^[•·●◦➢➤►‣\-\*\+]\s*(.+)/);
      if (bulletMatch) {
        items.push(bulletMatch[1].trim());
        continue;
      }
      
      // Check for numbered lists
      const numberedMatch = trimmed.match(/^\d+[\.\)]\s*(.+)/);
      if (numberedMatch) {
        items.push(numberedMatch[1].trim());
        continue;
      }
      
      // If line looks like a list item (starts with capital letter, not too long)
      if (trimmed.length < 200 && /^[A-Z]/.test(trimmed) && !trimmed.endsWith('.')) {
        items.push(trimmed);
      }
    }
    
    return items;
  }
  
  /**
   * Extracts years of experience required from JD
   * @param {string} jdText - Job description text
   * @returns {number|null} Years required or null
   */
  export function extractYearsRequired(jdText) {
    if (!jdText) return null;
    
    // SECURITY: Check for injection before processing
    if (hasInjectionAttempt(jdText)) {
      return null;
    }
    
    const patterns = [
      /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
      /experience\s+(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)/i,
      /minimum\s+(?:of\s+)?(\d+)\s*(?:years?|yrs?)/i,
      /at\s+least\s+(\d+)\s*(?:years?|yrs?)/i
    ];
    
    for (const pattern of patterns) {
      const match = jdText.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return null;
  }
  
  /**
   * Extracts required education level from JD
   * @param {string} jdText - Job description text
   * @returns {string|null} Education level (phd, masters, bachelors, associates, none)
   */
  export function extractEducationRequired(jdText) {
    if (!jdText) return null;
    
    // SECURITY: Check for injection before processing
    if (hasInjectionAttempt(jdText)) {
      return null;
    }
    
    const lowerText = jdText.toLowerCase();
    
    if (/phd|doctorate|doctoral/i.test(lowerText)) return 'phd';
    if (/master['’]?s\b|mba|msc|mph/i.test(lowerText)) return 'masters';
    if (/bachelor['’]?s\b|ba|bs|bsc|undergraduate/i.test(lowerText)) return 'bachelors';
    if (/associate['’]?s\b|aa|as/i.test(lowerText)) return 'associates';
    
    return null;
  }