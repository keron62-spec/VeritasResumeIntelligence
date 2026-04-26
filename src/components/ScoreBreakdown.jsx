import React from 'react';

export default function ScoreBreakdown({ breakdown }) {
    if (!breakdown) return null;

    return (
        <div className="results-section" style={{ marginTop: '20px' }}>
            <h3>📊 Score Breakdown</h3>
            <table className="issues-table">
                <thead>
                    <tr><th>Category</th><th>Score</th><th>Max</th></tr>
                </thead>
                <tbody>
                    <tr><td>Header & Contact</td><td>{breakdown.header_contact || 0}</td><td>10</td></tr>
                    <tr><td>Keyword Density</td><td>{breakdown.keyword_density || 0}</td><td>20</td></tr>
                    <tr><td>Quantified Results</td><td>{breakdown.quantified_results || 0}</td><td>20</td></tr>
                    <tr><td>Action Verbs</td><td>{breakdown.action_verbs || 0}</td><td>15</td></tr>
                    <tr><td>Formatting & Structure</td><td>{breakdown.formatting_structure || 0}</td><td>10</td></tr>
                    <tr><td>Skills Section</td><td>{breakdown.skills_section || 0}</td><td>10</td></tr>
                    <tr><td>Length & Brevity</td><td>{breakdown.length_brevity || 0}</td><td>5</td></tr>
                    <tr><td>Publications & Projects</td><td>{breakdown.publications_projects || 0}</td><td>5</td></tr>
                    {breakdown.recruiter_scan_penalty !== undefined && (
                        <tr><td>Recruiter Scan Penalty</td><td>{breakdown.recruiter_scan_penalty}</td><td>0</td></tr>
                    )}
                    {breakdown.buzzword_repetition_penalty !== undefined && (
                        <tr><td>Buzzword/Repetition Penalty</td><td>{breakdown.buzzword_repetition_penalty}</td><td>0</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}