import React, { useState } from 'react';
import { Icons } from '../assets/icons.jsx';

export default function CredibilitySection({ credibility_score, credibility_analysis }) {
    const [showExplainer, setShowExplainer] = useState(false);

    if (credibility_score === undefined || !credibility_analysis) return null;

    const getCredibilityLabel = (score) => {
        if (score >= 90) return { label: 'Highly Credible', color: 'high' };
        if (score >= 80) return { label: 'Credible', color: 'high' };
        if (score >= 70) return { label: 'Moderately Credible', color: 'moderate' };
        if (score >= 60) return { label: 'Questionable Credibility', color: 'moderate' };
        return { label: 'Low Credibility', color: 'low' };
    };

    const labelInfo = getCredibilityLabel(credibility_score);

    return (
        <div className="credibility-container">
            <div className="credibility-header">
                <span className="credibility-title"><Icons.Credibility /> Credibility Score</span>
                <span className={`credibility-badge ${labelInfo.color}`}>{labelInfo.label}</span>
            </div>
            
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Credibility Score</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{credibility_score}/100</span>
                </div>
                <div className="credibility-bar">
                    <div className="credibility-fill" style={{ width: `${credibility_score}%` }}></div>
                </div>
            </div>

            <div className="explainer" onClick={() => setShowExplainer(!showExplainer)}>
                Credibility Score Explained (Click here)
                <div className={`explainer-content ${showExplainer ? 'show' : ''}`}>
                    <strong>What is the Credibility Score?</strong><br/>
                    Measures how believable your resume is, separate from your ATS score.<br/><br/>
                    <strong>How it's calculated:</strong><br/>
                    • Career trajectory (do your promotions make sense?)<br/>
                    • Education vs. title (is a "Director" degree-appropriate?)<br/>
                    • Metric plausibility (are your numbers realistic?)
                </div>
            </div>

            {credibility_analysis.career_plausibility_flags?.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>📈 Career Trajectory Flags</h4>
                    {credibility_analysis.career_plausibility_flags.map((flag, idx) => (
                        <div key={idx} className="credibility-flag-item">
                            <strong>⚠️ {flag.type?.replace(/_/g, ' ').toUpperCase() || 'Flag'}</strong>
                            <div style={{ marginTop: '5px' }}>{flag.issue}</div>
                            <div className="flag-suggestion">💡 {flag.suggestion}</div>
                        </div>
                    ))}
                </div>
            )}

            {credibility_analysis.promotion_signals?.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>📈 Promotion Signals</h4>
                    {credibility_analysis.promotion_signals.map((signal, idx) => (
                        <div key={idx} className="success-message" style={{ background: 'rgba(5, 150, 105, 0.1)', borderLeft: '4px solid var(--accent-emerald)' }}>
                            ✅ {signal}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}