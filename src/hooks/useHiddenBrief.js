import { useState, useCallback } from 'react';
import { generateDeterministicHtmlReport } from '../utils/reportGenerator.js';
import { countWords, countCharacters, getAnalysisDepth, validateJobDescription } from '../utils/wordCounter';
import { countTechnicalSkills } from '../utils/skillDictionary';
import { countCertifications } from '../utils/certifications';
import { countLanguages, detectEducationLevel } from '../utils/commonDictionaries';
import { countStakeholders } from '../utils/stakeholderPatterns';

const HIDDEN_BRIEF_WORKER_URL = 'https://hidden-brief.keron62.workers.dev';

export function useHiddenBrief() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transformingBullets, setTransformingBullets] = useState(false);
  const [transformingSummary, setTransformingSummary] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const analyze = useCallback(async (jdText, resumeText) => {
    setLoading(true);
    setError(null);
    
    // ============================================================
    // DETERMINISTIC FRONTEND PRE-PROCESSING
    // ============================================================
    
    // Word & character counts
    const wordCount = countWords(jdText);
    const charCount = countCharacters(jdText);
    const jdValidation = validateJobDescription(jdText);
    
    // Pre-compute all counts from frontend dictionaries
    const technicalSkillsCount = countTechnicalSkills(jdText);
    const certificationsCount = countCertifications(jdText);
    const languagesCount = countLanguages(jdText);
    const educationLevel = detectEducationLevel(jdText);
    const stakeholderCount = countStakeholders(jdText);
    
    // If JD is too short, return early without API call
    if (!jdValidation.canRunAnalysis) {
      setLoading(false);
      
      // Create a minimal response for short JDs
      const minimalBrief = {
        run_analysis: false,
        analysis_depth: "none",
        jd_word_count: wordCount,
        note: jdValidation.note,
        recommendation_summary: "Job description too short for reliable analysis. Research company culture through LinkedIn, Glassdoor, or the company website.",
        jd_quality_assessment: {
          word_count: wordCount,
          detected_seniority: "Undetectable",
          seniority_confidence: "low",
          maturity_grade: "Invalid",
          assessment: "Job description is too short for meaningful analysis.",
          red_flag_risk: "Critical",
          recommendation: "Consider researching the organization through other sources.",
          interview_questions: ["Can you share a more detailed responsibilities document?"],
          full_analysis_available: false,
          analysis_limitation_note: jdValidation.note
        }
      };
      
      setAnalysis(minimalBrief);
      return minimalBrief;
    }
    
    try {
      const response = await fetch(`${HIDDEN_BRIEF_WORKER_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          resume_text: resumeText,
          // Pre-computed values sent to worker
          jd_word_count: wordCount,
          jd_char_count: charCount,
          technical_skills_count: technicalSkillsCount,
          certifications_count: certificationsCount,
          languages_count: languagesCount,
          education_level: educationLevel,
          stakeholder_count: stakeholderCount
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Merge the frontend pre-computed values with worker response
      const mergedBrief = {
        ...data.hidden_brief,
        jd_word_count: wordCount,
        frontend_validation: jdValidation
      };
      
      setAnalysis(mergedBrief);
      return mergedBrief;
      
    } catch (err) {
      setError(err.message);
      console.error('Hidden brief analysis error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const transformBullets = useCallback(async (jdText, insights, bullets) => {
    setTransformingBullets(true);
    
    try {
      const response = await fetch(`${HIDDEN_BRIEF_WORKER_URL}/transform/bullets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          insights: insights,
          bullets: bullets.map((b, idx) => ({
            id: b.id || String(idx + 1),
            original_text: b.original_text,
            context: {
              role: b.context?.role || null,
              company: b.context?.company || null,
              section: b.context?.section || null
            }
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.transformed_bullets;
      
    } catch (err) {
      console.error('Bullet transformation error:', err);
      return null;
    } finally {
      setTransformingBullets(false);
    }
  }, []);

  const transformSummary = useCallback(async (jdText, insights, originalSummary) => {
    setTransformingSummary(true);
    
    try {
      const response = await fetch(`${HIDDEN_BRIEF_WORKER_URL}/transform/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          insights: insights,
          original_summary: originalSummary || ''
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.transformed_summary;
      
    } catch (err) {
      console.error('Summary transformation error:', err);
      return null;
    } finally {
      setTransformingSummary(false);
    }
  }, []);

  // ============================================================
  // Generate downloadable report - uses /generate-report endpoint
  // Returns narrative data + frontend builds deterministic HTML
  // ============================================================
  const generateReport = useCallback(async (jdText, resumeText, hiddenBriefJson) => {
    setGeneratingReport(true);
    setError(null);
    
    try {
      // Call the existing /generate-report endpoint (now returns narrative JSON)
      const response = await fetch(`${HIDDEN_BRIEF_WORKER_URL}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          resume_text: resumeText || '',
          hidden_brief_json: hiddenBriefJson
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Extract narrative from response (the worker returns { narrative: {...}, generated: true })
      const narrative = data.narrative || null;
      
      // Generate deterministic HTML with the narrative data
      const { html, reportId, generationDate } = generateDeterministicHtmlReport(
        hiddenBriefJson,
        resumeText,
        narrative  // Pass narrative to be injected into HTML sections
      );
      
      return {
        report_html: html,
        report_id: reportId,
        generation_date: generationDate,
        generated: true,
        narrative_generated: !!narrative
      };
      
    } catch (err) {
      setError(err.message);
      console.error('Report generation error:', err);
      
      // Fallback: generate report without narrative sections
      const { html, reportId, generationDate } = generateDeterministicHtmlReport(
        hiddenBriefJson,
        resumeText,
        null  // No narrative data
      );
      
      return {
        report_html: html,
        report_id: reportId,
        generation_date: generationDate,
        generated: true,
        narrative_generated: false,
        fallback: true
      };
      
    } finally {
      setGeneratingReport(false);
    }
  }, []);

  return {
    analysis,
    loading,
    error,
    transformingBullets,
    transformingSummary,
    generatingReport,
    analyze,
    transformBullets,
    transformSummary,
    generateReport
  };
}