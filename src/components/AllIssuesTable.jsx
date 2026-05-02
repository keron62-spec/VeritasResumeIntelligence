import React from 'react';

export default function AllIssuesTable({ all_issues }) {
    if (!all_issues?.length) return null;

    // Pattern detection and badge mapping - matches actual issue text from your worker
    const getPatternBadge = (issueText) => {
        const text = issueText.toLowerCase();
        
        // Formatting & Style patterns
        if (text.includes('bullet style') || text.includes('inconsistent bullet') || text.includes('formatting')) {
            return { label: '📝 FORMATTING', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' };
        }
        if (text.includes('date format') || text.includes('date formatting')) {
            return { label: '📅 DATE FORMAT', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' };
        }
        if (text.includes('header') || text.includes('contact')) {
            return { label: '📋 HEADER ISSUE', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' };
        }
        
        // Verb & Language patterns
        if (text.includes('buzzword repetition') || text.includes('verb repetition') || text.includes('repetitive')) {
            return { label: '🔄 WORD REPETITION', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
        }
        if (text.includes('weak verb') || text.includes('passive')) {
            return { label: '⚡ WEAK VERB', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' };
        }
        if (text.includes('action verb')) {
            return { label: '⚡ ACTION VERB', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' };
        }
        
        // Metric & Quantification patterns
        if (text.includes('missing baseline')) {
            return { label: '📊 MISSING BASELINE', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
        }
        if (text.includes('missing context') || text.includes('missing scale')) {
            return { label: '📊 MISSING CONTEXT', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
        }
        if (text.includes('quantified') || text.includes('metric')) {
            return { label: '📊 QUANTIFICATION', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' };
        }
        if (text.includes('percentage')) {
            return { label: '📈 PERCENTAGE', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' };
        }
        if (text.includes('dollar') || text.includes('$') || text.includes('currency')) {
            return { label: '💰 CURRENCY', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
        }
        
        // Grammar & Spelling patterns
        if (text.includes('typo') || text.includes('spelling')) {
            return { label: '🔤 TYPO', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
        }
        if (text.includes('grammar') || text.includes('article') || text.includes('preposition')) {
            return { label: '📝 GRAMMAR', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
        }
        if (text.includes('punctuation')) {
            return { label: '🔤 PUNCTUATION', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
        }
        if (text.includes('capitalization')) {
            return { label: '🔠 CAPITALIZATION', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
        }
        
        // Keyword patterns
        if (text.includes('keyword')) {
            return { label: '🔍 KEYWORD', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' };
        }
        
        // Skills Section patterns
        if (text.includes('skills section')) {
            return { label: '🛠️ SKILLS SECTION', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' };
        }
        
        // Default for unmapped patterns
        return { label: '🔍 GENERAL', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
    };

    // Get priority badge color
    const getPriorityBadge = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'HIGH' };
            case 'medium':
                return { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'MEDIUM' };
            case 'low':
                return { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)', label: 'LOW' };
            default:
                return { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)', label: 'MEDIUM' };
        }
    };

    return (
        <div className="results-section" style={{ marginTop: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                📋 All Identified Issues ({all_issues.length})
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    • Prioritized by impact
                </span>
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
                <table className="issues-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>Priority</th>
                            <th style={{ width: '100px' }}>Category</th>
                            <th>Issue</th>
                            <th style={{ width: '120px' }}>Location</th>
                            <th style={{ width: '200px' }}>How to Fix</th>
                        </tr>
                    </thead>
                    <tbody>
                        {all_issues.slice(0, 20).map((issue, idx) => {
                            const pattern = getPatternBadge(issue.issue);
                            const priority = getPriorityBadge(issue.priority);
                            
                            return (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            backgroundColor: priority.bgColor,
                                            color: priority.color
                                        }}>
                                            {priority.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            backgroundColor: pattern.bgColor,
                                            color: pattern.color,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {pattern.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                            {issue.issue}
                                        </strong>
                                    </td>
                                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                            {issue.location || 'General'}
                                        </small>
                                    </td>
                                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {issue.fix || issue.suggestion || 'Review and improve'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {all_issues.length > 20 && (
                <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    +{all_issues.length - 20} more issues
                </p>
            )}
            
            {/* Pattern Legend - helps users understand the badges */}
            <details style={{ marginTop: '16px' }}>
                <summary style={{
                    fontSize: '11px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '8px'
                }}>
                    📖 Pattern Legend - What do these badges mean?
                </summary>
                <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '8px'
                }}>
                    <div><span style={{ color: '#64748b' }}>📝 FORMATTING</span> - Fix bullet style, dates, or headers</div>
                    <div><span style={{ color: '#f59e0b' }}>🔄 WORD REPETITION</span> - Vary your action verbs</div>
                    <div><span style={{ color: '#f97316' }}>⚡ WEAK VERB</span> - Use stronger action verbs</div>
                    <div><span style={{ color: '#ef4444' }}>📊 MISSING BASELINE</span> - Add starting point for metrics</div>
                    <div><span style={{ color: '#f59e0b' }}>📊 MISSING CONTEXT</span> - Add scale or comparison</div>
                    <div><span style={{ color: '#2563eb' }}>📊 QUANTIFICATION</span> - Add numbers, %, or $ values</div>
                    <div><span style={{ color: '#f59e0b' }}>💰 CURRENCY</span> - Fix dollar amount formatting</div>
                    <div><span style={{ color: '#ef4444' }}>🔤 TYPO</span> - Correct spelling errors</div>
                    <div><span style={{ color: '#8b5cf6' }}>📝 GRAMMAR</span> - Fix grammar issues</div>
                    <div><span style={{ color: '#8b5cf6' }}>🔤 PUNCTUATION</span> - Fix punctuation errors</div>
                    <div><span style={{ color: '#64748b' }}>📋 HEADER ISSUE</span> - Fix contact or header formatting</div>
                    <div><span style={{ color: '#3b82f6' }}>🔍 KEYWORD</span> - Add missing keywords</div>
                </div>
            </details>
        </div>
    );
}