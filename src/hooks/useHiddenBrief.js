import { useState, useCallback } from 'react';

const HIDDEN_BRIEF_WORKER_URL = 'https://hidden-brief.keron62.workers.dev';

export function useHiddenBrief() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transformingBullets, setTransformingBullets] = useState(false);
  const [transformingSummary, setTransformingSummary] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false); // ADDED

  const analyze = useCallback(async (jdText, resumeText) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${HIDDEN_BRIEF_WORKER_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          resume_text: resumeText
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAnalysis(data.hidden_brief);
      return data.hidden_brief;
      
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
  // NEW: Generate downloadable report
  // ============================================================
  const generateReport = useCallback(async (jdText, resumeText, hiddenBriefJson) => {
    setGeneratingReport(true);
    setError(null);
    
    try {
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
      
      return {
        markdown: data.report_markdown,
        generated: data.generated,
        fallback: data.fallback || false
      };
      
    } catch (err) {
      setError(err.message);
      console.error('Report generation error:', err);
      return {
        markdown: null,
        generated: false,
        fallback: true,
        error: err.message
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
    generatingReport,        // ADDED
    analyze,
    transformBullets,
    transformSummary,
    generateReport           // ADDED
  };
}