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

// ============================================================
// COMPATIBILITY LAYER: TRANSFORMS NEW WORKER FORMAT TO OLD FORMAT
// This ensures both old and new workers work with the same frontend
// ============================================================

const transformNewFormatToOld = (result) => {
  const transformed = { ...result };
  
  // Transform bloom_bullet_analysis → bloom_analysis
  if (result.bloom_bullet_analysis) {
    const bba = result.bloom_bullet_analysis;
    
    transformed.bloom_analysis = {
      average_bloom_level: bba.average_bloom_level ?? 3.5,
      expected_bloom_level: bba.expected_bloom_level ?? 3.5,
      jd_bloom_score: bba.jd_bloom_level ?? null,
      bloom_gap: bba.bloom_gap ?? 0,
      bloom_multiplier: bba.bloom_multiplier ?? 1.0,
      bloom_assessment: bba.bloom_assessment ?? 'Not enough data',
      bloom_position_adjustment: bba.bloom_position_adjustment ?? 0,
      bullets_by_level: bba.bullets_by_level_summary || [],
      flags: bba.flags || []
    };
    
    // Transform metric_quality → metric_quality_breakdown
    if (bba.metric_quality) {
      transformed.metric_quality_breakdown = bba.metric_quality;
    }
    
    // Extract weak_metrics_details and suggested_rewrites from bullets
    if (bba.bullets && Array.isArray(bba.bullets)) {
      transformed.weak_metrics_details = [];
      transformed.suggested_rewrites = [];
      
      bba.bullets.forEach(bullet => {
        if (bullet.is_weak_metric) {
          transformed.weak_metrics_details.push({
            bullet_text: bullet.text,
            metric_type: "unknown",
            quality_tier: "weak",
            reason: bullet.weak_metric_reason || "Missing context for metric",
            fix: bullet.changes_made?.[0] || "Add baseline or context to quantify impact"
          });
        }
        if (bullet.needs_rewrite && bullet.transformed_text && bullet.transformed_text !== bullet.text) {
          transformed.suggested_rewrites.push({
            original: bullet.text,
            issue: bullet.weak_metric_reason || "Needs improvement for JD alignment",
            suggested_rewrite: bullet.transformed_text,
            reason: bullet.changes_made?.join("; ") || "JD-aligned optimization with keyword integration"
          });
        }
      });
    }
  }
  
  return transformed;
};

