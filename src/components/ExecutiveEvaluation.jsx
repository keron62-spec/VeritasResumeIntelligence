import React from 'react';

export default function ExecutiveEvaluation({ executiveEvaluation, executiveActive }) {
    if (!executiveActive || !executiveEvaluation) {
        return null;
    }
    
    const gradeColors = {
        'Board-Ready': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', icon: '👑' },
        'Strong Executive': { bg: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', icon: '⭐' },
        'Developing Executive': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', icon: '🌱' },
        'Misaligned': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', icon: '⚠️' }
    };
    
    const gradeInfo = gradeColors[executiveEvaluation.executive_grade] || gradeColors['Developing Executive'];
    
    // Calculate percentage for progress bars
    const getPercentage = (score, max) => (score / max) * 100;
    
    // Helper to get score color based on percentage
    const getScoreColor = (percentage) => {
        if (percentage >= 80) return '#10b981';
        if (percentage >= 60) return '#2563eb';
        if (percentage >= 40) return '#f59e0b';
        return '#ef4444';
    };
    
    return (
        <div className="executive-evaluation" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: `1px solid ${gradeInfo.color}`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Executive Badge */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: '4px 12px',
                backgroundColor: gradeInfo.bg,
                color: gradeInfo.color,
                fontSize: '11px',
                fontWeight: '600',
                borderBottomLeftRadius: '8px',
                letterSpacing: '0.5px'
            }}>
                {gradeInfo.icon} Executive Modifier Active
            </div>
            
            {/* Header */}
            <div style={{ marginBottom: '20px', paddingRight: '120px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👔</span> Executive Evaluation
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Executive-level scoring based on P&L ownership, organizational scale, strategic impact, and board exposure
                </p>
            </div>
            
            {/* Executive Grade Banner */}
            <div style={{
                backgroundColor: gradeInfo.bg,
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Executive Grade</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: gradeInfo.color }}>
                        {executiveEvaluation.executive_grade}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Score</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: gradeInfo.color }}>
                        {executiveEvaluation.executive_total_score}<span style={{ fontSize: '12px', fontWeight: 'normal' }}>/90</span>
                    </div>
                </div>
                {executiveEvaluation.legacy_bonus_applied && (
                    <div style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '20px',
                        fontSize: '11px',
                        color: '#10b981'
                    }}>
                        +{executiveEvaluation.legacy_bonus_applied} legacy bonus
                    </div>
                )}
            </div>
            
            {/* Score Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
            }}>
                {/* P&L Accountability */}
                <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>💰 P&L Accountability</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: getScoreColor(getPercentage(executiveEvaluation.pl_accountability?.score || 0, 25)) }}>
                            {executiveEvaluation.pl_accountability?.score || 0}/25
                        </div>
                    </div>
                    <div style={{
                        height: '6px',
                        backgroundColor: 'var(--border-light)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            width: `${getPercentage(executiveEvaluation.pl_accountability?.score || 0, 25)}%`,
                            height: '100%',
                            backgroundColor: getScoreColor(getPercentage(executiveEvaluation.pl_accountability?.score || 0, 25)),
                            borderRadius: '3px'
                        }} />
                    </div>
                    {executiveEvaluation.pl_accountability?.evidence && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            📋 {executiveEvaluation.pl_accountability.evidence.substring(0, 80)}...
                        </div>
                    )}
                </div>
                
                {/* Organizational Scale */}
                <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>🏢 Organizational Scale</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: getScoreColor(getPercentage(executiveEvaluation.organizational_scale?.score || 0, 20)) }}>
                            {executiveEvaluation.organizational_scale?.score || 0}/20
                        </div>
                    </div>
                    <div style={{
                        height: '6px',
                        backgroundColor: 'var(--border-light)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            width: `${getPercentage(executiveEvaluation.organizational_scale?.score || 0, 20)}%`,
                            height: '100%',
                            backgroundColor: getScoreColor(getPercentage(executiveEvaluation.organizational_scale?.score || 0, 20)),
                            borderRadius: '3px'
                        }} />
                    </div>
                    {executiveEvaluation.organizational_scale?.evidence && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            📋 {executiveEvaluation.organizational_scale.evidence.substring(0, 80)}...
                        </div>
                    )}
                </div>
                
                {/* Strategic Impact */}
                <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>🎯 Strategic Impact</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: getScoreColor(getPercentage(executiveEvaluation.strategic_impact?.score || 0, 20)) }}>
                            {executiveEvaluation.strategic_impact?.score || 0}/20
                        </div>
                    </div>
                    <div style={{
                        height: '6px',
                        backgroundColor: 'var(--border-light)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            width: `${getPercentage(executiveEvaluation.strategic_impact?.score || 0, 20)}%`,
                            height: '100%',
                            backgroundColor: getScoreColor(getPercentage(executiveEvaluation.strategic_impact?.score || 0, 20)),
                            borderRadius: '3px'
                        }} />
                    </div>
                    {executiveEvaluation.strategic_impact?.evidence && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            📋 {executiveEvaluation.strategic_impact.evidence.substring(0, 80)}...
                        </div>
                    )}
                </div>
                
                {/* Stakeholder Exposure */}
                <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>🤝 Stakeholder Exposure</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: getScoreColor(getPercentage(executiveEvaluation.stakeholder_exposure?.score || 0, 15)) }}>
                            {executiveEvaluation.stakeholder_exposure?.score || 0}/15
                        </div>
                    </div>
                    <div style={{
                        height: '6px',
                        backgroundColor: 'var(--border-light)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            width: `${getPercentage(executiveEvaluation.stakeholder_exposure?.score || 0, 15)}%`,
                            height: '100%',
                            backgroundColor: getScoreColor(getPercentage(executiveEvaluation.stakeholder_exposure?.score || 0, 15)),
                            borderRadius: '3px'
                        }} />
                    </div>
                    {executiveEvaluation.stakeholder_exposure?.evidence && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            📋 {executiveEvaluation.stakeholder_exposure.evidence.substring(0, 80)}...
                        </div>
                    )}
                </div>
                
                {/* Tenure & Trajectory */}
                <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>📈 Tenure & Trajectory</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: getScoreColor(getPercentage(executiveEvaluation.tenure_trajectory?.score || 0, 10)) }}>
                            {executiveEvaluation.tenure_trajectory?.score || 0}/10
                        </div>
                    </div>
                    <div style={{
                        height: '6px',
                        backgroundColor: 'var(--border-light)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            width: `${getPercentage(executiveEvaluation.tenure_trajectory?.score || 0, 10)}%`,
                            height: '100%',
                            backgroundColor: getScoreColor(getPercentage(executiveEvaluation.tenure_trajectory?.score || 0, 10)),
                            borderRadius: '3px'
                        }} />
                    </div>
                    {executiveEvaluation.tenure_trajectory?.pattern && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            📋 Pattern: {executiveEvaluation.tenure_trajectory.pattern}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Legacy Signals & Concerns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
            }}>
                {executiveEvaluation.legacy_signals_found && executiveEvaluation.legacy_signals_found.length > 0 && (
                    <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        borderRadius: '8px',
                        padding: '12px',
                        borderLeft: '3px solid #10b981'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#10b981' }}>
                            ✨ Legacy Signals
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {executiveEvaluation.legacy_signals_found.map((signal, i) => (
                                <span key={i} style={{
                                    fontSize: '10px',
                                    padding: '2px 8px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '12px',
                                    color: '#10b981'
                                }}>{signal}</span>
                            ))}
                        </div>
                    </div>
                )}
                
                {executiveEvaluation.concern_signals_found && executiveEvaluation.concern_signals_found.length > 0 && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        borderRadius: '8px',
                        padding: '12px',
                        borderLeft: '3px solid #ef4444'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#ef4444' }}>
                            ⚠️ Concern Signals
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {executiveEvaluation.concern_signals_found.map((signal, i) => (
                                <span key={i} style={{
                                    fontSize: '10px',
                                    padding: '2px 8px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '12px',
                                    color: '#ef4444'
                                }}>{signal}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Executive Summary Note */}
            <div style={{
                padding: '10px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                textAlign: 'center'
            }}>
                💼 <strong>Executive Recruiting Insight:</strong> This evaluation simulates how executive search firms assess senior leadership candidates. Focus on P&L scale, organizational impact, and board-level engagement.
            </div>
        </div>
    );
}