import React, { useState } from 'react';

export default function HiddenBriefCard({ 
  hiddenBrief, 
  onApplyToBullets, 
  onApplyToSummary,
  isApplyingBullets,
  isApplyingSummary
}) {
  const [expandedSections, setExpandedSections] = useState({
    quality: true,
    problem: true,
    requirements: true,
    bottlenecks: true,
    contradictions: false,
    repetitions: false,
    unicorn: true  // ADDED - new section state
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!hiddenBrief) return null;

  const {
    jd_quality_assessment,
    sector_classification,
    vocabulary_contamination,
    core_problem,
    hidden_requirements,
    decision_bottleneck_risk,
    scale_surge_risk,
    burnout_risk,
    scope_grade_mismatch,
    repetition_signals,
    stakeholder_complexity,
    recommendation_summary,
    analysis_limitations,
    unicorn_detection  // ADDED - new field
  } = hiddenBrief;

  // Helper to get risk color
  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#64748b';
    }
  };

  // Helper to get maturity grade color
  const getMaturityColor = (grade) => {
    switch(grade) {
      case 'Mature': return '#10b981';
      case 'Adequate': return '#3b82f6';
      case 'Concerning': return '#f59e0b';
      case 'Red Flag': return '#f97316';
      case 'Critical Red Flag': return '#ef4444';
      case 'Dysfunctional': return '#dc2626';
      default: return '#64748b';
    }
  };

  // Helper to get unicorn banner color based on severity
  const getUnicornColor = (severity) => {
    switch(severity) {
      case 'critical': return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444', icon: '🦄⚠️' };
      case 'warning': return { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#f59e0b', icon: '🦄' };
      case 'info': return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#3b82f6', icon: 'ℹ️🦄' };
      default: return { bg: 'rgba(100, 116, 139, 0.1)', border: '#64748b', text: '#64748b', icon: '🦄' };
    }
  };

  // Determine unicorn placement
  const isCritical = unicorn_detection?.detected && unicorn_detection.severity === 'critical';
  const isWarning = unicorn_detection?.detected && unicorn_detection.severity === 'warning';
  const isInfo = unicorn_detection?.detected && unicorn_detection.severity === 'info';

  return (
    <div className="hidden-brief-card" style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-light)',
      marginBottom: '24px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        backgroundColor: 'rgba(198, 164, 63, 0.08)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>🕵️</span>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, fontFamily: "'Playfair Display', serif" }}>
              Hidden Brief Intelligence
            </h2>
            <span style={{
              fontSize: '10px',
              padding: '2px 8px',
              backgroundColor: 'rgba(198, 164, 63, 0.15)',
              borderRadius: '20px',
              color: '#c9a84c'
            }}>
              Insider Intelligence
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            What the job description doesn't say — but you need to know
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onApplyToBullets}
            disabled={isApplyingBullets}
            style={{
              padding: '8px 16px',
              backgroundColor: '#c9a84c',
              color: '#1a1f2e',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: isApplyingBullets ? 0.6 : 1
            }}
          >
            {isApplyingBullets ? 'Applying...' : '✨ Apply to Bullets'}
          </button>
          <button
            onClick={onApplyToSummary}
            disabled={isApplyingSummary}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #c9a84c',
              color: '#c9a84c',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: isApplyingSummary ? 0.6 : 1
            }}
          >
            {isApplyingSummary ? 'Applying...' : '📝 Apply to Summary'}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        
        {/* ============================================================
            UNICORN DETECTION - CRITICAL SEVERITY (TOP OF CARD)
            ============================================================ */}
        {isCritical && unicorn_detection && (
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: getUnicornColor('critical').bg,
            borderLeft: `4px solid ${getUnicornColor('critical').border}`,
            borderRadius: '8px'
          }}>
            <div 
              onClick={() => toggleSection('unicorn')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{getUnicornColor('critical').icon}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: getUnicornColor('critical').text }}>
                    CRITICAL: UNREALISTIC REQUIREMENTS
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {unicorn_detection.summary}
                  </div>
                </div>
              </div>
              <span>{expandedSections.unicorn ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.unicorn && unicorn_detection.reasons && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                {unicorn_detection.reasons.map((reason, idx) => (
                  <div key={idx} style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                      {reason.pattern === 'years_exceed_field_age' && '📅 Years of Experience Exceeds Field Age'}
                      {reason.pattern === 'contradictory_seniority' && '🔀 Contradictory Seniority Levels'}
                      {reason.pattern === 'rare_skills_stack' && '🔬 Rare Skills Stack'}
                      {reason.pattern === 'scope_title_mismatch' && '📋 Scope vs Title Mismatch'}
                      {reason.pattern === 'operational_contradictions' && '⚡ Operational Contradictions'}
                      {!reason.pattern && '⚠️ Issue Detected'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Evidence: "{reason.evidence_phrase}"
                    </div>
                    <div style={{ fontSize: '12px' }}>{reason.explanation}</div>
                  </div>
                ))}
                {unicorn_detection.advice && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    <strong>💡 Advice:</strong> {unicorn_detection.advice}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* JD Quality Assessment - NEW SECTION */}
        {jd_quality_assessment && (
          <div style={{ marginBottom: '24px' }}>
            <div 
              onClick={() => toggleSection('quality')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>JD Quality Assessment</h3>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  backgroundColor: getMaturityColor(jd_quality_assessment.maturity_grade),
                  color: '#fff'
                }}>
                  {jd_quality_assessment.maturity_grade}
                </span>
              </div>
              <span>{expandedSections.quality ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.quality && (
              <div style={{ padding: '16px 0', fontSize: '13px', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
                  {jd_quality_assessment.assessment}
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Word Count</span>
                    <div style={{ fontWeight: '600' }}>{jd_quality_assessment.word_count} words</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Detected Seniority</span>
                    <div style={{ fontWeight: '600' }}>{jd_quality_assessment.detected_seniority}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Red Flag Risk</span>
                    <div style={{ fontWeight: '600', color: getRiskColor(jd_quality_assessment.red_flag_risk) }}>
                      {jd_quality_assessment.red_flag_risk}
                    </div>
                  </div>
                </div>

                {jd_quality_assessment.over_titled_risk?.detected && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderLeft: '3px solid #ef4444',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>⚠️ Potential Over-Titled Role</div>
                    <p style={{ fontSize: '12px', marginBottom: '4px' }}>{jd_quality_assessment.over_titled_risk.explanation}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{jd_quality_assessment.over_titled_risk.recommendation}</p>
                  </div>
                )}

                {jd_quality_assessment.interview_questions?.length > 0 && (
                  <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '12px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '12px' }}>
                      💡 Questions to ask in the interview:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
                      {jd_quality_assessment.interview_questions.map((q, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {jd_quality_assessment.analysis_limitation_note && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
                    ⚠️ {jd_quality_assessment.analysis_limitation_note}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sector Classification */}
        {sector_classification && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Detected Sector</span>
                <div style={{ fontWeight: '600' }}>{sector_classification.sector_name}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Confidence</span>
                <div style={{ 
                  fontWeight: '600',
                  color: sector_classification.training_confidence === 'high' ? '#10b981' : 
                         sector_classification.training_confidence === 'medium' ? '#f59e0b' : '#ef4444'
                }}>
                  {sector_classification.training_confidence?.toUpperCase()}
                </div>
              </div>
              {sector_classification.confidence_cap_note && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sector_classification.confidence_cap_note}</span>
              )}
            </div>
          </div>
        )}

        {/* Language Pattern (Cultural Assessment) */}
        {hiddenBrief.language_pattern?.language_pattern_detected && (
          <div style={{ marginBottom: '24px' }}>
            <div 
              onClick={() => toggleSection('language')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎭</span>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Cultural Language Pattern</h3>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: hiddenBrief.language_pattern.confidence === 'high' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: hiddenBrief.language_pattern.confidence === 'high' ? '#10b981' : '#f59e0b'
                }}>
                  {hiddenBrief.language_pattern.language_pattern_detected}
                </span>
              </div>
              <span>{expandedSections.language ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.language && (
              <div style={{ padding: '16px 0' }}>
                <p style={{ fontSize: '13px', marginBottom: '8px' }}>{hiddenBrief.language_pattern.what_this_pattern_suggests}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <em>{hiddenBrief.language_pattern.what_this_does_not_tell_you}</em>
                </p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  <strong>💡 Resume framing tip:</strong> {hiddenBrief.language_pattern.resume_framing_tip}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            UNICORN DETECTION - WARNING AND INFO SEVERITY (AFTER LANGUAGE PATTERN)
            ============================================================ */}
        {(isWarning || isInfo) && unicorn_detection && (
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: getUnicornColor(isWarning ? 'warning' : 'info').bg,
            borderLeft: `4px solid ${getUnicornColor(isWarning ? 'warning' : 'info').border}`,
            borderRadius: '8px'
          }}>
            <div 
              onClick={() => toggleSection('unicorn')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{getUnicornColor(isWarning ? 'warning' : 'info').icon}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: getUnicornColor(isWarning ? 'warning' : 'info').text }}>
                    {isWarning ? 'WARNING: Unusually Rare Requirements' : 'INFO: Unusual Role Pattern'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {unicorn_detection.summary}
                  </div>
                </div>
              </div>
              <span>{expandedSections.unicorn ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.unicorn && unicorn_detection.reasons && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                {unicorn_detection.reasons.map((reason, idx) => (
                  <div key={idx} style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                      {reason.pattern === 'rare_skills_stack' && '🔬 Rare Skills Stack'}
                      {reason.pattern === 'scope_title_mismatch' && '📋 Scope vs Title Mismatch'}
                      {reason.pattern === 'operational_contradictions' && '⚡ Operational Contradictions'}
                      {!reason.pattern && '⚠️ Issue Detected'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Evidence: "{reason.evidence_phrase}"
                    </div>
                    <div style={{ fontSize: '12px' }}>{reason.explanation}</div>
                  </div>
                ))}
                {unicorn_detection.advice && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    <strong>💡 Advice:</strong> {unicorn_detection.advice}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Core Problem - Most Important */}
        {core_problem && core_problem.inferred_problem && (
          <div style={{ marginBottom: '24px' }}>
            <div 
              onClick={() => toggleSection('problem')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎯</span>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>The Hidden Problem</h3>
                {core_problem.confidence && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: core_problem.confidence === 'high' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: core_problem.confidence === 'high' ? '#10b981' : '#f59e0b'
                  }}>
                    {core_problem.confidence} confidence
                  </span>
                )}
              </div>
              <span>{expandedSections.problem ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.problem && (
              <div style={{ padding: '16px 0' }}>
                <div style={{
                  backgroundColor: 'rgba(198, 164, 63, 0.08)',
                  borderLeft: '3px solid #c9a84c',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    {core_problem.inferred_problem}
                  </p>
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <strong>Stated task:</strong> {core_problem.stated_task}
                </div>
                
                {core_problem.evidence_quotes?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>Evidence from JD:</div>
                    <ul style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, paddingLeft: '20px' }}>
                      {core_problem.evidence_quotes.map((quote, idx) => (
                        <li key={idx}>“{quote}”</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {core_problem.inference_limitation && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
                    ⚠️ {core_problem.inference_limitation}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hidden Requirements */}
        {hidden_requirements && hidden_requirements.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div 
              onClick={() => toggleSection('requirements')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔒</span>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Hidden Requirements</h3>
              </div>
              <span>{expandedSections.requirements ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.requirements && (
              <div style={{ padding: '16px 0' }}>
                {hidden_requirements.map((req, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    borderLeft: `3px solid ${req.confidence === 'high' ? '#10b981' : '#f59e0b'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px' }}>{req.implied_requirement}</strong>
                      {req.signal_strength && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Signal strength: {req.signal_strength}%
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Signal: “{req.signal_phrase}”
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Risk Indicators - Bottleneck, Surge, Burnout */}
        <div style={{ marginBottom: '24px' }}>
          <div 
            onClick={() => toggleSection('bottlenecks')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '10px 0',
              borderBottom: '1px solid var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Risk Indicators</h3>
            </div>
            <span>{expandedSections.bottlenecks ? '▼' : '▶'}</span>
          </div>
          
          {expandedSections.bottlenecks && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                {decision_bottleneck_risk && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '12px' }}>Decision Bottleneck Risk</strong>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '600',
                        color: getRiskColor(decision_bottleneck_risk.risk_level)
                      }}>
                        {decision_bottleneck_risk.risk_level}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', marginBottom: '8px' }}>{decision_bottleneck_risk.explanation}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>💡 {decision_bottleneck_risk.resume_framing_advice}</p>
                  </div>
                )}
                
                {scale_surge_risk && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '12px' }}>Scale Surge Risk</strong>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '600',
                        color: getRiskColor(scale_surge_risk.risk_level)
                      }}>
                        {scale_surge_risk.risk_level}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', marginBottom: '8px' }}>{scale_surge_risk.explanation}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>💡 {scale_surge_risk.resume_framing_advice}</p>
                  </div>
                )}
                
                {burnout_risk && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '12px' }}>Burnout Risk</strong>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '600',
                        color: getRiskColor(burnout_risk.risk_level)
                      }}>
                        {burnout_risk.risk_level}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', marginBottom: '8px' }}>{burnout_risk.explanation}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>💡 {burnout_risk.resume_framing_advice}</p>
                    {burnout_risk.limitation_note && (
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                        {burnout_risk.limitation_note}
                      </p>
                    )}
                  </div>
                )}

                {scope_grade_mismatch && scope_grade_mismatch.detected && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(198, 164, 63, 0.08)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '12px' }}>Title-Function Mismatch</strong>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '600',
                        color: scope_grade_mismatch.severity === 'High' ? '#ef4444' : '#f59e0b'
                      }}>
                        {scope_grade_mismatch.mismatch_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', marginBottom: '8px' }}>{scope_grade_mismatch.explanation}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>💡 {scope_grade_mismatch.resume_framing_advice}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stakeholder Complexity */}
        {stakeholder_complexity && (
          <div style={{ marginBottom: '24px' }}>
            <div 
              onClick={() => toggleSection('bottlenecks')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🤝</span>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Stakeholder Complexity</h3>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: stakeholder_complexity.complexity_level === 'Very High' ? 'rgba(239, 68, 68, 0.15)' :
                                   stakeholder_complexity.complexity_level === 'High' ? 'rgba(245, 158, 11, 0.15)' :
                                   'rgba(16, 185, 129, 0.15)',
                  color: stakeholder_complexity.complexity_level === 'Very High' ? '#ef4444' :
                         stakeholder_complexity.complexity_level === 'High' ? '#f59e0b' : '#10b981'
                }}>
                  {stakeholder_complexity.complexity_level}
                </span>
              </div>
              <span>{expandedSections.bottlenecks ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.bottlenecks && (
              <div style={{ padding: '16px 0' }}>
                <p style={{ fontSize: '13px', marginBottom: '8px' }}>{stakeholder_complexity.explanation}</p>
                {stakeholder_complexity.stakeholder_types_identified?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {stakeholder_complexity.stakeholder_types_identified.map((type, idx) => (
                      <span key={idx} style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        color: 'var(--text-muted)'
                      }}>
                        {type}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  💡 {stakeholder_complexity.resume_framing_advice}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contradictions */}
        {hiddenBrief.language_pattern?.contradictions_detected?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div 
              onClick={() => toggleSection('contradictions')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔀</span>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Contradictions Detected</h3>
              </div>
              <span>{expandedSections.contradictions ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.contradictions && (
              <div style={{ padding: '16px 0' }}>
                {hiddenBrief.language_pattern.contradictions_detected.map((contradiction, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                      {contradiction.type}
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>{contradiction.explanation}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Severity: {contradiction.severity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Repetition Signals */}
        {repetition_signals && repetition_signals.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div 
              onClick={() => toggleSection('repetitions')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '10px 0',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔄</span>
                <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Repetition Signals</h3>
              </div>
              <span>{expandedSections.repetitions ? '▼' : '▶'}</span>
            </div>
            
            {expandedSections.repetitions && (
              <div style={{ padding: '16px 0' }}>
                {repetition_signals.map((signal, idx) => (
                  <div key={idx} style={{
                    padding: '10px',
                    borderBottom: idx < repetition_signals.length - 1 ? '1px solid var(--border-light)' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px' }}>“{signal.phrase}”</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>appears {signal.count} times</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{signal.signal}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendation Summary */}
        {recommendation_summary && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'rgba(198, 164, 63, 0.1)',
            borderRadius: '8px',
            borderLeft: '3px solid #c9a84c'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>🎯 Bottom Line</div>
            <p style={{ fontSize: '13px', margin: 0 }}>{recommendation_summary}</p>
          </div>
        )}

        {/* Analysis Limitations */}
        {analysis_limitations && analysis_limitations.length > 0 && (
          <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            <details>
              <summary style={{ cursor: 'pointer' }}>Analysis limitations</summary>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                {analysis_limitations.map((limitation, idx) => (
                  <li key={idx}>{limitation}</li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}