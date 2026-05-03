import React from 'react';

export default function IssuesList({ grammar_issues, missing_tools, weak_metrics_details, suggested_rewrites }) {
    return (
        <>
            {/* GRAMMAR ISSUES - Handles both strings and objects */}
            {grammar_issues?.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>📝 Grammar & Spelling Issues</h3>
                        {grammar_issues.map((issue, idx) => {
                            // Handle string format (from fallback or simplified response)
                            if (typeof issue === 'string') {
                                return (
                                    <div key={idx} className="grammar-item">
                                        <div className="error-type" style={{ color: '#f59e0b' }}>ISSUE</div>
                                        <div className="original">"{issue}"</div>
                                        <div style={{ fontSize: '12px', marginTop: '5px' }}>❌ Grammar or spelling issue detected</div>
                                        <div className="suggestion">✅ Review and correct</div>
                                    </div>
                                );
                            }
                            // Handle object format (standard)
                            return (
                                <div key={idx} className="grammar-item">
                                    <div className="error-type" style={{ 
                                        color: issue.error_type === 'spelling' ? '#ef4444' : 
                                               issue.error_type === 'grammar' ? '#f59e0b' : '#3b82f6' 
                                    }}>
                                        {(issue.error_type || 'grammar').toUpperCase()}
                                    </div>
                                    <div className="original">"{issue.original_text}"</div>
                                    <div style={{ fontSize: '12px', marginTop: '5px' }}>❌ {issue.issue}</div>
                                    <div className="suggestion">✅ {issue.suggestion}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MISSING TOOLS - Already object format, keep as is */}
            {missing_tools?.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>🔧 Missing Tools Detected</h3>
                        {missing_tools.map((tool, idx) => (
                            <div key={idx} className="missing-tool-item">
                                <strong>{tool.tool_name}</strong> 
                                {tool.category && <span style={{ color: 'var(--text-muted)' }}> ({tool.category})</span>}
                                {tool.similarity_score && (
                                    <span style={{ 
                                        fontSize: '10px', 
                                        marginLeft: '8px',
                                        padding: '2px 6px',
                                        borderRadius: '12px',
                                        backgroundColor: tool.similarity_score >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: tool.similarity_score >= 80 ? '#10b981' : '#f59e0b'
                                    }}>
                                        {tool.similarity_score}% match
                                    </span>
                                )}
                                {tool.explanation && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {tool.explanation}
                                    </div>
                                )}
                                <div className="flag-suggestion">💡 {tool.suggestion}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* WEAK METRICS - Handles both strings and objects */}
            {weak_metrics_details?.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>📊 Weak Metrics - Need Improvement</h3>
                        {weak_metrics_details.map((metric, idx) => {
                            // Handle string format (from fallback or simplified response)
                            if (typeof metric === 'string') {
                                // Try to extract meaningful info from the string
                                let displayText = metric;
                                let isExtremeClaim = metric.includes('100%') || metric.includes('unverifiable') || metric.includes('statistically improbable');
                                return (
                                    <div key={idx} className="weak-metric-item" style={{ borderLeftColor: isExtremeClaim ? '#ef4444' : '#f59e0b' }}>
                                        <div className="original">Issue detected</div>
                                        <div style={{ fontSize: '12px', marginTop: '5px' }}>
                                            ❌ {displayText}
                                        </div>
                                        <div className="suggestion">
                                            {isExtremeClaim ? 
                                                '✅ Provide verifiable context or reframe with more realistic metrics' : 
                                                '✅ Add baseline comparison or specific context to validate this metric'}
                                        </div>
                                    </div>
                                );
                            }
                            // Handle object format (standard)
                            return (
                                <div key={idx} className="weak-metric-item" style={{ borderLeftColor: '#ef4444' }}>
                                    <div className="original">"{metric.bullet_text}"</div>
                                    <div style={{ fontSize: '12px', marginTop: '5px' }}>❌ {metric.reason}</div>
                                    <div className="suggestion">✅ {metric.fix}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SUGGESTED REWRITES - Handles both strings and objects */}
            {suggested_rewrites?.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>✏️ Suggested Rewrites</h3>
                        {suggested_rewrites.map((rewrite, idx) => {
                            // Handle string format
                            if (typeof rewrite === 'string') {
                                return (
                                    <div key={idx} className="rewrite-item">
                                        <div><strong>Review needed:</strong></div>
                                        <div style={{ marginTop: '8px' }}>❌ {rewrite}</div>
                                        <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>💡 Consider revising this bullet for better impact</div>
                                    </div>
                                );
                            }
                            // Handle object format
                            return (
                                <div key={idx} className="rewrite-item">
                                    <div><strong>Original:</strong> "{rewrite.original}"</div>
                                    <div style={{ marginTop: '8px' }}>❌ {rewrite.issue}</div>
                                    <div style={{ marginTop: '8px', color: '#10b981' }}><strong>Suggested:</strong> "{rewrite.suggested_rewrite}"</div>
                                    <div style={{ marginTop: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>💡 {rewrite.reason}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}