// Safe defaults if the AI misses something
export const createSafeResult = (result, resumePdfHealth) => {
  if (!result) return {};
  
  // DETECT WHICH FORMAT WE RECEIVED
  const isNewFormat = result.bloom_bullet_analysis !== undefined;
  const isOldFormat = result.bloom_analysis !== undefined;
  
  // APPLY TRANSFORMATION IF NEW FORMAT
  let normalizedResult = result;
  if (isNewFormat && !isOldFormat) {
    normalizedResult = transformNewFormatToOld(result);
  }
  
  // Normalize PDF health to preserve Azure's score and label
  const normalizedPdfHealth = normalizePdfHealth(resumePdfHealth);
  
  return {
      total_ats_score: normalizedResult.total_ats_score ?? 0,
      fit_score: normalizedResult.fit_score ?? null,
      credibility_score: normalizedResult.credibility_score ?? 0,
      risk_level: normalizedResult.risk_level ?? 'Medium',
      interview_likelihood_score: normalizedResult.interview_likelihood_score ?? null,
      model_used: normalizedResult.model_used ?? 'Gemini',
      fallback_used: normalizedResult.fallback_used ?? false,
      fallback_note: normalizedResult.fallback_note ?? '',
      role_type_detected: normalizedResult.role_type_detected ?? '',
      role_adjustment_note: normalizedResult.role_adjustment_note ?? '',
      recruiter_scan_verdict: normalizedResult.recruiter_scan_verdict ?? '',
      pdf_health: normalizedPdfHealth,
      riasec: normalizedResult.riasec ?? null,
      strengths: Array.isArray(normalizedResult.strengths) ? normalizedResult.strengths : [],
      all_issues: Array.isArray(normalizedResult.all_issues) ? filterEmptyObjects(normalizedResult.all_issues) : [],
      immediate_fixes: Array.isArray(normalizedResult.immediate_fixes) ? normalizedResult.immediate_fixes : [],
      role_match: Array.isArray(normalizedResult.role_match) ? normalizedResult.role_match : [],
      missing_keywords: Array.isArray(normalizedResult.missing_keywords) ? normalizedResult.missing_keywords : [],
      missing_tools: Array.isArray(normalizedResult.missing_tools) ? filterEmptyObjects(normalizedResult.missing_tools) : [],
      grammar_issues: Array.isArray(normalizedResult.grammar_issues) ? filterEmptyObjects(normalizedResult.grammar_issues) : [],
      weak_metrics_details: Array.isArray(normalizedResult.weak_metrics_details) ? filterEmptyObjects(normalizedResult.weak_metrics_details) : [],
      suggested_rewrites: Array.isArray(normalizedResult.suggested_rewrites) ? filterEmptyObjects(normalizedResult.suggested_rewrites) : [],
      buzzwords_detected: Array.isArray(normalizedResult.buzzwords_detected) ? normalizedResult.buzzwords_detected : [],
      
      // ============================================================
      // SUMMARY ANALYSIS - ADDED FOR V8.5
      // ============================================================
      summary_analysis: normalizedResult.summary_analysis || null,
      
      // ============================================================
      // BULLET ANALYSIS - ADDED FOR V8.6
      // ============================================================
      bullet_analysis: normalizedResult.bullet_analysis || null,
      
      // ============================================================
      // EXECUTIVE MODIFIER - ADDED FOR V8.5
      // ============================================================
      executive_modifier_active: normalizedResult.executive_modifier_active ?? false,
      executive_evaluation: normalizedResult.executive_evaluation || null,
      
      // ============================================================
      // LENIENCY GATE RESULTS - ADDED FOR V8.5
      // ============================================================
      leniency_gate_results: normalizedResult.leniency_gate_results || null,
      
      semantic_analysis: {
          position_score: normalizedResult.semantic_analysis?.position_score ?? 0,
          alignment_score: normalizedResult.semantic_analysis?.alignment_score ?? 5,
          position_label: normalizedResult.semantic_analysis?.position_label ?? 'Not enough data',
          severity: normalizedResult.semantic_analysis?.severity ?? 'none',
          color: normalizedResult.semantic_analysis?.color ?? 'green',
          confidence: normalizedResult.semantic_analysis?.confidence ?? 85,
          detected_level: normalizedResult.semantic_analysis?.detected_level ?? 'Unknown',
          flags: Array.isArray(normalizedResult.semantic_analysis?.flags) ? filterEmptyObjects(normalizedResult.semantic_analysis.flags) : [],
          recommendations: Array.isArray(normalizedResult.semantic_analysis?.recommendations) ? normalizedResult.semantic_analysis.recommendations : []
      },
      bloom_analysis: normalizedResult.bloom_analysis || {
          average_bloom_level: 3,
          expected_bloom_level: 3,
          jd_bloom_score: null,
          bloom_gap: 0,
          bloom_assessment: 'Not enough data',
          bloom_position_adjustment: 0,
          bullets_by_level: [],
          flags: []
      },
      credibility_analysis: {
          career_plausibility_flags: Array.isArray(normalizedResult.credibility_analysis?.career_plausibility_flags) ? filterEmptyObjects(normalizedResult.credibility_analysis.career_plausibility_flags) : [],
          education_title_flags: Array.isArray(normalizedResult.credibility_analysis?.education_title_flags) ? filterEmptyObjects(normalizedResult.credibility_analysis.education_title_flags) : [],
          metric_plausibility_flags: Array.isArray(normalizedResult.credibility_analysis?.metric_plausibility_flags) ? filterEmptyObjects(normalizedResult.credibility_analysis.metric_plausibility_flags) : [],
          acting_title_flags: Array.isArray(normalizedResult.credibility_analysis?.acting_title_flags) ? normalizedResult.credibility_analysis.acting_title_flags : [],
          promotion_signals: Array.isArray(normalizedResult.credibility_analysis?.promotion_signals) ? normalizedResult.credibility_analysis.promotion_signals : [],
          recency_note: normalizedResult.credibility_analysis?.recency_note ?? ''
      },
      metric_quality_breakdown: normalizedResult.metric_quality_breakdown || {
          overall_score: 0,
          bullets_assessed: 0,
          weak_count: 0,
          good_count: 0,
          strong_count: 0
      },
      market_positioning: {
          level: normalizedResult.market_positioning?.level ?? 'Not enough data',
          assessment: normalizedResult.market_positioning?.assessment ?? '',
          seniority_detected: normalizedResult.market_positioning?.seniority_detected ?? 'Unknown'
      },
      breakdown: {
          header_contact: normalizedResult.breakdown?.header_contact ?? 0,
          keyword_density: normalizedResult.breakdown?.keyword_density ?? 0,
          quantified_results: normalizedResult.breakdown?.quantified_results ?? 0,
          action_verbs: normalizedResult.breakdown?.action_verbs ?? 0,
          formatting_structure: normalizedResult.breakdown?.formatting_structure ?? 0,
          skills_section: normalizedResult.breakdown?.skills_section ?? 0,
          length_brevity: normalizedResult.breakdown?.length_brevity ?? 0,
          publications_projects: normalizedResult.breakdown?.publications_projects ?? 0,
          recruiter_scan_penalty: normalizedResult.breakdown?.recruiter_scan_penalty ?? 0,
          buzzword_repetition_penalty: normalizedResult.breakdown?.buzzword_repetition_penalty ?? 0
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