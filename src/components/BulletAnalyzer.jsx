import React, { useState } from 'react';

export default function BulletAnalyzer({ bulletAnalysis, isComparisonMode }) {
    const [expandedBullet, setExpandedBullet] = useState(null);
    const [copiedBulletId, setCopiedBulletId] = useState(null);
    
    // Check if bulletAnalysis exists and has data
    if (!bulletAnalysis) {
        return null;
    }
    
    const copyToClipboard = (text, bulletId) => {
        navigator.clipboard.writeText(text);
        setCopiedBulletId(bulletId);
        setTimeout(() => setCopiedBulletId(null), 2000);
    };
    
    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#86efac';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };
    
    const getScoreLabel = (score, mode) => {
        if (mode === 'jd') {
            if (score >= 80) return 'Strong Match';
            if (score >= 60) return 'Moderate Match';
            if (score >= 40) return 'Weak Match';
            return 'Poor Match';
        } else {
            if (score >= 85) return 'Strong';
            if (score >= 70) return 'Good';
            if (score >= 50) return 'Needs Work';
            return 'Weak';
        }
    };
    
    const getSentimentBadge = (sentimentLabel) => {
        const colors = {
            'Highly Confident': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
            'Confident': { bg: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' },
            'Neutral': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
            'Passive': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
            'Negative/Avoidant': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
        };
        return colors[sentimentLabel] || colors['Neutral'];
    };
    
    // Handle case where bullets array is empty but we have summary
    if (!bulletAnalysis.bullets || bulletAnalysis.bullets.length === 0) {
        return (
            <div className="bullet-analyzer" style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid var(--border-light)'
            }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>🎯</span> 
                    {isComparisonMode ? 'JD Alignment Analysis' : 'Bullet Point Analysis'}
                    <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                        {bulletAnalysis.bullets_assessed || 0} bullets assessed
                    </span>
                </h3>
                
                <div style={{ 
                    marginBottom: '16px', 
                    display: 'flex', 
                    gap: '16px', 
                    fontSize: '12px',
                    flexWrap: 'wrap',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-light)'
                }}>
                    <span>📊 Average {isComparisonMode ? 'JD Alignment' : 'Score'}: <strong>{bulletAnalysis.average_jd_alignment || bulletAnalysis.average_score}</strong>/100</span>
                    <span>🔍 Bullets Assessed: <strong>{bulletAnalysis.bullets_assessed || 0}</strong></span>
                </div>
                
                <div style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderLeft: '3px solid #f59e0b',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px'
                }}>
                    <p style={{ margin: 0, fontSize: '13px' }}>
                        {bulletAnalysis.summary || 'Bullet analysis completed.'}
                    </p>
                </div>
                
                {bulletAnalysis.overall_disclaimer && (
                    <div style={{
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--text-muted)'
                    }}>
                        {bulletAnalysis.overall_disclaimer}
                    </div>
                )}
            </div>
        );
    }
    
    // Regular rendering when bullets array has data
    const isJDComparison = isComparisonMode && bulletAnalysis.jd_context;
    const scoreKey = isJDComparison ? 'jd_alignment_score' : 'score';
    const sortedBullets = [...bulletAnalysis.bullets].sort((a, b) => a[scoreKey] - b[scoreKey]);
    
    return (
        <div className="bullet-analyzer" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-light)'
        }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>🎯</span> 
                {isJDComparison ? 'JD Alignment Analysis' : 'Bullet Point Analysis'}
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    {bulletAnalysis.summary}
                </span>
            </h3>
            
            {/* JD Context Panel */}
            {isJDComparison && bulletAnalysis.jd_context && (
                <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                        📋 Role Context: {bulletAnalysis.jd_context.role_title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <strong>Critical Keywords:</strong> {bulletAnalysis.jd_context.critical_keywords?.slice(0, 8).join(', ')}
                        {bulletAnalysis.jd_context.critical_keywords?.length > 8 && '...'}
                    </div>
                    {bulletAnalysis.jd_context.required_seniority && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <strong>Target Seniority:</strong> {bulletAnalysis.jd_context.required_seniority}
                        </div>
                    )}
                </div>
            )}
            
            {/* Disclaimer */}
            {isJDComparison && bulletAnalysis.overall_disclaimer && (
                <div style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderLeft: '3px solid #f59e0b',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span>⚠️</span>
                        <strong>JD Alignment Suggestions</strong>
                    </div>
                    <p style={{ margin: 0 }}>{bulletAnalysis.overall_disclaimer}</p>
                </div>
            )}
            
            {/* Stats Summary */}
            <div style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                gap: '16px', 
                fontSize: '12px',
                flexWrap: 'wrap',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)'
            }}>
                <span>📊 Average {isJDComparison ? 'JD Alignment' : 'Score'}: <strong>{bulletAnalysis.average_jd_alignment || bulletAnalysis.average_score}</strong>/100</span>
                <span>🔍 Bullets Assessed: <strong>{bulletAnalysis.bullets_assessed}</strong></span>
                {!isJDComparison && (
                    <>
                        <span style={{ color: '#10b981' }}>✅ Strong: {bulletAnalysis.bullets?.filter(b => b.score >= 85).length}</span>
                        <span style={{ color: '#f59e0b' }}>📝 Needs Work: {bulletAnalysis.bullets?.filter(b => b.score >= 50 && b.score < 70).length}</span>
                        <span style={{ color: '#ef4444' }}>⚠️ Weak: {bulletAnalysis.bullets?.filter(b => b.score < 50).length}</span>
                    </>
                )}
                {isJDComparison && (
                    <>
                        <span style={{ color: '#10b981' }}>✅ Strong Match: {bulletAnalysis.bullets?.filter(b => b.jd_alignment_score >= 80).length}</span>
                        <span style={{ color: '#f59e0b' }}>📝 Moderate: {bulletAnalysis.bullets?.filter(b => b.jd_alignment_score >= 60 && b.jd_alignment_score < 80).length}</span>
                        <span style={{ color: '#ef4444' }}>⚠️ Poor Match: {bulletAnalysis.bullets?.filter(b => b.jd_alignment_score < 60).length}</span>
                    </>
                )}
                {isJDComparison && bulletAnalysis.average_transformed_score && (
                    <span style={{ color: '#10b981' }}>🚀 Potential Avg: <strong>{bulletAnalysis.average_transformed_score}</strong>/100 (+{bulletAnalysis.average_transformed_score - bulletAnalysis.average_jd_alignment})</span>
                )}
            </div>
            
            {/* Bullet List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedBullets.map((bullet, idx) => {
                    const score = isJDComparison ? bullet.jd_alignment_score : bullet.score;
                    const scoreColor = getScoreColor(score);
                    const scoreLabel = getScoreLabel(score, isJDComparison ? 'jd' : 'standard');
                    const isPoorMatch = isJDComparison && score < 60;
                    const isWeak = !isJDComparison && score < 50;
                    
                    const hasTransformation = isJDComparison && bullet.transformed_text && bullet.transformed_text !== bullet.original_text;
                    const improvementDelta = bullet.improvement_delta || (bullet.transformed_score - bullet.original_score);
                    
                    return (
                        <div key={bullet.id} style={{
                            border: `1px solid ${scoreColor}`,
                            borderRadius: '8px',
                            padding: '12px',
                            backgroundColor: isPoorMatch || isWeak ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-tertiary)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '8px' }}>
                                        {bullet.original_text || bullet.text}
                                    </div>
                                    
                                    {isJDComparison && bullet.jd_keywords_found && (
                                        <div style={{ marginBottom: '6px' }}>
                                            {bullet.jd_keywords_found.length > 0 && (
                                                <span style={{ fontSize: '10px', color: '#10b981', marginRight: '12px' }}>
                                                    ✅ Found: {bullet.jd_keywords_found.join(', ')}
                                                </span>
                                            )}
                                            {bullet.jd_keywords_missing && bullet.jd_keywords_missing.length > 0 && (
                                                <span style={{ fontSize: '10px', color: '#ef4444' }}>
                                                    ❌ Missing: {bullet.jd_keywords_missing.slice(0, 3).join(', ')}
                                                    {bullet.jd_keywords_missing.length > 3 && '...'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    
                                    {!isJDComparison && bullet.patterns_detected && bullet.patterns_detected.length > 0 && (
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            {bullet.patterns_detected.slice(0, 3).map((pattern, i) => (
                                                <span key={i} style={{
                                                    fontSize: '9px',
                                                    padding: '2px 6px',
                                                    borderRadius: '12px',
                                                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                                    color: '#2563eb'
                                                }}>
                                                    {pattern.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                    <div style={{ fontSize: '28px', fontWeight: '600', color: scoreColor }}>
                                        {score}
                                    </div>
                                    <div style={{ fontSize: '10px', color: scoreColor }}>
                                        {scoreLabel}
                                    </div>
                                </div>
                            </div>
                            
                            {!isJDComparison && bullet.sentiment_label && (
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                                    <div style={{ fontSize: '10px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Sentiment: </span>
                                        <span style={{ 
                                            backgroundColor: getSentimentBadge(bullet.sentiment_label).bg,
                                            color: getSentimentBadge(bullet.sentiment_label).color,
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            {bullet.sentiment_label}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '10px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Credibility: </span>
                                        <span style={{ color: bullet.credibility_score >= 70 ? '#10b981' : bullet.credibility_score >= 50 ? '#f59e0b' : '#ef4444' }}>
                                            {bullet.credibility_label}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* JD-TARGETED TRANSFORMATION SECTION */}
                            {isJDComparison && hasTransformation && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #10b981'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                        <strong style={{ fontSize: '12px' }}>✏️ JD-Optimized Version</strong>
                                        {improvementDelta !== undefined && improvementDelta !== 0 && (
                                            <span style={{ 
                                                fontSize: '11px', 
                                                color: improvementDelta > 0 ? '#10b981' : '#ef4444',
                                                fontWeight: '600'
                                            }}>
                                                {improvementDelta > 0 ? `+${improvementDelta}` : improvementDelta} points improvement
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '10px', fontWeight: '500' }}>
                                        {bullet.transformed_text}
                                    </div>
                                    
                                    {bullet.changes_made && bullet.changes_made.length > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                                What changed:
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                {bullet.changes_made.slice(0, 4).map((change, i) => (
                                                    <li key={i} style={{ marginBottom: '2px' }}>{change}</li>
                                                ))}
                                                {bullet.changes_made.length > 4 && (
                                                    <li style={{ color: 'var(--text-muted)' }}>+{bullet.changes_made.length - 4} more improvements</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {bullet.transformed_score && bullet.original_score && (
                                        <div style={{ 
                                            display: 'flex', 
                                            gap: '16px', 
                                            marginBottom: '10px',
                                            padding: '6px 0',
                                            borderTop: '1px dashed rgba(16, 185, 129, 0.3)',
                                            borderBottom: '1px dashed rgba(16, 185, 129, 0.3)'
                                        }}>
                                            <div style={{ fontSize: '10px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Original Score:</span>{' '}
                                                <span style={{ color: getScoreColor(bullet.original_score), fontWeight: '600' }}>{bullet.original_score}</span>
                                            </div>
                                            <div style={{ fontSize: '10px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>→</span>
                                            </div>
                                            <div style={{ fontSize: '10px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Optimized Score:</span>{' '}
                                                <span style={{ color: getScoreColor(bullet.transformed_score), fontWeight: '600' }}>{bullet.transformed_score}</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => copyToClipboard(bullet.transformed_text, bullet.id)}
                                            style={{
                                                padding: '4px 10px',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {copiedBulletId === bullet.id ? '✓ Copied!' : '📋 Copy to Clipboard'}
                                        </button>
                                        {bullet.confidence && (
                                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                                AI Confidence: {bullet.confidence}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {!hasTransformation && bullet.suggested_rewrite && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '10px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    borderLeft: '3px solid #10b981'
                                }}>
                                    <strong>✏️ Suggested Rewrite:</strong>
                                    <div style={{ marginTop: '4px' }}>{bullet.suggested_rewrite}</div>
                                    {bullet.confidence && (
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            AI Confidence: {bullet.confidence}%
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <details style={{ marginTop: '8px' }}>
                                <summary style={{ fontSize: '10px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    Show score breakdown
                                </summary>
                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10px' }}>
                                    {Object.entries(bullet.scores || {}).map(([key, value]) => (
                                        <div key={key} style={{ 
                                            backgroundColor: 'var(--bg-secondary)', 
                                            padding: '2px 6px', 
                                            borderRadius: '4px' 
                                        }}>
                                            {key.replace(/_/g, ' ')}: {value}/{key === 'keyword_match' ? 35 : key === 'verb_alignment' ? 20 : key === 'outcome_relevance' ? 20 : key === 'level_match' ? 15 : key === 'industry_match' ? 10 : 25}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>
                    );
                })}
            </div>
            
            {bulletAnalysis.weakest_first && bulletAnalysis.weakest_first.length > 0 && (
                <div style={{
                    marginTop: '16px',
                    padding: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                }}>
                    💡 Weakest bullets shown first. Focus on improving the ones at the top.
                </div>
            )}
        </div>
    );
}