// src/hooks/useReportGenerator.js
import { useState, useCallback } from 'react';

const HIDDEN_BRIEF_WORKER_URL = 'https://hidden-brief.keron62.workers.dev';

export function useReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportMarkdown, setReportMarkdown] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // Client-side fallback report generator (used if endpoint fails)
  const generateFallbackReport = useCallback((hiddenBriefJson, roleTitle = "the role", organization = "the organization") => {
    const date = new Date().toLocaleString();
    
    let markdown = `# Hidden Brief Intelligence Report\n\n`;
    markdown += `## ${roleTitle} – ${organization}\n\n`;
    markdown += `**Generated:** ${date}\n\n`;
    markdown += `*Note: This report was generated using fallback templates because the full AI report was unavailable. The analysis below is based on structured data only.*\n\n`;
    markdown += `---\n\n`;
    
    // Extract what we can from the JSON
    if (hiddenBriefJson?.core_problem?.inferred_problem) {
      markdown += `## What This Role is Designed to Address\n\n`;
      markdown += `${hiddenBriefJson.core_problem.inferred_problem}\n\n`;
    }
    
    if (hiddenBriefJson?.hidden_requirements?.length > 0) {
      markdown += `## What They're Not Saying\n\n`;
      hiddenBriefJson.hidden_requirements.forEach((req, idx) => {
        markdown += `**${idx + 1}. ${req.implied_requirement}**\n`;
        markdown += `- ${req.resume_framing_advice || 'Prepare an example demonstrating this capability.'}\n\n`;
      });
    }
    
    if (hiddenBriefJson?.unicorn_detection?.detected) {
      markdown += `## Unicorn Role Detection\n\n`;
      markdown += `**Severity:** ${hiddenBriefJson.unicorn_detection.severity}\n`;
      markdown += `**Summary:** ${hiddenBriefJson.unicorn_detection.summary}\n\n`;
      if (hiddenBriefJson.unicorn_detection.advice) {
        markdown += `${hiddenBriefJson.unicorn_detection.advice}\n\n`;
      }
    }
    
    if (hiddenBriefJson?.decision_bottleneck_risk?.risk_level === 'High' || 
        hiddenBriefJson?.decision_bottleneck_risk?.risk_level === 'Very High') {
      markdown += `## Approval Bottlenecks\n\n`;
      markdown += `${hiddenBriefJson.decision_bottleneck_risk.explanation}\n\n`;
    }
    
    if (hiddenBriefJson?.burnout_risk?.risk_level === 'High' || 
        hiddenBriefJson?.burnout_risk?.risk_level === 'Very High') {
      markdown += `## Workload Expectations\n\n`;
      markdown += `${hiddenBriefJson.burnout_risk.explanation}\n\n`;
    }
    
    markdown += `---\n\n`;
    markdown += `*This report is based on analysis of the job description. Verify all claims in the interview.*\n\n`;
    markdown += `**Veritas – See clearly. Act decisively.**\n`;
    
    return markdown;
  }, []);

  // Main report generation function
  const generateReport = useCallback(async (jdText, resumeText, hiddenBriefJson, roleTitle = "the role", organization = "the organization") => {
    setLoading(true);
    setError(null);
    setFallbackUsed(false);
    
    // Validate inputs
    if (!jdText || jdText.trim().length === 0) {
      setError("Job description text is required");
      setLoading(false);
      // Generate fallback report anyway
      const fallback = generateFallbackReport(hiddenBriefJson, roleTitle, organization);
      setReportMarkdown(fallback);
      setGenerated(true);
      setFallbackUsed(true);
      return fallback;
    }
    
    if (!hiddenBriefJson) {
      setError("Hidden brief analysis is required. Run /analyze first.");
      setLoading(false);
      return null;
    }
    
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
        console.warn('Report generation API error:', data.error);
        // Fallback to client-side generation
        const fallback = generateFallbackReport(hiddenBriefJson, roleTitle, organization);
        setReportMarkdown(fallback);
        setGenerated(true);
        setFallbackUsed(true);
        setError(null); // Clear error since we have fallback
        return fallback;
      }
      
      if (data.report_markdown) {
        setReportMarkdown(data.report_markdown);
        setGenerated(true);
        setFallbackUsed(data.fallback === true);
        return data.report_markdown;
      } else {
        throw new Error('No report markdown in response');
      }
      
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.message);
      
      // Fallback to client-side generation
      const fallback = generateFallbackReport(hiddenBriefJson, roleTitle, organization);
      setReportMarkdown(fallback);
      setGenerated(true);
      setFallbackUsed(true);
      return fallback;
      
    } finally {
      setLoading(false);
    }
  }, [generateFallbackReport]);
  
  // Download the report as a markdown file
  const downloadReport = useCallback((markdown, filename = null) => {
    if (!markdown) {
      console.warn('No report markdown to download');
      return false;
    }
    
    const finalFilename = filename || `veritas-hb-report-${Date.now()}.md`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    a.click();
    URL.revokeObjectURL(url);
    
    return true;
  }, []);
  
  // Reset the hook state
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setReportMarkdown(null);
    setGenerated(false);
    setFallbackUsed(false);
  }, []);
  
  return {
    // State
    loading,
    error,
    reportMarkdown,
    generated,
    fallbackUsed,
    
    // Actions
    generateReport,
    downloadReport,
    reset
  };
}