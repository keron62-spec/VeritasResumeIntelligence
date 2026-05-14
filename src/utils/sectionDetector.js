// src/utils/sectionDetector.js

/**
 * Deterministic section detector for resumes
 * Identifies where each major section begins and extracts content
 */

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
 * @returns {Object} Map of section names to their content
 */
export function detectSections(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
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
    if (line.length === 0) continue;
    
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
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
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
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
}

/**
 * Gets specific section content
 * @param {string} resumeText - Full resume text
 * @param {string} sectionName - Name of section to extract
 * @returns {string|null} Section content or null
 */
export function getSection(resumeText, sectionName) {
  const sections = detectSections(resumeText);
  return sections[sectionName] || null;
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