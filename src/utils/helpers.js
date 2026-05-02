// filters out empty stuff the AI hallucinates
export const filterEmptyObjects = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => {
      if (!item) return false;
      if (typeof item !== 'object') return true;
      
      // Check if object has ANY meaningful property with a value
      const hasContent = Object.values(item).some(val => 
          val !== undefined && 
          val !== null && 
          val !== '' && 
          !(Array.isArray(val) && val.length === 0)
      );
      
      // Also filter out empty objects {} with no keys
      const hasKeys = Object.keys(item).length > 0;
      
      // For issues specifically, check if there's an actual issue message
      const hasIssueText = (item.issue && item.issue.length > 0) || 
                           (item.fix && item.fix.length > 0) ||
                           (item.suggestion && item.suggestion.length > 0) ||
                           (item.priority && item.priority.length > 0) ||
                           (item.location && item.location.length > 0);
      
      // If this is an issue/flag type object, require actual content
      const isIssueType = item.issue !== undefined || item.fix !== undefined || 
                         item.suggestion !== undefined || item.priority !== undefined;
      
      if (isIssueType) {
          return hasIssueText;
      }
      
      return hasContent && hasKeys;
  });
};

// Normalize PDF health to ensure score and label are preserved
const normalizePdfHealth = (pdfHealth) => {
  if (!pdfHealth) return null;
  
  return {
    issues: pdfHealth.issues || [],
    pageCount: pdfHealth.pageCount || pdfHealth.pages || 1,
    textLength: pdfHealth.textLength || 0,
    fileSize: pdfHealth.fileSize || 0,
    pdf_health_score: pdfHealth.pdf_health_score ?? calculatePdfHealthScoreFromIssues(pdfHealth.issues),
    pdf_health_label: pdfHealth.pdf_health_label || getPdfHealthLabelFromScore(pdfHealth.pdf_health_score ?? calculatePdfHealthScoreFromIssues(pdfHealth.issues))
  };
};

// Helper to calculate PDF health score from issues (fallback)
const calculatePdfHealthScoreFromIssues = (issues) => {
  if (!issues || issues.length === 0) return 100;
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 25;
    else if (issue.severity === 'high') score -= 15;
    else if (issue.severity === 'medium') score -= 8;
    else if (issue.severity === 'low') score -= 3;
    else if (issue.severity === 'good') score += 5;
  }
  return Math.max(0, Math.min(100, score));
};

// Helper to get label from score (fallback)
const getPdfHealthLabelFromScore = (score) => {
  if (score === null || score === undefined) return 'Unknown';
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Moderate';
  if (score >= 60) return 'Poor';
  return 'Critical';
};

