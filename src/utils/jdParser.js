// src/utils/jdParser.js

/**
 * Deterministic job description parser
 * Extracts key sections: responsibilities, requirements, preferred, about
 */

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
    
    const lowerText = jdText.toLowerCase();
    
    if (/phd|doctorate|doctoral/i.test(lowerText)) return 'phd';
    if (/master['’]?s\b|mba|msc|mph/i.test(lowerText)) return 'masters';
    if (/bachelor['’]?s\b|ba|bs|bsc|undergraduate/i.test(lowerText)) return 'bachelors';
    if (/associate['’]?s\b|aa|as/i.test(lowerText)) return 'associates';
    
    return null;
  }