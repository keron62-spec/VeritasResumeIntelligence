// src/utils/sectionDetector.js

/**
 * Deterministic section detector for resumes
 * Identifies where each major section begins and extracts content
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

// Known legitimate resume content that might trigger false positives
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
  /project (?:management|coordinator|lead)/i,
  /risk (?:assessment|management|analyst)/i,
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
          console.warn('[SECURITY] Injection pattern detected in section:', pattern.source);
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Security: Filter suspicious content from section text
 * @param {string} text - The section content
 * @returns {string} Filtered content (empty string if injection detected)
 */
function filterSectionContent(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Check entire section for injection
  if (hasInjectionAttempt(text)) {
    return '';
  }
  
  // Split into lines and filter suspicious lines
  const lines = text.split('\n');
  const filteredLines = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      filteredLines.push(line);
      continue;
    }
    
    // Check individual line for injection
    if (hasInjectionAttempt(trimmed)) {
      continue; // Skip this line entirely
    }
    
    // Additional heuristic: lines longer than 300 chars with no punctuation are suspicious
    if (trimmed.length > 300 && !/[.!?;:]/.test(trimmed)) {
      continue;
    }
    
    filteredLines.push(line);
  }
  
  return filteredLines.join('\n').trim();
}

// ============================================================
// SECTION PATTERNS (unchanged)
// ============================================================

export const SECTION_PATTERNS = {
  header: {
    patterns: [
      /^[A-Z][a-z]+ [A-Z][a-z]+(?: [A-Z][a-z]+)?/m,  // Name line
      /[\w.-]+@[\w.-]+\.\w+/m,  // Email
      /linkedin\.com\/in\/[\w-]+/m  // LinkedIn
    ],
    priority: 1
  },
  summary: {
    patterns: [
      /^summary\b/im, /^professional summary\b/im, /^profile\b/im,
      /^about me\b/im, /^personal statement\b/im
    ],
    priority: 2
  },
  work_experience: {
    patterns: [
      /^work experience\b/im, /^experience\b/im, /^employment\b/im,
      /^work history\b/im, /^professional experience\b/im, /^career history\b/im
    ],
    priority: 3
  },
  education: {
    patterns: [
      /^education\b/im, /^academic background\b/im, /^qualifications\b/im,
      /^degrees?\b/im, /^education history\b/im
    ],
    priority: 4
  },
  skills: {
    patterns: [
      /^skills\b/im, /^technical skills\b/im, /^core competencies\b/im,
      /^expertise\b/im, /^skills summary\b/im, /^competencies\b/im
    ],
    priority: 5
  },
  projects: {
    patterns: [
      /^projects\b/im, /^personal projects\b/im, /^key projects\b/im,
      /^project portfolio\b/im
    ],
    priority: 6
  },
  certifications: {
    patterns: [
      /^certifications\b/im, /^certificates\b/im, /^professional certifications\b/im,
      /^licenses?\b/im
    ],
    priority: 7
  },
  volunteer: {
    patterns: [
      /^volunteer\b/im, /^volunteer experience\b/im, /^community service\b/im,
      /^volunteer work\b/im
    ],
    priority: 8
  },
  publications: {
    patterns: [
      /^publications\b/im, /^papers\b/im, /^articles\b/im,
      /^research publications\b/im
    ],
    priority: 9
  },
  awards: {
    patterns: [
      /^awards\b/im, /^honors\b/im, /^recognition\b/im
    ],
    priority: 10
  }
};

/**
 * Detects all sections in a resume
 * @param {string} resumeText - Full resume text
 * @returns {Object} Map of section names to their content (filtered for security)
 */
export function detectSections(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
    return {};
  }
  
  // ============================================================
  // SECURITY: Pre-filter entire resume text
  // ============================================================
  if (hasInjectionAttempt(resumeText)) {
    console.warn('[SECURITY] Injection detected in resume text, returning empty sections');
    return {};
  }
  
  const lines = resumeText.split('\n');
  const sections = {};
  let currentSection = 'header';
  let currentContent = [];
  
  // Pattern cache for performance
  const compiledPatterns = {};
  for (const [sectionName, sectionInfo] of Object.entries(SECTION_PATTERNS)) {
    compiledPatterns[sectionName] = sectionInfo.patterns;
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // SECURITY: Filter individual lines
    if (hasInjectionAttempt(line)) {
      continue; // Skip this line entirely
    }
    
    if (line.length === 0) {
      currentContent.push(lines[i]);
      continue;
    }
    
    let detectedSection = null;
    
    // Check if this line is a section header
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
      // Save previous section (with filtering)
      if (currentSection && currentContent.length > 0) {
        const sectionContent = currentContent.join('\n').trim();
        const filteredContent = filterSectionContent(sectionContent);
        if (filteredContent) {
          sections[currentSection] = filteredContent;
        }
      }
      // Start new section
      currentSection = detectedSection;
      currentContent = [];
    } else {
      currentContent.push(lines[i]);
    }
  }
  
  // Save last section
  if (currentSection && currentContent.length > 0) {
    const sectionContent = currentContent.join('\n').trim();
    const filteredContent = filterSectionContent(sectionContent);
    if (filteredContent) {
      sections[currentSection] = filteredContent;
    }
  }
  
  return sections;
}

/**
 * Gets specific section content
 * @param {string} resumeText - Full resume text
 * @param {string} sectionName - Name of section to extract
 * @returns {string|null} Section content or null (filtered for security)
 */
export function getSection(resumeText, sectionName) {
  const sections = detectSections(resumeText);
  const content = sections[sectionName] || null;
  
  // SECURITY: Final check on returned content
  if (content && hasInjectionAttempt(content)) {
    return null;
  }
  
  return content;
}

/**
 * Checks if a section exists in the resume
 * @param {string} resumeText - Full resume text
 * @param {string} sectionName - Name of section to check
 * @returns {boolean}
 */
export function hasSection(resumeText, sectionName) {
  const sections = detectSections(resumeText);
  return !!sections[sectionName];
}