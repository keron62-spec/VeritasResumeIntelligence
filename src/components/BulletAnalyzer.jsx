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
    
    const getScoreLabel = (score) => {
        if (score >= 85) return 'Strong';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Needs Work';
        return 'Weak';
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
                    <span>📊 Average Score: <strong>{bulletAnalysis.average_original_score || bulletAnalysis.average_score}</strong>/100</span>
                    <span>🔍 Bullets Assessed: <strong>{bulletAnalysis.bullets_assessed || 0}</strong></span>
                    {bulletAnalysis.average_transformed_score && (
                        <span style={{ color: '#10b981' }}>🚀 Potential Avg: <strong>{bulletAnalysis.average_transformed_score}</strong>/100 (+{bulletAnalysis.average_transformed_score - (bulletAnalysis.average_original_score || bulletAnalysis.average_score)})</span>
                    )}
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
    
    // Determine if we're in JD Comparison mode (has jd_context)
    const isJDComparison = isComparisonMode && bulletAnalysis.jd_context;
    
    // Get the appropriate score key
    const getScoreKey = (bullet) => {
        // Use transformed_score if available, otherwise original_score
        if (bullet.transformed_score && bullet.transformed_score !== bullet.original_score) {
            return { score: bullet.transformed_score, label: 'Optimized Score' };
        }
        return { score: bullet.original_score, label: 'Score' };
    };
    
    // Sort bullets by original score (weakest first)
    const sortedBullets = [...bulletAnalysis.bullets].sort((a, b) => a.original_score - b.original_score);
    
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
            
            {/* JD Context Panel (Comparison Mode Only) */}
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
            
            {/* Disclaimer (Comparison Mode Only) */}
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
                <span>📊 Average Original Score: <strong>{bulletAnalysis.average_original_score || bulletAnalysis.average_score}</strong>/100</span>
                {bulletAnalysis.average_transformed_score && (
                    <span style={{ color: '#10b981' }}>🚀 Average Optimized: <strong>{bulletAnalysis.average_transformed_score}</strong>/100 (+{Math.round(bulletAnalysis.average_transformed_score - (bulletAnalysis.average_original_score || bulletAnalysis.average_score))})</span>
                )}
                <span>🔍 Bullets Assessed: <strong>{bulletAnalysis.bullets_assessed}</strong></span>
            </div>
            
            {/* Bullet List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedBullets.map((bullet, idx) => {
                    const originalScore = bullet.original_score;
                    const transformedScore = bullet.transformed_score;
                    const hasTransformation = bullet.transformed_text && bullet.transformed_text !== bullet.original_text;
                    const improvementDelta = bullet.improvement_delta || (transformedScore - originalScore);
                    const scoreColor = getScoreColor(hasTransformation ? transformedScore : originalScore);
                    const scoreLabel = getScoreLabel(hasTransformation ? transformedScore : originalScore);
                    
                    return (
                        <div key={bullet.id} style={{
                            border: `1px solid ${scoreColor}`,
                            borderRadius: '8px',
                            padding: '12px',
                            backgroundColor: originalScore < 50 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-tertiary)'
                        }}>
                            {/* Header with Score */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {bullet.id}
                                </div>
                                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                    <div style={{ fontSize: '24px', fontWeight: '600', color: scoreColor }}>
                                        {hasTransformation ? transformedScore : originalScore}
                                    </div>
                                    <div style={{ fontSize: '10px', color: scoreColor }}>
                                        {scoreLabel}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Original Bullet Text */}
                            <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                {bullet.original_text}
                            </div>
                            
                            {/* Keywords Found/Missing (Comparison Mode) */}
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
                            
                            {/* Score Comparison (if transformed) */}
                            {hasTransformation && originalScore !== transformedScore && (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '12px', 
                                    marginBottom: '10px',
                                    padding: '6px 0',
                                    fontSize: '11px'
                                }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Original Score: <strong style={{ color: getScoreColor(originalScore) }}>{originalScore}</strong></span>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                    <span style={{ color: 'var(--text-muted)' }}>Optimized Score: <strong style={{ color: getScoreColor(transformedScore) }}>{transformedScore}</strong></span>
                                    {improvementDelta > 0 && (
                                        <span style={{ color: '#10b981' }}>+{improvementDelta} points</span>
                                    )}
                                </div>
                            )}
                            
                            {/* JD-TARGETED TRANSFORMATION SECTION - Shows for ALL bullets with transformed_text */}
                            {hasTransformation && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #10b981'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                        <strong style={{ fontSize: '12px' }}>
                                            {isJDComparison ? '✏️ JD-Optimized Version' : '✏️ Suggested Rewrite'}
                                        </strong>
                                        {improvementDelta !== undefined && improvementDelta !== 0 && (
                                            <span style={{ 
                                                fontSize: '11px', 
                                                color: improvementDelta > 0 ? '#10b981' : '#ef4444',
                                                fontWeight: '600'
                                            }}>
                                                {improvementDelta > 0 ? `+${improvementDelta}` : improvementDelta} point improvement
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Transformed Bullet Text */}
                                    <div style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '10px', fontWeight: '500' }}>
                                        {bullet.transformed_text}
                                    </div>
                                    
                                    {/* Changes Made */}
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
                                    
                                    {/* Copy Button */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                                                AI Confidence: {Math.round(bullet.confidence * 100)}%
                                            </span>
                                        )}
                                        {bullet.preserves_truth && (
                                            <span style={{ fontSize: '9px', color: '#10b981', alignSelf: 'center' }}>
                                                ✓ Preserves original truth
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Legacy Suggested Rewrite (Fallback) */}
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
                                            AI Confidence: {Math.round(bullet.confidence * 100)}%
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Score Breakdown (Expandable) */}
                            <details style={{ marginTop: '8px' }}>
                                <summary style={{ fontSize: '10px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    Show score breakdown
                                </summary>
                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10px' }}>
                                    {bullet.scores && Object.entries(bullet.scores).map(([key, value]) => {
                                        let max = 25;
                                        if (key === 'keyword_match') max = 35;
                                        else if (key === 'verb_alignment') max = 20;
                                        else if (key === 'outcome_relevance') max = 20;
                                        else if (key === 'level_match') max = 15;
                                        else if (key === 'industry_match') max = 10;
                                        
                                        return (
                                            <div key={key} style={{ 
                                                backgroundColor: 'var(--bg-secondary)', 
                                                padding: '2px 6px', 
                                                borderRadius: '4px' 
                                            }}>
                                                {key.replace(/_/g, ' ')}: {value}/{max}
                                            </div>
                                        );
                                    })}
                                    {!bullet.scores && (
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            Score details not available
                                        </div>
                                    )}
                                </div>
                            </details>
                        </div>
                    );
                })}
            </div>
            
            {/* Weakest First Note */}
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