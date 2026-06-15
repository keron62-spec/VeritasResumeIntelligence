// src/hooks/useOrganizationalTheory.js
import { useState, useCallback } from 'react';

const OT_WORKER_URL = 'https://ot-advanced.keron62.workers.dev/analyze';

export function useOrganizationalTheory() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (jdText, hbOutput) => {
    if (!jdText || jdText.trim().length < 350) {
      setError(`Job description must be at least 350 characters. Current: ${jdText?.length || 0} chars`);
      return null;
    }
    
    if (!hbOutput) {
      setError("Missing hb_output. Run hidden brief analysis first.");
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(OT_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          hb_output: hbOutput
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAnalysis(data);
      return data;
      
    } catch (err) {
      setError(err.message);
      console.error('Organizational theory analysis error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setLoading(false);
  }, []);
  
  return {
    analysis,
    loading,
    error,
    analyze,
    reset
  };
}

export default useOrganizationalTheory;