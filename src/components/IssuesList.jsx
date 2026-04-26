import React from 'react';
import { Icons } from '../assets/icons.jsx';

export default function IssuesList({ grammar_issues, missing_tools, weak_metrics_details, suggested_rewrites }) {
    return (
        <>
            {grammar_issues?.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>📝 Grammar & Spelling Issues</h3>
                        {grammar_issues.map((issue, idx) => (
                            <div key={idx} className="grammar-item">
                                <div className="error-type" style={{ 
                                    color: issue.error_type === 'spelling' ? 'var(--accent-rose)' : 
                                           issue.error_type === 'grammar' ? 'var(--accent-amber)' : 'var(--accent-blue)' 
                                }}>
                                    {(issue.error_type || 'grammar').toUpperCase()}
                                </div>
                                <div className="original">"{issue.original_text}"</div>
                                <div style={{ fontSize: '12px', marginTop: '5px' }}>❌ {issue.issue}</div>
                                <div className="suggestion">✅ {issue.suggestion}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {missing_tools?.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>🔧 Missing Tools Detected</h3>
                        {missing_tools.map((tool, idx) => (
                            <div key={idx} className="missing-tool-item">
                                <strong>{tool.tool_name}</strong> <span style={{ color: 'var(--text-muted)' }}>({tool.category})</span>
                                <div className="flag-suggestion">💡 {tool.suggestion}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {weak_metrics_details?.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>📊 Weak Metrics - Need Improvement</h3>
                        {weak_metrics_details.map((metric, idx) => (
                            <div key={idx} className="weak-metric-item" style={{ borderLeftColor: 'var(--accent-rose)' }}>
                                <div className="original">"{metric.bullet_text}"</div>
                                <div style={{ fontSize: '12px', marginTop: '5px' }}>❌ {metric.reason}</div>
                                <div className="suggestion">✅ {metric.fix}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {suggested_rewrites?.length > 0 && (
                <div className="v8-section">
                    <div className="results-section">
                        <h3>✏️ Suggested Rewrites</h3>
                        {suggested_rewrites.map((rewrite, idx) => (
                            <div key={idx} className="rewrite-item">
                                <div><strong>Original:</strong> "{rewrite.original}"</div>
                                <div style={{ marginTop: '8px' }}>❌ {rewrite.issue}</div>
                                <div style={{ marginTop: '8px', color: 'var(--accent-emerald)' }}><strong>Suggested:</strong> "{rewrite.suggested_rewrite}"</div>
                                <div style={{ marginTop: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>💡 {rewrite.reason}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}