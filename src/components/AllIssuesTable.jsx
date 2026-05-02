import React from 'react';

export default function AllIssuesTable({ all_issues }) {
    if (!all_issues?.length) return null;

    // Pattern detection and badge mapping
    const getPatternBadge = (issueText) => {
        const text = issueText.toLowerCase();
        
        // Quantification patterns
        if (text.includes('quantified scale') || text.includes('missing quantified')) {
            return { label: '📊 QUANTIFIED SCALE', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' };
        }
        if (text.includes('percentage') || text.includes('%')) {
            return { label: '📈 PERCENTAGE', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' };
        }
        if (text.includes('dollar') || text.includes('$') || text.includes('budget')) {
            return { label: '💰 DOLLAR VALUE', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
        }
        if (text.includes('volume') || text.includes('user volume')) {
            return { label: '📊 VOLUME METRIC', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' };
        }
        if (text.includes('timeline') || text.includes('before/after')) {
            return { label: '⏱️ TIMELINE BEAT', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' };
        }
        
        // Verb strength patterns
        if (text.includes('weak verb') || text.includes('weak verb pattern')) {
            return { label: '⚡ WEAK VERB', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' };
        }
        if (text.includes('passive voice')) {
            return { label: '📝 PASSIVE VOICE', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' };
        }
        if (text.includes('weak opening')) {
            return { label: '🚪 WEAK OPENING', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' };
        }
        
        // Outcome patterns
        if (text.includes('measurable outcome') || text.includes('no result')) {
            return { label: '🎯 MEASURABLE OUTCOME', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' };
        }
        if (text.includes('vague attribution')) {
            return { label: '🎭 VAGUE ATTRIBUTION', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
        }
        
        // Scope patterns
        if (text.includes('team scale')) {
            return { label: '👥 TEAM SCALE', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' };
        }
        if (text.includes('geographic scope')) {
            return { label: '🌍 GEOGRAPHIC SCOPE', color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.1)' };
        }
        if (text.includes('user volume')) {
            return { label: '👤 USER VOLUME', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' };
        }
        
        // Technical patterns
        if (text.includes('named technology') || text.includes('vague technology')) {
            return { label: '💻 NAMED TECHNOLOGY', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
        }
        if (text.includes('methodology')) {
            return { label: '📐 METHODOLOGY', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
        }
        if (text.includes('automation')) {
            return { label: '🤖 AUTOMATION', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
        }
        
        // Leadership patterns
        if (text.includes('strategic initiative')) {
            return { label: '🎯 STRATEGIC INITIATIVE', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
        }
        if (text.includes('cross-functional')) {
            return { label: '🔄 CROSS-FUNCTIONAL', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
        }
        if (text.includes('budget ownership')) {
            return { label: '💰 BUDGET OWNERSHIP', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
        }
        
        // Compliance patterns
        if (text.includes('security') || text.includes('compliance') || text.includes('regulatory')) {
            return { label: '🔒 SECURITY/COMPLIANCE', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
        }
        if (text.includes('certification')) {
            return { label: '📜 CERTIFICATION', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' };
        }
        
        // Formatting patterns
        if (text.includes('header formatting') || text.includes('contact issue')) {
            return { label: '📋 HEADER ISSUE', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' };
        }
        if (text.includes('section header')) {
            return { label: '📑 SECTION HEADER', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' };
        }
        if (text.includes('bullet style') || text.includes('formatting')) {
            return { label: '📝 FORMATTING', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' };
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
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 All Identified Issues ({all_issues.length})
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    • Pattern badges show improvement type
                </span>
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
                <table className="issues-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>Priority</th>
                            <th style={{ width: '100px' }}>Pattern</th>
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
                    <div><span style={{ color: '#2563eb' }}>📊 QUANTIFIED SCALE</span> - Add numbers (%, $, volume)</div>
                    <div><span style={{ color: '#f97316' }}>⚡ WEAK VERB</span> - Use stronger action verbs</div>
                    <div><span style={{ color: '#10b981' }}>🎯 MEASURABLE OUTCOME</span> - Show results/impact</div>
                    <div><span style={{ color: '#8b5cf6' }}>🎭 VAGUE ATTRIBUTION</span> - Clarify your specific role</div>
                    <div><span style={{ color: '#3b82f6' }}>👥 TEAM SCALE</span> - Specify team size</div>
                    <div><span style={{ color: '#14b8a6' }}>🌍 GEOGRAPHIC SCOPE</span> - Add location scale</div>
                    <div><span style={{ color: '#6b7280' }}>💻 NAMED TECHNOLOGY</span> - Name specific tools/systems</div>
                    <div><span style={{ color: '#f59e0b' }}>💰 BUDGET OWNERSHIP</span> - Add dollar amounts</div>
                    <div><span style={{ color: '#ef4444' }}>🔒 SECURITY/COMPLIANCE</span> - Add compliance context</div>
                    <div><span style={{ color: '#06b6d4' }}>⏱️ TIMELINE BEAT</span> - Add before/after comparison</div>
                    <div><span style={{ color: '#64748b' }}>📋 HEADER ISSUE</span> - Fix contact/formatting</div>
                    <div><span style={{ color: '#8b5cf6' }}>🎯 STRATEGIC INITIATIVE</span> - Show strategic context</div>
                </div>
            </details>
        </div>
    );
}