// Safe defaults if the AI misses something
export const createSafeResult = (result, resumePdfHealth) => {
  if (!result) return {};
  
  // Normalize PDF health to preserve Azure's score and label
  const normalizedPdfHealth = normalizePdfHealth(resumePdfHealth);
  
  return {
      total_ats_score: result.total_ats_score ?? 0,
      fit_score: result.fit_score ?? null,
      credibility_score: result.credibility_score ?? 0,
      risk_level: result.risk_level ?? 'Medium',
      interview_likelihood_score: result.interview_likelihood_score ?? null,
      model_used: result.model_used ?? 'Gemini',
      fallback_used: result.fallback_used ?? false,
      fallback_note: result.fallback_note ?? '',
      role_type_detected: result.role_type_detected ?? '',
      role_adjustment_note: result.role_adjustment_note ?? '',
      recruiter_scan_verdict: result.recruiter_scan_verdict ?? '',
      pdf_health: normalizedPdfHealth,
      riasec: result.riasec ?? null,
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      all_issues: Array.isArray(result.all_issues) ? filterEmptyObjects(result.all_issues) : [],
      immediate_fixes: Array.isArray(result.immediate_fixes) ? result.immediate_fixes : [],
      role_match: Array.isArray(result.role_match) ? result.role_match : [],
      missing_keywords: Array.isArray(result.missing_keywords) ? result.missing_keywords : [],
      missing_tools: Array.isArray(result.missing_tools) ? filterEmptyObjects(result.missing_tools) : [],
      grammar_issues: Array.isArray(result.grammar_issues) ? filterEmptyObjects(result.grammar_issues) : [],
      weak_metrics_details: Array.isArray(result.weak_metrics_details) ? filterEmptyObjects(result.weak_metrics_details) : [],
      suggested_rewrites: Array.isArray(result.suggested_rewrites) ? filterEmptyObjects(result.suggested_rewrites) : [],
      buzzwords_detected: Array.isArray(result.buzzwords_detected) ? result.buzzwords_detected : [],
      
      // ============================================================
      // SUMMARY ANALYSIS - ADDED FOR V8.5
      // ============================================================
      summary_analysis: result.summary_analysis || null,
      
      semantic_analysis: {
          position_score: result.semantic_analysis?.position_score ?? 0,
          alignment_score: result.semantic_analysis?.alignment_score ?? 5,
          position_label: result.semantic_analysis?.position_label ?? 'Not enough data',
          severity: result.semantic_analysis?.severity ?? 'none',
          color: result.semantic_analysis?.color ?? 'green',
          confidence: result.semantic_analysis?.confidence ?? 85,
          detected_level: result.semantic_analysis?.detected_level ?? 'Unknown',
          flags: Array.isArray(result.semantic_analysis?.flags) ? filterEmptyObjects(result.semantic_analysis.flags) : [],
          recommendations: Array.isArray(result.semantic_analysis?.recommendations) ? result.semantic_analysis.recommendations : []
      },
      bloom_analysis: {
          average_bloom_level: result.bloom_analysis?.average_bloom_level ?? 3,
          expected_bloom_level: result.bloom_analysis?.expected_bloom_level ?? 3,
          jd_bloom_score: result.bloom_analysis?.jd_bloom_level ?? result.bloom_analysis?.jd_bloom_score ?? null,
          bloom_gap: result.bloom_analysis?.bloom_gap ?? 0,
          bloom_assessment: result.bloom_analysis?.bloom_assessment ?? 'Not enough data',
          bullets_by_level: Array.isArray(result.bloom_analysis?.bullets_by_level) ? result.bloom_analysis.bullets_by_level : [],
          flags: Array.isArray(result.bloom_analysis?.flags) ? result.bloom_analysis.flags : []
      },
      credibility_analysis: {
          career_plausibility_flags: Array.isArray(result.credibility_analysis?.career_plausibility_flags) ? filterEmptyObjects(result.credibility_analysis.career_plausibility_flags) : [],
          education_title_flags: Array.isArray(result.credibility_analysis?.education_title_flags) ? filterEmptyObjects(result.credibility_analysis.education_title_flags) : [],
          metric_plausibility_flags: Array.isArray(result.credibility_analysis?.metric_plausibility_flags) ? filterEmptyObjects(result.credibility_analysis.metric_plausibility_flags) : [],
          acting_title_flags: Array.isArray(result.credibility_analysis?.acting_title_flags) ? result.credibility_analysis.acting_title_flags : [],
          promotion_signals: Array.isArray(result.credibility_analysis?.promotion_signals) ? result.credibility_analysis.promotion_signals : [],
          recency_note: result.credibility_analysis?.recency_note ?? ''
      },
      metric_quality_breakdown: {
          overall_score: result.metric_quality_breakdown?.overall_score ?? 0,
          bullets_assessed: result.metric_quality_breakdown?.bullets_assessed ?? 0,
          weak_count: result.metric_quality_breakdown?.weak_count ?? 0,
          good_count: result.metric_quality_breakdown?.good_count ?? 0,
          strong_count: result.metric_quality_breakdown?.strong_count ?? 0
      },
      market_positioning: {
          level: result.market_positioning?.level ?? 'Not enough data',
          assessment: result.market_positioning?.assessment ?? '',
          seniority_detected: result.market_positioning?.seniority_detected ?? 'Unknown'
      },
      breakdown: {
          header_contact: result.breakdown?.header_contact ?? 0,
          keyword_density: result.breakdown?.keyword_density ?? 0,
          quantified_results: result.breakdown?.quantified_results ?? 0,
          action_verbs: result.breakdown?.action_verbs ?? 0,
          formatting_structure: result.breakdown?.formatting_structure ?? 0,
          skills_section: result.breakdown?.skills_section ?? 0,
          length_brevity: result.breakdown?.length_brevity ?? 0,
          publications_projects: result.breakdown?.publications_projects ?? 0,
          recruiter_scan_penalty: result.breakdown?.recruiter_scan_penalty ?? 0,
          buzzword_repetition_penalty: result.breakdown?.buzzword_repetition_penalty ?? 0
      }
  };
};

