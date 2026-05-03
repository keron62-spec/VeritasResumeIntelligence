import React from 'react';

export default function IssuesList({ grammar_issues, missing_tools, weak_metrics_details, suggested_rewrites }) {
    // Safety check - ensure we have arrays
    const safeGrammar = Array.isArray(grammar_issues) ? grammar_issues : [];
    const safeWeakMetrics = Array.isArray(weak_metrics_details) ? weak_metrics_details : [];
    const safeRewrites = Array.isArray(suggested_rewrites) ? suggested_rewrites : [];
    const safeTools = Array.isArray(missing_tools) ? missing_tools : [];

    return (
        <>
            {/* GRAMMAR ISSUES */}
            {safeGrammar.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>📝 Grammar & Spelling Issues ({safeGrammar.length})</h3>
                        {safeGrammar.map((issue, idx) => {
                            // CASE 1: String
                            if (typeof issue === 'string') {
                                return (
                                    <div key={idx} className="grammar-item">
                                        <div className="error-type" style={{ color: '#f59e0b' }}>ISSUE</div>
                                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>"{issue}"</div>
                                        <div className="suggestion">✅ Proofread and correct</div>
                                    </div>
                                );
                            }
                            // CASE 2: Object with original_text
                            if (issue.original_text) {
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
                            }
                            // CASE 3: Fallback
                            return (
                                <div key={idx} className="grammar-item">
                                    <div className="error-type">ISSUE</div>
                                    <div>{JSON.stringify(issue)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MISSING TOOLS */}
            {safeTools.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>🔧 Missing Tools Detected ({safeTools.length})</h3>
                        {safeTools.map((tool, idx) => (
                            <div key={idx} className="missing-tool-item">
                                <strong>{tool.tool_name || 'Unknown tool'}</strong>
                                {tool.category && <span style={{ color: 'var(--text-muted)' }}> ({tool.category})</span>}
                                <div className="flag-suggestion">💡 {tool.suggestion || 'Consider adding this tool to your skills section'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* WEAK METRICS */}
            {safeWeakMetrics.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>📊 Weak Metrics - Need Improvement ({safeWeakMetrics.length})</h3>
                        {safeWeakMetrics.map((metric, idx) => {
                            // CASE 1: String
                            if (typeof metric === 'string') {
                                // Determine severity based on content
                                const isCritical = metric.includes('100%') || metric.includes('unverifiable') || metric.includes('statistically improbable');
                                return (
                                    <div key={idx} className="weak-metric-item" style={{ borderLeftColor: isCritical ? '#ef4444' : '#f59e0b' }}>
                                        <div style={{ fontSize: '12px', marginTop: '5px' }}>❌ {metric}</div>
                                        <div className="suggestion" style={{ marginTop: '8px' }}>
                                            {isCritical ? 
                                                '✅ Provide verifiable context or reframe with realistic metrics' : 
                                                '✅ Add baseline comparison to validate this metric'}
                                        </div>
                                    </div>
                                );
                            }
                            // CASE 2: Object
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

            {/* SUGGESTED REWRITES */}
            {safeRewrites.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>✏️ Suggested Rewrites ({safeRewrites.length})</h3>
                        {safeRewrites.map((rewrite, idx) => {
                            // CASE 1: String
                            if (typeof rewrite === 'string') {
                                return (
                                    <div key={idx} className="rewrite-item">
                                        <div><strong>Review needed:</strong></div>
                                        <div style={{ marginTop: '8px', fontSize: '13px' }}>{rewrite}</div>
                                    </div>
                                );
                            }
                            // CASE 2: Object
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