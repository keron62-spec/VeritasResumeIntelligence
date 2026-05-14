// src/hooks/useDeterministicFeatures.js

/**
 * Custom hook for deterministic feature extraction
 * Orchestrates all deterministic dictionaries to extract features from resume and JD
 * No LLM calls - 100% deterministic pattern matching and rule-based scoring
 */

import { useState, useCallback } from 'react';
import { extractAllFeatures } from '../utils/featureExtractor.js';
import { calculateRIASECDeterministic } from '../utils/riasec.js';

export function useDeterministicFeatures() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastExtractionTime, setLastExtractionTime] = useState(null);
  const [cachedFeatures, setCachedFeatures] = useState(null);

  /**
   * Extract all features from resume and optional job description
   * @param {string} resumeText - The resume text to analyze
   * @param {string|null} jdText - Optional job description text
   * @param {boolean} useCache - Whether to use cached results for same inputs
   * @returns {Object|null} Extracted features or null if error
   */
  const extractFeatures = useCallback((resumeText, jdText = null, useCache = true) => {
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
      console.warn('useDeterministicFeatures: No resume text provided');
      return null;
    }

    // Check cache if enabled
    if (useCache && cachedFeatures) {
      const cacheKey = `${resumeText.substring(0, 200)}_${jdText?.substring(0, 200) || ''}`;
      if (cachedFeatures._cacheKey === cacheKey) {
        console.log('useDeterministicFeatures: Using cached features');
        return cachedFeatures;
      }
    }

    setIsExtracting(true);
    const startTime = performance.now();

    try {
      // Extract all features using the deterministic extractor
      const features = extractAllFeatures(resumeText, jdText);

      // Add RIASEC if not already included (ensures it's present)
      if (!features.riasec) {
        const riasecResult = calculateRIASECDeterministic(resumeText, jdText, false);
        features.riasec = {
          candidate_codes: riasecResult.candidate_codes,
          jd_codes: riasecResult.jd_codes,
          candidate_scores: riasecResult.candidate_scores,
          jd_scores: riasecResult.jd_scores,
          match_percent: riasecResult.match_percent,
          multiplier: riasecResult.multiplier,
          insight: riasecResult.insight,
          profile_description: riasecResult.profile_description,
          confidence: riasecResult.confidence
        };
      }

      // Add cache key for future reference
      const cacheKey = `${resumeText.substring(0, 200)}_${jdText?.substring(0, 200) || ''}`;
      features._cacheKey = cacheKey;

      // Store in cache
      setCachedFeatures(features);
      setLastExtractionTime(performance.now() - startTime);

      console.log(`useDeterministicFeatures: Extraction complete in ${(performance.now() - startTime).toFixed(0)}ms`);
      console.log(`  - Bullets: ${features.bullet_count}`);
      console.log(`  - Skills: ${features.skills_count}`);
      console.log(`  - Certifications: ${features.certifications_count}`);
      console.log(`  - Seniority: ${features.seniority?.level}`);
      console.log(`  - ATS Score: ${features.ats_score}`);
      console.log(`  - RIASEC: ${features.riasec?.candidate_codes}`);

      return features;

    } catch (error) {
      console.error('useDeterministicFeatures: Extraction failed', error);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, [cachedFeatures]);

  /**
   * Clear the cached features
   */
  const clearCache = useCallback(() => {
    setCachedFeatures(null);
    setLastExtractionTime(null);
    console.log('useDeterministicFeatures: Cache cleared');
  }, []);

  /**
   * Get formatted features ready for sending to Gemma worker
   * @param {Object} features - The extracted features from extractFeatures
   * @returns {Object} Formatted features for worker API
   */
  const formatForWorker = useCallback((features) => {
    if (!features) return null;

    return {
      // Scores
      ats_score: features.ats_score,
      ats_label: features.ats_label,
      credibility_score: features.credibility_score,
      credibility_label: features.credibility_label,
      fit_score: features.jd_comparison?.fit_score || null,
      semantic_position: features.semantic_position,
      semantic_alignment: features.semantic_alignment || 7,
      
      // Bloom
      bloom: {
        average_level: features.bloom?.average_level || 3.5,
        assessment: features.bloom?.assessment || "Analysis complete",
        multiplier: features.bloom?.multiplier || 1.0
      },
      
      // RIASEC
      riasec: features.riasec ? {
        candidate_codes: features.riasec.candidate_codes,
        jd_codes: features.riasec.jd_codes,
        match_percent: features.riasec.match_percent,
        multiplier: features.riasec.multiplier,
        insight: features.riasec.insight
      } : null,
      
      // Candidate context
      seniority: {
        level: features.seniority?.level || 'mid',
        confidence: features.seniority?.confidence || 'medium',
        years_detected: features.seniority?.years_detected || 0
      },
      industry: features.industry || 'unknown',
      role_type: features.role_type || 'unknown',
      skills_count: features.skills_count || 0,
      skills_list: features.skills_list?.slice(0, 30) || [],
      certifications_list: features.certifications_list?.slice(0, 20) || [],
      keyword_density: features.jd_comparison?.keyword_match_rate || 50,
      
      // Verb analysis
      verb_analysis: features.verb_analysis || {
        average_strength: 5,
        classification: 'moderate',
        strong_count: 0,
        weak_count: 0
      },
      
      // Metrics
      metrics: features.metrics || {
        strong_count: 0,
        weak_count: 0,
        has_baseline: false,
        strength_score: 50
      },
      
      // Bullets
      bullet_count: features.bullet_count || 0,
      bullets: features.bullets?.map(b => ({
        id: b.id,
        section: b.section,
        role: b.role,
        company: b.company,
        original_text: b.original_text,
        bloom_level: b.bloom_level || 3.0
      })) || [],
      
      // Top achievements
      top_achievements: features.top_achievements?.slice(0, 5) || [],
      
      // Summary
      original_summary: features.original_summary || null,
      
      // Section presence
      has_summary: features.has_summary || false,
      has_skills_section: features.has_skills_section || false,
      has_projects_section: features.has_projects_section || false
    };
  }, []);

  /**
   * Extract and format in one step (for worker payload)
   * @param {string} resumeText - The resume text
   * @param {string|null} jdText - Optional job description
   * @returns {Object|null} Formatted features ready for worker API
   */
  const getWorkerPayload = useCallback((resumeText, jdText = null) => {
    const features = extractFeatures(resumeText, jdText);
    if (!features) return null;
    return formatForWorker(features);
  }, [extractFeatures, formatForWorker]);

  /**
   * Get a summary of extracted features for debugging
   * @param {Object} features - The extracted features
   * @returns {Object} Summary stats
   */
  const getSummaryStats = useCallback((features) => {
    if (!features) return null;

    return {
      extraction_time_ms: features.extraction_time_ms,
      bullet_count: features.bullet_count,
      skills_count: features.skills_count,
      certifications_count: features.certifications_count,
      languages_count: features.languages_count,
      seniority_level: features.seniority?.level,
      industry: features.industry,
      role_type: features.role_type,
      ats_score: features.ats_score,
      credibility_score: features.credibility_score,
      bloom_average: features.bloom?.average_level,
      riasec_codes: features.riasec?.candidate_codes,
      has_jd_comparison: !!features.jd_comparison,
      fit_score: features.jd_comparison?.fit_score
    };
  }, []);

  return {
    // Core functions
    extractFeatures,
    formatForWorker,
    getWorkerPayload,
    getSummaryStats,
    clearCache,
    
    // State
    isExtracting,
    lastExtractionTime,
    cachedFeatures
  };
}

// ============================================================
// DEFAULT EXPORT FOR CONVENIENCE
// ============================================================

export default useDeterministicFeatures;