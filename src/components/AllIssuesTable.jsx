import React from 'react';

export default function AllIssuesTable({ all_issues }) {
    if (!all_issues?.length) return null;

    return (
        <div className="results-section" style={{ marginTop: '20px' }}>
            <h3>📋 All Identified Issues ({all_issues.length})</h3>
            <table className="issues-table">
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th>Issue</th>
                        <th>Location</th>
                        <th>How to Fix</th>
                    </tr>
                </thead>
                <tbody>
                    {all_issues.slice(0, 15).map((issue, idx) => (
                        <tr key={idx}>
                            <td className={`priority-${(issue.priority || 'medium').toLowerCase()}`}>
                                {issue.priority || 'Medium'}
                            </td>
                            <td><strong>{issue.issue}</strong></td>
                            <td><small style={{ color: 'var(--text-muted)' }}>{issue.location || 'General'}</small></td>
                            <td>{issue.fix || issue.suggestion || 'Review and improve'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {all_issues.length > 15 && (
                <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    +{all_issues.length - 15} more issues
                </p>
            )}
        </div>
    );
}