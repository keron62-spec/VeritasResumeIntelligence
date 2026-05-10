import React, { useState } from 'react';

export default function SummaryAnalyzer({ summaryAnalysis }) {
    const [activeRewrite, setActiveRewrite] = useState('balanced');
    const [activeSummaryVersion, setActiveSummaryVersion] = useState('veritas'); // 'original', 'veritas', 'hidden_brief'
    const [copied, setCopied] = useState(false);
    const [copiedHb, setCopiedHb] = useState(false);
    
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
    const veritasTransformedText = summaryAnalysis.veritas_transformed_summary || null;
    const hbTransformedText = summaryAnalysis.hb_transformed_summary || null;
    const hasHiddenBrief = !!hbTransformedText;
    
    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };
    
    const getSemanticLabel = (score) => {
        if (score < -2) return 'Under-positioned';
        if (score <= 2) return 'Perfectly positioned';
        return 'Over-positioned';
    };
    
    const getBloomLabel = (level) => {
        if (level >= 5.5) return 'Strategic/Creative';
        if (level >= 4) return 'Analytical/Evaluative';
        if (level >= 2.5) return 'Applicative';
        return 'Basic/Foundational';
    };
    
    const getRiasecLabel = (code) => {
        const labels = {
            R: 'Realistic (Hands-on, practical)',
            I: 'Investigative (Analytical, research)',
            A: 'Artistic (Creative, design)',
            S: 'Social (Helping, teaching)',
            E: 'Enterprising (Leading, persuading)',
            C: 'Conventional (Organized, process-driven)'
        };
        return labels[code] || 'Mixed';
    };
    
    const copyToClipboard = (text, version) => {
        navigator.clipboard.writeText(text);
        if (version === 'hidden_brief') {
            setCopiedHb(true);
            setTimeout(() => setCopiedHb(false), 2000);
        } else {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const activeRewriteData = rewrites.find(r => r.version === activeRewrite) || rewrites[0];
    
    // Get the currently displayed summary text based on active version
    const getCurrentSummaryText = () => {
        switch(activeSummaryVersion) {
            case 'veritas':
                return veritasTransformedText || originalText;
            case 'hidden_brief':
                return hbTransformedText || originalText;
            default:
                return originalText;
        }
    };
    
    const getCurrentSummaryLabel = () => {
        switch(activeSummaryVersion) {
            case 'veritas':
                return 'Veritas Optimized';
            case 'hidden_brief':
                return 'Hidden Brief Version';
            default:
                return 'Original Summary';
        }
    };
    
    const getCurrentSummaryIcon = () => {
        switch(activeSummaryVersion) {
            case 'veritas':
                return '✨';
            case 'hidden_brief':
                return '🕵️';
            default:
                return '📄';
        }
    };
    
    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-light)'
        }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>📝</span> Summary Analyzer
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    AI-powered analysis of your professional summary
                </span>
                {hasHiddenBrief && (
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(198, 164, 63, 0.15)',
                        borderRadius: '12px',
                        color: '#c9a84c'
                    }}>
                        🕵️ Hidden Brief available
                    </span>
                )}
            </h3>
            
            {/* Summary Version Selector - NEW for Hidden Brief */}
            {(veritasTransformedText || hbTransformedText) && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                    padding: '10px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>
                        View summary version:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setActiveSummaryVersion('original')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: `1px solid ${activeSummaryVersion === 'original' ? '#10b981' : 'var(--border-light)'}`,
                                background: activeSummaryVersion === 'original' ? '#10b981' : 'transparent',
                                color: activeSummaryVersion === 'original' ? 'white' : 'var(--text-secondary)',
                                fontSize: '11px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span>📄</span> Original
                        </button>
                        {veritasTransformedText && (
                            <button
                                onClick={() => setActiveSummaryVersion('veritas')}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: `1px solid ${activeSummaryVersion === 'veritas' ? '#2563eb' : 'var(--border-light)'}`,
                                    background: activeSummaryVersion === 'veritas' ? '#2563eb' : 'transparent',
                                    color: activeSummaryVersion === 'veritas' ? 'white' : 'var(--text-secondary)',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>✨</span> Veritas Optimized
                            </button>
                        )}
                        {hbTransformedText && (
                            <button
                                onClick={() => setActiveSummaryVersion('hidden_brief')}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: `1px solid ${activeSummaryVersion === 'hidden_brief' ? '#c9a84c' : 'var(--border-light)'}`,
                                    background: activeSummaryVersion === 'hidden_brief' ? '#c9a84c' : 'transparent',
                                    color: activeSummaryVersion === 'hidden_brief' ? '#1a1f2e' : 'var(--text-secondary)',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>🕵️</span> Hidden Brief
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            {/* Current Summary Display - Dynamic based on selected version */}
            <div style={{
                backgroundColor: activeSummaryVersion === 'hidden_brief' 
                    ? 'rgba(198, 164, 63, 0.08)' 
                    : activeSummaryVersion === 'veritas' 
                        ? 'rgba(37, 99, 235, 0.05)' 
                        : 'var(--bg-tertiary)',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: activeSummaryVersion === 'hidden_brief' 
                    ? '1px solid rgba(198, 164, 63, 0.3)' 
                    : '1px solid var(--border-light)'
            }}>
                <div style={{ 
                    fontSize: '11px', 
                    color: activeSummaryVersion === 'hidden_brief' ? '#c9a84c' : 'var(--text-muted)', 
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                }}>
                    <span>
                        {getCurrentSummaryIcon()} {getCurrentSummaryLabel()}
                    </span>
                    {activeSummaryVersion !== 'original' && (
                        <button
                            onClick={() => copyToClipboard(getCurrentSummaryText(), activeSummaryVersion === 'hidden_brief' ? 'hidden_brief' : 'veritas')}
                            style={{
                                padding: '2px 8px',
                                background: 'transparent',
                                border: '1px solid var(--border-light)',
                                borderRadius: '4px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                color: activeSummaryVersion === 'hidden_brief' ? '#c9a84c' : 'var(--text-secondary)'
                            }}
                        >
                            {activeSummaryVersion === 'hidden_brief' 
                                ? (copiedHb ? '✓ Copied!' : '📋 Copy') 
                                : (copied ? '✓ Copied!' : '📋 Copy')}
                        </button>
                    )}
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {getCurrentSummaryText()}
                </div>
            </div>
            
            {/* Score Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px',
                marginBottom: '16px'
            }}>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Semantic</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: getScoreColor((scores.semantic_positioning || 0) * 20 + 50) }}>
                        {scores.semantic_positioning > 0 ? '+' : ''}{scores.semantic_positioning || 0}
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{getSemanticLabel(scores.semantic_positioning)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Bloom</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: getScoreColor((scores.bloom_level || 0) * 20) }}>
                        {scores.bloom_level || 0}
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{getBloomLabel(scores.bloom_level)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>RIASEC</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>{scores.riasec_signal || 'N/A'}</div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{getRiasecLabel(scores.riasec_signal)}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Credibility</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: getScoreColor(scores.credibility || 0) }}>
                        {scores.credibility || 0}%
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Keywords</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: getScoreColor(scores.keyword_density || 0) }}>
                        {scores.keyword_density || 0}%
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Action Verbs</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: getScoreColor(scores.action_verb_strength || 0) }}>
                        {scores.action_verb_strength || 0}%
                    </div>
                </div>
            </div>
            
            {/* Hidden Brief Insight Note - NEW for Hidden Brief */}
            {hasHiddenBrief && (
                <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: 'rgba(198, 164, 63, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #c9a84c'
                }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#c9a84c', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🕵️</span> Hidden Brief Intelligence Applied
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        This version frames your summary to address the JD's hidden problems, cultural signals, 
                        and unstated requirements. It uses language that signals you understand the role's 
                        deeper challenges.
                    </p>
                </div>
            )}
            
            {/* What Was Improved Section - for active rewrite */}
            {activeRewriteData && activeRewriteData.changes_made && activeRewriteData.changes_made.length > 0 && (
                <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #10b981'
                }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✨</span> What Was Improved
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {activeRewriteData.changes_made.map((change, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{change}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Hidden Brief Specific Changes - NEW for Hidden Brief */}
            {activeSummaryVersion === 'hidden_brief' && summaryAnalysis.hb_changes_made && summaryAnalysis.hb_changes_made.length > 0 && (
                <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: 'rgba(198, 164, 63, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #c9a84c'
                }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#c9a84c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🕵️</span> Hidden Brief Changes
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {summaryAnalysis.hb_changes_made.map((change, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>{change}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Rewrite Options */}
            {rewrites.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>✏️ Suggested Rewrites (Veritas)</div>
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
                            {activeRewriteData.target_roles && activeRewriteData.target_roles.length > 0 && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    <strong>Best for:</strong> {activeRewriteData.target_roles.join(', ')}
                                </div>
                            )}
                            <button
                                onClick={() => copyToClipboard(activeRewriteData.text, 'veritas')}
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
            
            {/* Hidden Brief Recommendation - NEW for Hidden Brief */}
            {hasHiddenBrief && summaryAnalysis.hb_recommendation && (
                <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    backgroundColor: 'rgba(198, 164, 63, 0.08)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    borderLeft: '3px solid #c9a84c'
                }}>
                    🕵️ <strong>Hidden Brief Recommendation:</strong> {summaryAnalysis.hb_recommendation}
                </div>
            )}
        </div>
    );
}