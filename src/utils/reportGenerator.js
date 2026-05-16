// src/utils/reportGenerator.js

/**
 * Generates a unique ID for each report
 * @returns {string} Unique report ID (e.g., VER-1747123456789-A3F9K2)
 */
function generateReportId() {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VER-${timestamp}-${randomStr}`;
}

/**
 * Escapes HTML special characters to prevent injection
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats a date for display in the report
 * @returns {string} Formatted date string
 */
function getFormattedDate() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Gets CSS class for risk level
 * @param {string} riskLevel - Risk level (Very High, High, Medium, Low)
 * @returns {string} CSS class name
 */
function getRiskClass(riskLevel) {
  if (riskLevel === 'Very High' || riskLevel === 'Critical') return 'risk-critical';
  if (riskLevel === 'High') return 'risk-high';
  if (riskLevel === 'Medium') return 'risk-medium';
  return 'risk-low';
}

/**
 * Gets CSS class for maturity grade
 * @param {string} grade - Maturity grade
 * @returns {string} CSS class name
 */
function getMaturityClass(grade) {
  switch(grade) {
    case 'Mature': return 'mature';
    case 'Adequate': return 'adequate';
    case 'Concerning': return 'concerning';
    case 'Red Flag': return 'red-flag';
    case 'Critical Red Flag': return 'critical-flag';
    case 'Dysfunctional': return 'dysfunctional';
    default: return 'adequate';
  }
}

function getDimensionScoreColor(score) {
 if (score >= 70) return '#ef4444';
 if (score >= 40) return '#f59e0b';
 return '#10b981';
}

/**
* Gets color for complexity score (operational complexity profile)
* @param {number} score - Complexity score (0-100)
* @returns {string} CSS color
*/
function getComplexityColor(score) {
 if (score >= 70) return '#ef4444';
 if (score >= 40) return '#f59e0b';
 return '#10b981';
}

/**
 * Generates the complete deterministic HTML report with optional narrative sections
 * @param {Object} hiddenBrief - The hidden brief analysis JSON
 * @param {string} resumeText - The candidate's resume text (optional)
 * @param {Object} narrative - LLM-generated narrative sections (optional)
 * @returns {Object} { html, reportId, generationDate }
 */
export function generateDeterministicHtmlReport(hiddenBrief, resumeText = '', narrative = null) {
  const reportId = generateReportId();
  const generationDate = getFormattedDate();
  
  // Extract data with safe defaults
  const jdQuality = hiddenBrief?.jd_quality_assessment || {};
  const coreProblem = hiddenBrief?.core_problem || {};
  const hiddenRequirements = hiddenBrief?.hidden_requirements || [];
  const decisionBottleneck = hiddenBrief?.decision_bottleneck_risk || {};
  const burnoutRisk = hiddenBrief?.burnout_risk || {};
  const scaleSurge = hiddenBrief?.scale_surge_risk || {};
  const scopeMismatch = hiddenBrief?.scope_grade_mismatch || {};
  const repetitionSignals = hiddenBrief?.repetition_signals || [];
  const stakeholderComplexity = hiddenBrief?.stakeholder_complexity || {};
  const languagePattern = hiddenBrief?.language_pattern || {};
  const unicornDetection = hiddenBrief?.unicorn_detection || {};
  const recommendationSummary = hiddenBrief?.recommendation_summary || '';
  const complexityAnalysis = hiddenBrief?.complexity_analysis || {};
const operationalReality = hiddenBrief?.operational_reality || {};
const dimensions = operationalReality.dimensions || {};
const stressTopology = operationalReality.stress_topology || {};
const primaryStress = operationalReality.primary_stress || {};
const interactionWarnings = operationalReality.interaction_warnings || [];
const confidence = operationalReality.confidence || {};

  // Build hidden requirements HTML
  const hiddenRequirementsHtml = hiddenRequirements.map(req => `
    <div class="requirement-card">
      <div class="requirement-title">${escapeHtml(req.implied_requirement)}</div>
      <p><strong>Why it matters:</strong> ${escapeHtml(req.why_it_matters || 'This appears to be important based on the JD language.')}</p>
      <p><strong>How to show it:</strong> ${escapeHtml(req.resume_framing_advice || 'Prepare an example from your experience that demonstrates this capability.')}</p>
    </div>
  `).join('');
  
  // Build repetition signals HTML
  const repetitionSignalsHtml = repetitionSignals.slice(0, 6).map(signal => `
    <div class="repetition-item">
      <div class="repetition-phrase">“${escapeHtml(signal.phrase)}”</div>
      <div class="repetition-count">appears ${signal.count} times</div>
      <div class="repetition-signal">${escapeHtml(signal.signal || '')}</div>
    </div>
  `).join('');
  
  // Build stakeholder table HTML
  const stakeholderTypes = stakeholderComplexity.stakeholder_types_identified || [];
  const stakeholderTableHtml = stakeholderTypes.length > 0 ? `
    <table class="stakeholder-table">
      <thead>
        <tr>
          <th>Stakeholder Type</th>
          <th>Context</th>
        </tr>
      </thead>
      <tbody>
        ${stakeholderTypes.map(type => `
          <tr>
            <td>${escapeHtml(type)}</td>
            <td>Mentioned in JD</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p>No specific stakeholder types were extracted from this job description.</p>';
  
  // Build unicorn detection HTML (if detected)
  const unicornHtml = unicornDetection.detected ? `
    <div class="unicorn-banner">
      <div class="unicorn-title">🦄 UNICORN ROLE DETECTED</div>
      <div class="unicorn-severity ${unicornDetection.severity}">Severity: ${unicornDetection.severity?.toUpperCase() || 'INFO'}</div>
      <p>${escapeHtml(unicornDetection.summary || 'This role has unusual or potentially unrealistic requirements.')}</p>
      ${unicornDetection.reasons ? unicornDetection.reasons.map(reason => `
        <div class="unicorn-reason">
          <strong>${escapeHtml(reason.pattern?.replace(/_/g, ' ') || 'Issue')}:</strong>
          <div class="evidence">Evidence: "${escapeHtml(reason.evidence_phrase)}"</div>
          <div>${escapeHtml(reason.explanation)}</div>
        </div>
      `).join('') : ''}
      ${unicornDetection.advice ? `<p class="unicorn-advice"><strong>Advice:</strong> ${escapeHtml(unicornDetection.advice)}</p>` : ''}
    </div>
  ` : '';
  
  // Build risk indicators HTML
  const risksHtml = `
    ${decisionBottleneck.risk_level ? `
      <div class="risk-item ${getRiskClass(decisionBottleneck.risk_level)}">
        <strong>Decision Bottleneck Risk: ${decisionBottleneck.risk_level}</strong>
        <p>${escapeHtml(decisionBottleneck.explanation || 'The JD suggests multiple approval layers that may slow down execution.')}</p>
        ${decisionBottleneck.resume_framing_advice ? `<p class="risk-advice">💡 ${escapeHtml(decisionBottleneck.resume_framing_advice)}</p>` : ''}
      </div>
    ` : ''}
    ${burnoutRisk.risk_level ? `
      <div class="risk-item ${getRiskClass(burnoutRisk.risk_level)}">
        <strong>Burnout Risk: ${burnoutRisk.risk_level}</strong>
        <p>${escapeHtml(burnoutRisk.explanation || 'The JD suggests a high-pressure environment with potential for scope creep.')}</p>
        ${burnoutRisk.resume_framing_advice ? `<p class="risk-advice">💡 ${escapeHtml(burnoutRisk.resume_framing_advice)}</p>` : ''}
      </div>
    ` : ''}
    ${scaleSurge.risk_level ? `
      <div class="risk-item ${getRiskClass(scaleSurge.risk_level)}">
        <strong>Scale Surge Risk: ${scaleSurge.risk_level}</strong>
        <p>${escapeHtml(scaleSurge.explanation || 'The project may be larger or more complex than the team typically handles.')}</p>
        ${scaleSurge.resume_framing_advice ? `<p class="risk-advice">💡 ${escapeHtml(scaleSurge.resume_framing_advice)}</p>` : ''}
      </div>
    ` : ''}
  `;
  
  // Build key findings grid
  const keyFindingsHtml = `
    <div class="key-findings">
      <div class="finding-card">
        <div class="finding-label">Role Clarity</div>
        <div class="finding-value">${escapeHtml(jdQuality.maturity_grade || 'Not detected')}</div>
      </div>
      <div class="finding-card">
        <div class="finding-label">Stakeholder Complexity</div>
        <div class="finding-value">${escapeHtml(stakeholderComplexity.complexity_level || 'Not detected')}</div>
      </div>
      <div class="finding-card">
        <div class="finding-label">Hidden Problem</div>
        <div class="finding-value">${coreProblem.inferred_problem ? 'Yes' : 'No'}</div>
      </div>
      <div class="finding-card">
        <div class="finding-label">Unicorn Detection</div>
        <div class="finding-value">${unicornDetection.detected ? 'Yes' : 'No'}</div>
      </div>
      <div class="finding-card">
        <div class="finding-label">Key Risks</div>
        <div class="finding-value">${[decisionBottleneck.risk_level, burnoutRisk.risk_level].filter(Boolean).join(', ') || 'None detected'}</div>
      </div>
    </div>
  `;

  // ============================================================
  // COMPLEXITY ANALYSIS SECTION NEW
  // ============================================================
  
  // Get priority color for complexity badge
  const getComplexityBadgeColor = (priority) => {
    switch(priority) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#f59e0b';
      default: return '#10b981';
    }
  };
  
  // Build complexity analysis HTML
  const complexityAnalysisHtml = complexityAnalysis.surface_score !== undefined ? `
    <section>
      <h2>Role Complexity Analysis - The Iceberg Factor</h2>
      
      <div class="complexity-banner" style="background: rgba(198, 164, 63, 0.08); border-left: 4px solid #c9a84c; padding: 20px; margin: 16px 0; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
          <div>
            <span style="font-weight: 700; font-size: 18px;">${escapeHtml(complexityAnalysis.iceberg_grade || 'Not determined')}</span>
            <span style="display: inline-block; margin-left: 12px; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: ${getComplexityBadgeColor(complexityAnalysis.priority)}; color: white;">
              ${escapeHtml(complexityAnalysis.priority || 'Low')} Priority
            </span>
          </div>
          <div style="font-size: 13px; color: #6b7280;">
            Complexity Ratio: <strong>${complexityAnalysis.ratio || 'N/A'}</strong>
          </div>
        </div>
        <p style="margin-bottom: 12px;">${escapeHtml(complexityAnalysis.iceberg_interpretation || 'Analysis of role complexity.')}</p>
        <p style="font-weight: 500;">${escapeHtml(complexityAnalysis.candidate_implication || 'Review the full analysis for insights.')}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        <div style="text-align: center; padding: 16px; background: #f8f7f4; border-radius: 8px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Surface Complexity</div>
          <div style="font-size: 36px; font-weight: 700; color: #3b82f6;">${complexityAnalysis.surface_score || 0}</div>
          <div style="font-size: 11px; color: #6b7280;">What the JD explicitly states</div>
        </div>
        <div style="text-align: center; padding: 16px; background: #f8f7f4; border-radius: 8px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Hidden Complexity</div>
          <div style="font-size: 36px; font-weight: 700; color: #c9a84c;">${complexityAnalysis.hidden_score || 0}</div>
          <div style="font-size: 11px; color: #6b7280;">What the role actually demands</div>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 12px; background: #f8f7f4; border-radius: 8px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 11px; color: #6b7280;">Complexity Delta</div>
          <div style="font-weight: 600; color: ${complexityAnalysis.delta > 0 ? '#ef4444' : '#10b981'}">${complexityAnalysis.delta > 0 ? '+' : ''}${complexityAnalysis.delta || 0}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #6b7280;">Invisible Complexity</div>
          <div style="font-weight: 600;">${complexityAnalysis.invisible_complexity_percentage || 0}%</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #6b7280;">Analysis Confidence</div>
          <div style="font-weight: 600; color: ${complexityAnalysis.confidence === 'High' ? '#10b981' : '#f59e0b'}">${escapeHtml(complexityAnalysis.confidence || 'Low')}</div>
        </div>
      </div>
      
      ${complexityAnalysis.surface_components ? `
        <details style="margin: 12px 0;">
          <summary style="font-size: 11px; cursor: pointer; color: #6b7280;">Show surface complexity breakdown</summary>
          <div style="margin-top: 12px; font-size: 12px;">
            ${Object.entries(complexityAnalysis.surface_components).map(([key, value]) => `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e6e4dd;">
                <span style="text-transform: capitalize;">${escapeHtml(key.replace(/_/g, ' '))}</span>
                <span style="font-weight: 500;">${value}</span>
              </div>
            `).join('')}
          </div>
        </details>
      ` : ''}
      
      ${complexityAnalysis.hidden_signals && complexityAnalysis.hidden_signals.length > 0 ? `
        <details style="margin: 12px 0;">
          <summary style="font-size: 11px; cursor: pointer; color: #6b7280;">Show hidden complexity signals (${complexityAnalysis.hidden_signals.length})</summary>
          <ul style="margin-top: 12px; padding-left: 20px; font-size: 11px; color: #4a5568;">
            ${complexityAnalysis.hidden_signals.map(signal => `<li style="margin-bottom: 6px;">${escapeHtml(signal)}</li>`).join('')}
          </ul>
        </details>
      ` : ''}
    </section>
  ` : '';
  
// ============================================================
// OPERATIONAL REALITY (5D MATRIX) - NEW SECTION
// ============================================================

// Dimension labels and icons
const dimensionLabels = {
  bureaucratic_friction: { label: 'Bureaucratic Friction', icon: '📋' },
  operational_load: { label: 'Operational Load', icon: '⚡' },
  stakeholder_density: { label: 'Stakeholder Density', icon: '🤝' },
  strategic_ambiguity: { label: 'Strategic Ambiguity', icon: '🎯' },
  technical_rigidity: { label: 'Technical Rigidity', icon: '🔧' }
};

const operationalRealityHtml = Object.keys(dimensions).length > 0 ? `
  <section>
    <h2>Operational Reality Profile</h2>
    <p style="margin-bottom: 16px;">This is what working in this role will actually feel like — beyond the job description.</p>
    
    <!-- 5 Dimension Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;">
      ${Object.entries(dimensions).map(([key, dim]) => {
        const config = dimensionLabels[key] || { label: key.replace(/_/g, ' '), icon: '📊' };
        const scoreColor = getDimensionScoreColor(dim.score);
        return `
          <div style="padding: 14px; background: #f8f7f4; border-radius: 8px; border-left: 3px solid ${scoreColor};">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 18px;">${config.icon}</span>
              <span style="font-size: 12px; font-weight: 600;">${config.label}</span>
            </div>
            <div style="font-size: 24px; font-weight: 700; color: ${scoreColor};">
              ${dim.score}
              <span style="font-size: 11px; font-weight: 400; color: #6b7280;">/100</span>
            </div>
            <div style="font-size: 11px; margin-top: 8px; line-height: 1.4;">${escapeHtml(dim.interpretation || '')}</div>
          </div>
        `;
      }).join('')}
    </div>
    
    <!-- Dominant Reality -->
    ${operationalReality.dominant_reality ? `
      <div style="background: rgba(198, 164, 63, 0.08); border-left: 3px solid #c9a84c; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
        <strong>${escapeHtml(operationalReality.dominant_reality.name)} is the dominant factor.</strong>
        <p style="margin-top: 8px; font-size: 13px;">${escapeHtml(operationalReality.dominant_reality.interpretation)}</p>
      </div>
    ` : ''}
    
    <!-- LLM Narrative for Operational Reality (if available) -->
    ${narrative?.operational_reality ? `
      ${narrative.operational_reality.observations && narrative.operational_reality.observations.length > 0 ? `
        <div style="margin: 16px 0;">
          ${narrative.operational_reality.observations.map(obs => `
            <div style="padding: 8px 0; border-bottom: 1px solid #e6e4dd; font-size: 13px;">${escapeHtml(obs)}</div>
          `).join('')}
        </div>
      ` : ''}
      ${narrative.operational_reality.bottom_line ? `
        <div style="margin-top: 16px; padding: 12px; background: rgba(198, 164, 63, 0.05); border-radius: 4px; font-style: italic; font-size: 13px;">
          ${escapeHtml(narrative.operational_reality.bottom_line)}
        </div>
      ` : ''}
    ` : ''}
    
    <p style="font-size: 10px; color: #6b7280; margin-top: 12px; font-style: italic;">Higher scores indicate more challenging conditions in that dimension.</p>
  </section>
` : '';

// ============================================================
// OPERATIONAL COMPLEXITY PROFILE - NEW SECTION
// ============================================================

const complexityLabels = {
  cognitive_stress: 'Complex problem-solving',
  relational_stress: 'Stakeholder coordination',
  administrative_stress: 'Process & documentation load',
  ambiguity_stress: 'Role intensity',
  performance_pressure: 'Deadline pressure',
  travel_strain: 'Travel commitment'
};

const operationalComplexityHtml = Object.keys(stressTopology).length > 0 ? `
  <section>
    <h2>Operational Complexity Profile</h2>
    <p style="margin-bottom: 16px;">Where this role demands attention and energy.</p>
    
    <!-- Complexity Factors Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px;">
      ${Object.entries(stressTopology).map(([type, score]) => {
        const label = complexityLabels[type] || type.replace(/_/g, ' ');
        const scoreColor = getComplexityColor(score);
        return `
          <div style="padding: 10px 12px; background: #f8f7f4; border-radius: 6px; border-left: 3px solid ${scoreColor};">
            <div style="font-size: 10px; color: #6b7280;">${escapeHtml(label)}</div>
            <div style="font-size: 18px; font-weight: 700; color: ${scoreColor};">${score}<span style="font-size: 10px; font-weight: 400;">/100</span></div>
          </div>
        `;
      }).join('')}
    </div>
    
    <!-- Primary Consideration -->
    ${primaryStress.type ? `
      <div style="background: rgba(245, 158, 11, 0.05); border-left: 3px solid #f59e0b; padding: 14px; margin-bottom: 16px; border-radius: 4px;">
        <strong>Primary Consideration: ${escapeHtml(primaryStress.label || complexityLabels[primaryStress.type] || primaryStress.type.replace(/_/g, ' '))}</strong>
        <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">This is worth asking about in the interview to understand how the team handles this aspect of the role.</p>
      </div>
    ` : ''}
    
    <!-- Interaction Warnings -->
    ${interactionWarnings.length > 0 ? `
      <div style="margin-top: 16px;">
        <div style="font-weight: 600; font-size: 12px; margin-bottom: 8px;">⚠️ Risk Interactions</div>
        ${interactionWarnings.map(warning => `
          <div style="padding: 8px 12px; background: rgba(245, 158, 11, 0.05); border-left: 2px solid #f59e0b; margin-bottom: 8px; border-radius: 4px; font-size: 11px;">
            ${escapeHtml(warning)}
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <!-- Confidence Note -->
    ${confidence.note ? `
      <div style="margin-top: 16px; padding: 8px 12px; background: #f8f7f4; border-radius: 4px; font-size: 10px; color: #6b7280; font-style: italic;">
        📊 ${escapeHtml(confidence.note)} ${confidence.reliable === false ? '⚠️' : ''}
      </div>
    ` : ''}
    
    <!-- LLM Narrative for Operational Complexity (if available) -->
    ${narrative?.operational_complexity ? `
      ${narrative.operational_complexity.factors && narrative.operational_complexity.factors.length > 0 ? `
        <div style="margin: 16px 0;">
          ${narrative.operational_complexity.factors.map(factor => `
            <div style="padding: 6px 0; font-size: 12px;">• ${escapeHtml(factor)}</div>
          `).join('')}
        </div>
      ` : ''}
      ${narrative.operational_complexity.primary_consideration ? `
        <div style="margin-top: 12px; font-size: 12px;"><strong>Primary Consideration:</strong> ${escapeHtml(narrative.operational_complexity.primary_consideration)}</div>
      ` : ''}
      ${narrative.operational_complexity.what_to_ask ? `
        <div style="margin-top: 8px; font-size: 11px; color: #c9a84c;">💡 ${escapeHtml(narrative.operational_complexity.what_to_ask)}</div>
      ` : ''}
    ` : ''}
  </section>
` : '';

// ============================================================
// LLM-GENERATED OPERATIONAL REALITY DECODED (from rubric)
// This section renders the narrative operational reality content
// generated by the LLM in the /generate-report endpoint
// ============================================================

const operationalRealityDecodedHtml = narrative?.operational_reality ? `
  <section>
    <h2>Operational Reality Decoded</h2>
    <p style="margin-bottom: 16px;">What the scores mean for you in plain English.</p>
    
    ${narrative.operational_reality.observations && narrative.operational_reality.observations.length > 0 ? `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px;">Key Observations</div>
        ${narrative.operational_reality.observations.map(obs => `
          <div style="padding: 8px 0 8px 12px; border-left: 2px solid #c9a84c; margin-bottom: 8px; font-size: 13px;">
            ${escapeHtml(obs)}
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    ${narrative.operational_reality.primary_consideration ? `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px;">Primary Consideration</div>
        <div style="padding: 10px 14px; background: #f8f7f4; border-radius: 6px; font-size: 13px;">
          ${escapeHtml(narrative.operational_reality.primary_consideration)}
        </div>
      </div>
    ` : ''}
    
    ${narrative.operational_reality.what_to_ask ? `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px;">What to Ask</div>
        <div style="padding: 10px 14px; background: #f8f7f4; border-radius: 6px; font-size: 13px;">
          💡 ${escapeHtml(narrative.operational_reality.what_to_ask)}
        </div>
      </div>
    ` : ''}
    
    ${narrative.operational_reality.bottom_line ? `
      <div style="margin-top: 16px; padding: 12px 16px; background: rgba(198, 164, 63, 0.08); border-left: 3px solid #c9a84c; border-radius: 4px; font-size: 13px;">
        <strong>Bottom Line:</strong> ${escapeHtml(narrative.operational_reality.bottom_line)}
      </div>
    ` : ''}
  </section>
` : '';

  // ============================================================
  // NARRATIVE SECTIONS (from LLM) - Only render if provided
  // ============================================================
  
  // Cover Letter Framework - with bullet array support
  const coverLetterHtml = narrative?.cover_letter ? `
    <section>
      <h2>Cover Letter Framework</h2>
      <div class="cover-letter-box">
        <div class="cover-letter-section">
          <h3>Opening Paragraph – Hook:</h3>
          <p>${escapeHtml(narrative.cover_letter.opening_hook)}</p>
        </div>
        <div class="cover-letter-section">
          <h3>Key Achievements – Bullet Points:</h3>
          <ul class="cover-letter-bullets">
            ${narrative.cover_letter.middle_evidence_bullets?.map(bullet => `
              <li>${escapeHtml(bullet)}</li>
            `).join('') || '<li>No specific achievements identified.</li>'}
          </ul>
        </div>
        <div class="cover-letter-section">
          <h3>Closing Paragraph – Value:</h3>
          <p>${escapeHtml(narrative.cover_letter.closing_value)}</p>
        </div>
        ${narrative.cover_letter.keywords && narrative.cover_letter.keywords.length > 0 ? `
          <div class="cover-letter-section">
            <h3>Keywords to Include:</h3>
            <p>${escapeHtml(narrative.cover_letter.keywords.join(', '))}</p>
          </div>
        ` : ''}
      </div>
    </section>
  ` : '';
  
  // Likely Interview Questions
  const interviewQuestionsHtml = narrative?.interview_questions && narrative.interview_questions.length > 0 ? `
    <section>
      <h2>Likely Interview Questions</h2>
      ${narrative.interview_questions.map((q, idx) => `
        <div class="interview-question">
          <div class="question-title">${idx + 1}. ${escapeHtml(q.question)}</div>
          <p><strong>What they're really testing:</strong> ${escapeHtml(q.what_they_test)}</p>
          <p><strong>Your best evidence:</strong> ${escapeHtml(q.best_evidence)}</p>
          <p><strong>STAR guidance:</strong> ${escapeHtml(q.star_guidance)}</p>
        </div>
      `).join('')}
    </section>
  ` : '';
  
  // Advantage vs. Risk
  const advantageRiskHtml = narrative?.advantage_risk ? `
    <section>
      <h2>Your Advantage vs. Your Risk</h2>
      <div class="advantage-box">
        <h3>Your Advantage:</h3>
        <p>${escapeHtml(narrative.advantage_risk.advantage)}</p>
      </div>
      <div class="risk-box">
        <h3>Your Risk:</h3>
        <p>${escapeHtml(narrative.advantage_risk.risk)}</p>
      </div>
    </section>
  ` : '';
  
  // Questions You Should Ask Them
  const questionsToAskHtml = narrative?.questions_to_ask && narrative.questions_to_ask.length > 0 ? `
    <section>
      <h2>Questions You Should Ask Them</h2>
      <ul class="questions-list">
        ${narrative.questions_to_ask.map(q => `<li>${escapeHtml(q)}</li>`).join('')}
      </ul>
    </section>
  ` : '';
  
  // Build the complete HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Veritas Hidden Brief Intelligence Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=Playfair+Display:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f3f0;
      color: #1a1f2e;
      line-height: 1.5;
      font-size: 14px;
      padding: 40px 24px;
    }
    
    .report-container {
      max-width: 1000px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
        margin: 0;
      }
      .report-container {
        box-shadow: none;
        max-width: 100%;
      }
      .no-print {
        display: none;
      }
      a {
        text-decoration: none;
        color: black;
      }
      .instruction-banner {
        display: none;
      }
    }
    
    .report-header {
      text-align: center;
      padding: 48px 48px 32px;
      border-bottom: 1px solid #e6e4dd;
      background: #ffffff;
    }
    
    .logo {
      max-width: 180px;
      height: auto;
      margin-bottom: 16px;
    }
    
    .logo-text {
      font-family: 'Playfair Display', serif;
      letter-spacing: 6px;
      font-size: 28px;
      font-weight: 600;
      color: #c9a84c;
    }
    
    .logo-tagline {
      font-family: 'Playfair Display', serif;
      font-size: 10px;
      letter-spacing: 2px;
      color: #8a8a8a;
      margin-top: 6px;
    }
    
    .instruction-banner {
      background: #f8f7f4;
      border-bottom: 1px solid #e6e4dd;
      padding: 12px 48px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    
    .report-content {
      padding: 40px 48px;
    }
    
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 600;
      color: #1a1f2e;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #c9a84c;
    }
    
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 600;
      color: #c9a84c;
      margin: 32px 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    h3 {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1a1f2e;
      margin: 20px 0 10px 0;
    }
    
    .key-findings {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    
    .finding-card {
      border-left: 3px solid #c9a84c;
      padding: 12px 16px;
      background: #f8f7f4;
    }
    
    .finding-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    
    .finding-value {
      font-weight: 600;
      font-size: 14px;
      color: #1a1f2e;
    }
    
    .risk-item {
      padding: 16px;
      margin: 12px 0;
      border-radius: 4px;
    }
    
    .risk-critical {
      background: rgba(239, 68, 68, 0.05);
      border-left: 3px solid #ef4444;
    }
    
    .risk-high {
      background: rgba(245, 158, 11, 0.05);
      border-left: 3px solid #f97316;
    }
    
    .risk-medium {
      background: rgba(245, 158, 11, 0.05);
      border-left: 3px solid #f59e0b;
    }
    
    .risk-low {
      background: rgba(16, 185, 129, 0.05);
      border-left: 3px solid #10b981;
    }
    
    .risk-advice {
      font-size: 12px;
      color: #6b7280;
      margin-top: 8px;
    }
    
    .stakeholder-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    
    .stakeholder-table th {
      text-align: left;
      padding: 12px 8px;
      background: #f8f7f4;
      font-weight: 600;
      font-size: 12px;
      border-bottom: 1px solid #e6e4dd;
    }
    
    .stakeholder-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e6e4dd;
      font-size: 13px;
    }
    
    .requirement-card {
      padding: 16px;
      margin: 12px 0;
      background: #f8f7f4;
      border-radius: 4px;
      border-left: 3px solid #c9a84c;
    }
    
    .requirement-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #1a1f2e;
      font-size: 14px;
    }
    
    .repetition-item {
      padding: 12px;
      border-bottom: 1px solid #e6e4dd;
    }
    
    .repetition-phrase {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 4px;
    }
    
    .repetition-count {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    
    .repetition-signal {
      font-size: 12px;
      color: #4a5568;
    }
    
    .unicorn-banner {
      padding: 20px;
      margin: 24px 0;
      background: rgba(239, 68, 68, 0.08);
      border-left: 4px solid #ef4444;
      border-radius: 4px;
    }
    
    .unicorn-title {
      font-weight: 700;
      font-size: 14px;
      color: #ef4444;
      margin-bottom: 8px;
    }
    
    .unicorn-severity {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .unicorn-severity.critical {
      color: #ef4444;
    }
    
    .unicorn-severity.warning {
      color: #f59e0b;
    }
    
    .unicorn-reason {
      margin: 12px 0;
      padding: 8px;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 4px;
    }
    
    .unicorn-advice {
      margin-top: 12px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 4px;
      font-size: 12px;
    }
    
    .core-problem-insight {
      background: rgba(198, 164, 63, 0.08);
      border-left: 3px solid #c9a84c;
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    
    .evidence-quote {
      font-style: italic;
      color: #6b7280;
      margin: 8px 0;
      padding-left: 16px;
      border-left: 2px solid #e6e4dd;
    }
    
    .advantage-box {
      background: rgba(16, 185, 129, 0.05);
      border-left: 3px solid #10b981;
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    
    .risk-box {
      background: rgba(245, 158, 11, 0.05);
      border-left: 3px solid #f59e0b;
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    
    .cover-letter-box {
      background: #f8f7f4;
      padding: 20px;
      border-radius: 8px;
      margin: 16px 0;
    }
    
    .cover-letter-section {
      margin-bottom: 20px;
    }
    
    .cover-letter-section h3 {
      font-size: 13px;
      color: #c9a84c;
      margin-bottom: 8px;
    }
    
    .cover-letter-bullets {
      margin: 12px 0 0 20px;
      padding-left: 0;
    }
    
    .cover-letter-bullets li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
    
    .interview-question {
      background: #f8f7f4;
      padding: 16px;
      margin: 12px 0;
      border-radius: 8px;
      border-left: 3px solid #c9a84c;
    }
    
    .question-title {
      font-weight: 700;
      color: #c9a84c;
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .questions-list {
      margin: 16px 0;
      padding-left: 20px;
    }
    
    .questions-list li {
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .action-list {
      list-style: none;
      padding: 0;
    }
    
    .action-list li {
      padding: 8px 0;
      border-bottom: 1px solid #e6e4dd;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .action-list li::before {
      content: "☐";
      color: #c9a84c;
      font-size: 14px;
    }
    
    .report-footer {
      padding: 24px 48px;
      border-top: 1px solid #e6e4dd;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      background: #f8f7f4;
    }
    
    .footer-tagline {
      font-family: 'Playfair Display', serif;
      font-size: 12px;
      font-style: italic;
      color: #c9a84c;
      margin-bottom: 8px;
    }
    
    .report-metadata {
      margin-top: 24px;
      padding: 16px;
      background: #f8f7f4;
      border-radius: 4px;
      font-size: 11px;
      color: #6b7280;
    }
    
    .report-metadata p {
      margin: 4px 0;
    }
    
    hr {
      border: none;
      border-top: 1px solid #e6e4dd;
      margin: 24px 0;
    }
    
    @media (max-width: 768px) {
      .report-content {
        padding: 24px;
      }
      .report-header {
        padding: 32px 24px;
      }
      .key-findings {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
<div class="report-container">
  <div class="report-header">
    <img src="https://raw.githubusercontent.com/keron62-spec/VeritasResumeIntelligence/main/public/images/veritaslogo.jpeg" alt="Veritas Logo" class="logo">
    <div class="logo-text">VERITAS</div>
    <div class="logo-tagline">See clearly, act decisively</div>
  </div>
  
  <div class="instruction-banner no-print">
    💡 To save as PDF: Press <strong>Ctrl+P</strong> (Windows) or <strong>Cmd+P</strong> (Mac) → Select "Save as PDF"
  </div>
  
  <div class="report-content">
    <h1>Hidden Brief Intelligence Report</h1>
    
    <!-- Executive Summary -->
    <section>
      <h2>Executive Summary</h2>
      ${keyFindingsHtml}
      <p>${escapeHtml(recommendationSummary || 'Review the full analysis for insights on this role.')}</p>
    </section>
    
    <!-- What This Role is Designed to Address -->
    <section>
      <h2>What This Role is Designed to Address</h2>
      <p><strong>What the JD states:</strong> ${escapeHtml(coreProblem.stated_task || 'Not explicitly stated in the job description.')}</p>
      ${coreProblem.inferred_problem ? `
        <div class="core-problem-insight">
          <p>${escapeHtml(coreProblem.inferred_problem)}</p>
        </div>
      ` : ''}
      ${coreProblem.evidence_quotes && coreProblem.evidence_quotes.length > 0 ? `
        <div class="evidence-quote">
          ${coreProblem.evidence_quotes.map(quote => `<p>“${escapeHtml(quote)}”</p>`).join('')}
        </div>
      ` : ''}
    </section>
    
    <!-- JD Quality Assessment -->
    <section>
      <h2>JD Quality Assessment</h2>
      <div class="key-findings">
        <div class="finding-card">
          <div class="finding-label">Word Count</div>
          <div class="finding-value">${jdQuality.word_count || 'N/A'} words</div>
        </div>
        <div class="finding-card">
          <div class="finding-label">Detected Seniority</div>
          <div class="finding-value">${escapeHtml(jdQuality.detected_seniority || 'Not detected')}</div>
        </div>
        <div class="finding-card">
          <div class="finding-label">Maturity Grade</div>
          <div class="finding-value ${getMaturityClass(jdQuality.maturity_grade)}">${escapeHtml(jdQuality.maturity_grade || 'Not assessed')}</div>
        </div>
        <div class="finding-card">
          <div class="finding-label">Red Flag Risk</div>
          <div class="finding-value">${escapeHtml(jdQuality.red_flag_risk || 'None')}</div>
        </div>
      </div>
      <p>${escapeHtml(jdQuality.assessment || 'No additional assessment available.')}</p>
      ${jdQuality.over_titled_risk?.detected ? `
        <div class="risk-item risk-high">
          <strong>⚠️ Potential Over-Titled Role</strong>
          <p>${escapeHtml(jdQuality.over_titled_risk.explanation)}</p>
          <p class="risk-advice">💡 ${escapeHtml(jdQuality.over_titled_risk.recommendation)}</p>
        </div>
      ` : ''}
    </section>
    
    <!-- Stakeholders -->
    <section>
      <h2>Stakeholders Mentioned in the JD</h2>
      ${stakeholderTableHtml}
      <p>💡 ${escapeHtml(stakeholderComplexity.resume_framing_advice || 'Prepare examples of coordinating across multiple stakeholder groups with competing priorities.')}</p>
    </section>
    
    <!-- Hidden Requirements -->
    ${hiddenRequirements.length > 0 ? `
      <section>
        <h2>What They're Not Saying (Hidden Requirements)</h2>
        ${hiddenRequirementsHtml}
      </section>
    ` : ''}
    
    <!-- Risk Indicators -->
    ${risksHtml ? `
      <section>
        <h2>Risk Indicators</h2>
        ${risksHtml}
      </section>
    ` : ''}
    
    <!-- Unicorn Detection -->
    ${unicornHtml}
    
    <!-- Title-Function Mismatch -->
    ${scopeMismatch.detected ? `
      <section>
        <h2>Title-Function Mismatch</h2>
        <div class="risk-item ${scopeMismatch.severity === 'High' ? 'risk-high' : 'risk-medium'}">
          <strong>${scopeMismatch.mismatch_type?.replace('_', ' ').toUpperCase()}</strong>
          <p>${escapeHtml(scopeMismatch.explanation || '')}</p>
          <p class="risk-advice">💡 ${escapeHtml(scopeMismatch.resume_framing_advice || '')}</p>
        </div>
      </section>
    ` : ''}
    
    <!-- Words and Phrases to Use -->
    ${repetitionSignals.length > 0 ? `
      <section>
        <h2>Words and Phrases to Use</h2>
        ${repetitionSignalsHtml}
        ${languagePattern.resume_framing_tip ? `
          <p><strong>Resume Framing Tip:</strong> ${escapeHtml(languagePattern.resume_framing_tip)}</p>
        ` : ''}
      </section>
    ` : ''}
    
    <!-- ============================================================
         COMPLEXITY ANALYSIS SECTION (NEW)
         ============================================================ -->
    ${complexityAnalysisHtml}
    
    <!-- ============================================================
    OPERATIONAL REALITY & COMPLEXITY SECTIONS
    ============================================================ -->
${operationalRealityHtml}
${operationalComplexityHtml}

    <!-- ============================================================
    OPERATIONAL REALITY DECODED (LLM-GENERATED NARRATIVE)
    ============================================================ -->
${operationalRealityDecodedHtml}

    <!-- ============================================================
         NARRATIVE SECTIONS (from LLM)
         ============================================================ -->
    ${coverLetterHtml}
    ${interviewQuestionsHtml}
    ${advantageRiskHtml}
    ${questionsToAskHtml}
    
    <!-- Specific Actions to Take -->
    <section>
      <h2>Specific Actions to Take</h2>
      <ul class="action-list">
        <li>Review the JD for any stakeholder groups not listed in this report</li>
        <li>Prepare examples of coordinating across multiple stakeholders and navigating approval processes</li>
        <li>Research the organization's recent projects in this area</li>
        <li>Prepare questions about approval processes and reporting expectations</li>
        <li>Tailor your resume to emphasize relevant skills and keywords</li>
      </ul>
    </section>
    
    <!-- Report Metadata -->
    <div class="report-metadata">
      <p><strong>Report ID:</strong> ${reportId}</p>
      <p><strong>Generated:</strong> ${generationDate}</p>
      <p><strong>Disclaimer:</strong> This report is based on analysis of the job description. Verify all claims in the interview. The Veritas Intelligence Platform is not responsible for the outcome of any application.</p>
    </div>
  </div>
  
  <div class="report-footer">
    <div class="footer-tagline">Veritas – See clearly, act decisively</div>
    <p>© 2026 Veritas Intelligence Platform. All rights reserved.</p>
  </div>
  
  <div class="instruction-banner no-print" style="border-top: 1px solid #e6e4dd; border-bottom: none;">
    💡 To save as PDF: Press <strong>Ctrl+P</strong> (Windows) or <strong>Cmd+P</strong> (Mac) → Select "Save as PDF"
  </div>
</div>

<script>
  // Optional: Auto-open print dialog after a short delay to ensure fonts and images load
  // Uncomment the lines below if you want the PDF dialog to open automatically
  /*
  window.onload = function() {
    setTimeout(function() {
      window.print();
    }, 750);
  };
  */
</script>
</body>
</html>`;
  
  return { html, reportId, generationDate };
}