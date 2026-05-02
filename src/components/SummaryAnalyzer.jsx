import React, { useState } from 'react';

export default function SummaryAnalyzer({ summaryAnalysis }) {
    const [activeRewrite, setActiveRewrite] = useState('balanced');
    const [copied, setCopied] = useState(false);
    
    // Debug log to confirm component is receiving data
    console.log('SummaryAnalyzer received:', summaryAnalysis);
    
    // If no summary exists or data is missing, don't render
    if (!summaryAnalysis || !summaryAnalysis.exists) {
        console.log('No summary analysis data available');
        return null;
    }
    
    const scores = summaryAnalysis.scores || {};
    const rewrites = summaryAnalysis.rewrites || [];
    const overallAssessment = summaryAnalysis.overall_assessment || '';
    const originalText = summaryAnalysis.original_text || '';
    
    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const activeRewriteData = rewrites.find(r => r.version === activeRewrite) || rewrites[0];
    
    return (
        <div style={{
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
                <div style={{ fontSize: '13px', lineHeight: '1.5' }}>{originalText}</div>
            </div>
            
            {/* Score Grid - Simple version that definitely works */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Semantic Position</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor((scores.semantic_positioning || 0) * 20 + 50) }}>
                        {scores.semantic_positioning > 0 ? '+' : ''}{scores.semantic_positioning || 0}
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Bloom Level</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor((scores.bloom_level || 0) * 20) }}>
                        {scores.bloom_level || 0}
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RIASEC</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>{scores.riasec_signal || 'N/A'}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Credibility</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(scores.credibility || 0) }}>
                        {scores.credibility || 0}%
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Keywords</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(scores.keyword_density || 0) }}>
                        {scores.keyword_density || 0}%
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Action Verbs</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(scores.action_verb_strength || 0) }}>
                        {scores.action_verb_strength || 0}%
                    </div>
                </div>
            </div>
            
            {/* Rewrite Options */}
            {rewrites.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>✏️ Suggested Rewrites</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {rewrites.map((rewrite, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveRewrite(rewrite.version)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: `1px solid ${activeRewrite === rewrite.version ? '#2563eb' : 'var(--border-light)'}`,
                                    background: activeRewrite === rewrite.version ? '#2563eb' : 'transparent',
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
                    
                    {activeRewriteData && (
                        <div style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)'
                        }}>
                            <div style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '8px' }}>
                                {activeRewriteData.text}
                            </div>
                            {activeRewriteData.changes_made && activeRewriteData.changes_made.length > 0 && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                    <strong>Changes:</strong> {activeRewriteData.changes_made.join(', ')}
                                </div>
                            )}
                            {activeRewriteData.target_roles && activeRewriteData.target_roles.length > 0 && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    <strong>Best for:</strong> {activeRewriteData.target_roles.join(', ')}
                                </div>
                            )}
                            <button
                                onClick={() => copyToClipboard(activeRewriteData.text)}
                                style={{
                                    padding: '4px 10px',
                                    background: 'transparent',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    color: copied ? '#10b981' : 'var(--text-secondary)'
                                }}
                            >
                                {copied ? '✓ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Overall Assessment */}
            {overallAssessment && (
                <div style={{
                    padding: '10px',
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    borderLeft: '3px solid #2563eb'
                }}>
                    💡 <strong>Veritas Tip:</strong> {overallAssessment}
                </div>
            )}
        </div>
    );
}