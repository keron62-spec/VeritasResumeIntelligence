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
        /^summary\b/imi, /^professional summary\b/imi, /^profile\b/imi,
        /^about me\b/imi, /^personal statement\b/imi
      ],
      priority: 2
    },
    work_experience: {
      patterns: [
        /^work experience\b/imi, /^experience\b/imi, /^employment\b/imi,
        /^work history\b/imi, /^professional experience\b/imi, /^career history\b/imi
      ],
      priority: 3
    },
    education: {
      patterns: [
        /^education\b/imi, /^academic background\b/imi, /^qualifications\b/imi,
        /^degrees?\b/imi, /^education history\b/imi
      ],
      priority: 4
    },
    skills: {
      patterns: [
        /^skills\b/imi, /^technical skills\b/imi, /^core competencies\b/imi,
        /^expertise\b/imi, /^skills summary\b/imi, /^competencies\b/imi
      ],
      priority: 5
    },
    projects: {
      patterns: [
        /^projects\b/imi, /^personal projects\b/imi, /^key projects\b/imi,
        /^project portfolio\b/imi
      ],
      priority: 6
    },
    certifications: {
      patterns: [
        /^certifications\b/imi, /^certificates\b/imi, /^professional certifications\b/imi,
        /^licenses?\b/imi
      ],
      priority: 7
    },
    volunteer: {
      patterns: [
        /^volunteer\b/imi, /^volunteer experience\b/imi, /^community service\b/imi,
        /^volunteer work\b/imi
      ],
      priority: 8
    },
    publications: {
      patterns: [
        /^publications\b/imi, /^papers\b/imi, /^articles\b/imi,
        /^research publications\b/imi
      ],
      priority: 9
    },
    awards: {
      patterns: [
        /^awards\b/imi, /^honors\b/imi, /^recognition\b/imi
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
      compiledPatterns[sectionName] = sectionInfo.patterns.map(p => new RegExp(p));
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