// Helper to get PDF health score from result (for ScoreDashboard)
export const getPdfHealthScore = (result) => {
  // First, try to use Azure's calculated score
  if (result?.pdf_health?.pdf_health_score !== undefined) {
    return result.pdf_health.pdf_health_score;
  }
  // Fallback: calculate from issues
  if (!result?.pdf_health?.issues) return null;
  const issues = result.pdf_health.issues;
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 25;
    else if (issue.severity === 'high') score -= 15;
    else if (issue.severity === 'medium') score -= 8;
    else if (issue.severity === 'low') score -= 3;
    else if (issue.severity === 'good') score += 5;
  }
  return Math.max(0, Math.min(100, score));
};

// Helper to get PDF health label from result
export const getPdfHealthLabel = (result) => {
  // First, try to use Azure's label
  if (result?.pdf_health?.pdf_health_label) {
    return result.pdf_health.pdf_health_label;
  }
  // Fallback: calculate from score
  const score = getPdfHealthScore(result);
  if (score === null) return null;
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Moderate';
  if (score >= 60) return 'Poor';
  return 'Critical';
};

export const getInterviewLabel = (score, isPerfect = false) => {
  if (isPerfect || score >= 25) return { text: "🤖 ERROR: Resume perfection exceeds human limits. Our AI suspects you're a robot.", color: "#166534", bgColor: "#ecfdf5", emoji: "🤖" };
  if (score >= 23) return { text: "You technically already have the job. Apply yesterday.", color: "#166534", bgColor: "#ecfdf5", emoji: "🎯" };
  if (score >= 16) return { text: "Exceptional Match - Apply with confidence", color: "#166534", bgColor: "#ecfdf5", emoji: "🔥🔥" };
  if (score >= 12) return { text: "Very Good Match - Strongly Recommended to Apply", color: "#22c55e", bgColor: "#dcfce7", emoji: "😊" };
  if (score >= 7) return { text: "Good Match - Send the Application", color: "#86efac", bgColor: "#f0fdf4", emoji: "" };
  if (score >= 3) return { text: "Okay Match - Apply if Interested", color: "#f97316", bgColor: "#fff7ed", emoji: "" };
  if (score >= 1) return { text: "Low Match - Consider other roles or adjust resume", color: "#ea580c", bgColor: "#fff7ed", emoji: "⚠️" };
  return { text: "Very Low Match - Not recommended for this role", color: "#ef4444", bgColor: "#fef2f2", emoji: "❌" };
};

export const getScoreColor = (score) => {
  if (score >= 95) return '#166534';
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#86efac';
  if (score >= 70) return '#f97316';
  return '#ef4444';
};

export const getScoreGrade = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Moderate';
  return 'Needs Work';
};

export const getRiskBadgeClass = (riskLevel) => {
  if (!riskLevel) return 'risk-medium';
  const level = riskLevel.toLowerCase();
  if (level === 'low') return 'risk-low';
  if (level === 'high') return 'risk-high';
  return 'risk-medium';
};