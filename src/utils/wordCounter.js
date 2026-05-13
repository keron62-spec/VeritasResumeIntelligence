// src/utils/wordCounter.js

/**
 * Counts words in a text string
 * @param {string} text - The text to count words in
 * @returns {number} Word count
 */
export function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Trim whitespace and split on whitespace boundaries
    // This handles multiple spaces, tabs, newlines correctly
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;
    
    // Split on any whitespace (spaces, tabs, newlines, carriage returns)
    const words = trimmed.split(/\s+/);
    return words.length;
  }
  
  /**
   * Counts characters in a text string (including spaces)
   * @param {string} text - The text to count characters in
   * @returns {number} Character count
   */
  export function countCharacters(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.length;
  }
  
  /**
   * Gets analysis depth based on word count
   * @param {number} wordCount - The word count of the job description
   * @returns {Object} { analysisDepth, canRunAnalysis, note }
   */
  export function getAnalysisDepth(wordCount) {
    let analysisDepth = "none";
    let canRunAnalysis = false;
    let note = null;
    
    if (wordCount >= 350 && wordCount < 500) {
      analysisDepth = "level1_only";
      canRunAnalysis = true;
      note = "Limited analysis available (Level 1 only). Sector classification and explicit signals only.";
    } else if (wordCount >= 500 && wordCount < 800) {
      analysisDepth = "level2_only";
      canRunAnalysis = true;
      note = "Limited analysis available (Level 2 only). Cultural assessment skipped (needs 800+ words).";
    } else if (wordCount >= 800) {
      analysisDepth = "full";
      canRunAnalysis = true;
      note = null;
    } else {
      analysisDepth = "none";
      canRunAnalysis = false;
      note = `Job description is only ${wordCount} words. Minimum 350 required for limited analysis.`;
    }
    
    return { analysisDepth, canRunAnalysis, note };
  }
  
  /**
   * Validates if a job description is long enough for any analysis
   * @param {string} jdText - The job description text
   * @returns {Object} { isValid, wordCount, analysisDepth, note }
   */
  export function validateJobDescription(jdText) {
    const wordCount = countWords(jdText);
    const charCount = countCharacters(jdText);
    const { analysisDepth, canRunAnalysis, note } = getAnalysisDepth(wordCount);
    
    return {
      isValid: wordCount >= 350,
      canRunAnalysis,
      wordCount,
      charCount,
      analysisDepth,
      note,
      isTooShort: wordCount < 350,
      isLevel1Only: wordCount >= 350 && wordCount < 500,
      isLevel2Only: wordCount >= 500 && wordCount < 800,
      isFull: wordCount >= 800
    };
  }