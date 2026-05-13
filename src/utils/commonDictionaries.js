// src/utils/commonDictionaries.js

/**
 * LANGUAGE DICTIONARY (Based on Ethnologue Top 100)
 * Includes common names and variations of major world languages
 * Used for detecting language requirements in job descriptions
 */
export const LANGUAGES = [
    // Top 10 (most common in JDs)
    "english", "spanish", "french", "mandarin", "chinese",
    "german", "japanese", "portuguese", "russian", "arabic",
    "italian", "korean", "dutch", "turkish", "vietnamese",
    "polish", "ukrainian", "swedish", "greek", "czech",
    "hungarian", "romanian", "bulgarian", "serbian", "croatian",
    "bengali", "hindi", "urdu", "punjabi", "gujarati",
    "marathi", "tamil", "telugu", "kannada", "malayalam",
    "thai", "khmer", "lao", "burmese", "nepali",
    "sinhala", "malay", "indonesian", "tagalog", "cebuano",
    "hausa", "yoruba", "igbo", "swahili", "amharic",
    "somali", "rwanda", "rundi", "zulu", "xhosa",
    "afrikaans", "hebrew", "persian", "pashto", "kazakh",
    "uzbek", "azerbaijani", "georgian", "armenian", "albanian",
    "macedonian", "slovene", "slovak", "estonian", "latvian",
    "lithuanian", "finnish", "icelandic", "norwegian", "danish",
    "maltese", "cypriot", "maori", "samoan", "tongan",
    "fijian", "creole", "haitian", "french creole"
  ];
  
  /**
   * EDUCATION DICTIONARY (Caribbean Context)
   * Includes CXC, CAPE, and common international qualifications
   */
  export const EDUCATIONS = [
    // Caribbean Specific
    "cxc", "cape", "caribbean examination council", "caribbean advanced proficiency examination",
    "caribbean secondary education certificate", "csec", "cxc associate degree",
    "gcse", "gce", "a-level", "o-level", "as-level",
    
    // Doctorates
    "phd", "doctorate", "doctoral", "dba", "edd", "dphil", "dm", "m.d.", "md",
    "doctor of medicine", "doctor of philosophy", "juris doctor", "jd",
    
    // Master's Degrees
    "master's", "masters", "ma", "ms", "msc", "mph", "mba", "mha", "mphil",
    "med", "m.ed", "masters in education", "march", "master of architecture",
    "mfa", "master of fine arts", "llm", "master of laws", "mpp", "master of public policy",
    "mph", "master of public health", "msc", "master of science",
    
    // Bachelor's Degrees
    "bachelor's", "bachelors", "ba", "bs", "bsc", "bba", "bcom", "bachelor of arts",
    "bachelor of science", "bachelor of commerce", "bachelor of business administration",
    "bachelor of engineering", "be", "btech", "llb", "bachelor of laws",
    "bachelor of education", "bed", "bachelor of nursing", "bachelor of public health",
    "bachelor of social work", "bachelor of architecture", "barch",
    
    // Associate Degrees / Diplomas
    "associate degree", "associate's", "associates", "aa", "as", "aas",
    "diploma", "advanced diploma", "graduate diploma", "postgraduate diploma",
    "certificate", "professional certificate", "advanced certificate",
    
    // Professional / Technical
    "nursing diploma", "registered nurse", "rn", "teaching certificate", "pgce",
    "legal education certificate", "paralegal certificate", "accounting certificate", "acca",
    
    // Short Courses / Training
    "certification program", "professional development", "vocational training",
    "technical certificate", "industry certification", "continuing education"
  ];
  
  /**
   * Counts languages mentioned in a job description
   * @param {string} jdText - The job description text
   * @returns {number} Count of unique languages found
   */
  export function countLanguages(jdText) {
    if (!jdText || typeof jdText !== 'string') return 0;
    const lowerText = jdText.toLowerCase();
    const foundLanguages = new Set();
    
    for (const language of LANGUAGES) {
      // Match whole words to avoid false positives (e.g., "man" in "mandarin")
      const regex = new RegExp(`\\b${escapeRegex(language)}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundLanguages.add(language);
      }
    }
    
    return foundLanguages.size;
  }
  
  /**
   * Counts education qualifications mentioned in a job description
   * @param {string} jdText - The job description text
   * @returns {number} Count of unique education categories found
   */
  export function countEducations(jdText) {
    if (!jdText || typeof jdText !== 'string') return 0;
    const lowerText = jdText.toLowerCase();
    const foundEducations = new Set();
    
    for (const education of EDUCATIONS) {
      const regex = new RegExp(`\\b${escapeRegex(education)}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundEducations.add(education);
      }
    }
    
    return foundEducations.size;
  }
  
  /**
   * Helper function to escape special regex characters
   * @param {string} str - Input string
   * @returns {string} Escaped string
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }