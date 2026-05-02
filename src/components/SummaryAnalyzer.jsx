import React, { useState } from 'react';

export default function SummaryAnalyzer({ summaryAnalysis }) {
    const [activeRewrite, setActiveRewrite] = useState('balanced');
    
    if (!summaryAnalysis || !summaryAnalysis.exists) {
        return (
            <div className="summary-analyzer" style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid var(--border-light)'
            }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📝</span> Summary Analyzer
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    No professional summary detected. Add a 2-3 sentence summary at the top of your resume to improve ATS scoring.
                </p>
                <button style={{
                    marginTop: '12px',
                    padding: '6px 12px',
                    background: 'var(--accent-blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                }}>
                    + Add Summary Template
                </button>
            </div>
        );
    }
    
    const scores = summaryAnalysis.scores || {};
    const rewrites = summaryAnalysis.rewrites || [];
    
    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };
    
    const getScoreLabel = (score, metric) => {
        if (metric === 'semantic_positioning') {
            if (score < -2) return 'Under-positioned';
            if (score <= 2) return 'Perfectly positioned';
            return 'Over-positioned';
        }
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs Work';
        return 'Poor';
    };
    
    return (
        <div className="summary-analyzer" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-light)'
        }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📝</span> Summary Analyzer
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    AI-powered analysis of your professional summary
                </span>
            </h3>
            
            {/* Original Summary */}
            <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px'
            }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Summary</div>
                <div style={{ fontSize: '13px', lineHeight: '1.5' }}>{summaryAnalysis.original_text}</div>
            </div>
            
            {/* Score Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Semantic Positioning</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(scores.semantic_positioning) }}>
                        {scores.semantic_positioning > 0 ? '+' : ''}{scores.semantic_positioning || 0}
                    </div>
                    <div style={{ fontSize: '10px', color: getScoreColor(scores.semantic_positioning) }}>
                        {getScoreLabel(scores.semantic_positioning, 'semantic_positioning')}
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bloom Level</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(scores.bloom_level * 20) }}>
                        {scores.bloom_level || 0}
                    </div>
                    <div style={{ fontSize: '10px', color: getScoreColor(scores.bloom_level * 20) }}>
                        {scores.bloom_level >= 5 ? 'Strategic' : scores.bloom_level >= 3 ? 'Analytical' : 'Basic'}
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RIASEC Signal</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>{scores.riasec_signal || 'N/A'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {scores.riasec_signal === 'E' ? 'Enterprising' : 
                         scores.riasec_signal === 'S' ? 'Social' :
                         scores.riasec_signal === 'I' ? 'Investigative' : 'Mixed'}
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Credibility</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(scores.credibility) }}>
                        {scores.credibility || 0}%
                    </div>
                    <div style={{ fontSize: '10px', color: getScoreColor(scores.credibility) }}>
                        {getScoreLabel(scores.credibility)}
                    </div>
                </div>
            </div>
            
            {/* Issues specific to summary */}
            {summaryAnalysis.issues && summaryAnalysis.issues.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>⚠️ Issues Found</div>
                    {summaryAnalysis.issues.map((issue, idx) => (
                        <div key={idx} style={{
                            fontSize: '12px',
                            padding: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            borderRadius: '6px',
                            marginBottom: '6px',
                            borderLeft: `3px solid ${issue.priority === 'high' ? '#ef4444' : issue.priority === 'medium' ? '#f59e0b' : '#6b7280'}`
                        }}>
                            <strong>{issue.issue}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>💡 {issue.fix}</div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Rewrite Options */}
            {rewrites.length > 0 && (
                <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>✏️ Suggested Rewrites</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {rewrites.map((rewrite, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveRewrite(rewrite.version)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: `1px solid ${activeRewrite === rewrite.version ? 'var(--accent-blue)' : 'var(--border-light)'}`,
                                    background: activeRewrite === rewrite.version ? 'var(--accent-blue)' : 'transparent',
                                    color: activeRewrite === rewrite.version ? 'white' : 'var(--text-secondary)',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                {rewrite.version === 'balanced' && '⚖️ Balanced'}
                                {rewrite.version === 'strict' && '⚡ Strict'}
                                {rewrite.version === 'lenient' && '🌱 Lenient'}
                            </button>
                        ))}
                    </div>
                    
                    {rewrites.map((rewrite, idx) => (
                        activeRewrite === rewrite.version && (
                            <div key={idx} style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-light)'
                            }}>
                                <div style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '8px' }}>
                                    {rewrite.text}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    <strong>Changes:</strong> {rewrite.changes_made?.join(', ') || 'Improved language and metrics'}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    <strong>Best for:</strong> {rewrite.target_roles?.join(', ') || 'General applications'}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(rewrite.text)}
                                    style={{
                                        marginTop: '8px',
                                        padding: '4px 10px',
                                        background: 'transparent',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📋 Copy
                                </button>
                            </div>
                        )
                    ))}
                </div>
            )}
            
            {/* Overall Assessment */}
            {summaryAnalysis.overall_assessment && (
                <div style={{
                    marginTop: '16px',
                    padding: '10px',
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    borderLeft: '3px solid var(--accent-blue)'
                }}>
                    💡 <strong>Veritas Tip:</strong> {summaryAnalysis.overall_assessment}
                </div>
            )}
        </div>
    );
}