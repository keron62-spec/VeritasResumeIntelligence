import React, { useState } from 'react';
import { Icons } from '../assets/icons.jsx';

export default function SemanticSection({ semantic_analysis, role_type_detected, isComparisonMode }) {
    const [showExplainer, setShowExplainer] = useState(false);

    if (!semantic_analysis) return null;

    const getSemanticColor = (score) => {
        if (score >= -1.5 && score <= 1.5) return 'green';
        if (Math.abs(score) <= 3.5) return 'orange';
        return 'red';
    };

    const getPositionLabel = (score) => {
        if (score < -3.5) return 'Severely Under-positioned';
        if (score < -1.5) return 'Moderately Under-positioned';
        if (score < 0) return 'Slightly Under-positioned';
        if (score === 0) return 'Perfectly Positioned';
        if (score <= 1.5) return 'Slightly Over-positioned';
        if (score <= 3.5) return 'Moderately Over-positioned';
        return 'Severely Over-positioned';
    };

    const scalePosition = ((semantic_analysis.position_score + 5) / 10) * 100;

    return (
        <div className="semantic-container">
            <div className="semantic-header">
                <span className="semantic-title"><Icons.Semantic /> Semantic Positioning</span>
                <span className={`semantic-badge ${getSemanticColor(semantic_analysis.position_score)}`}>
                    {getPositionLabel(semantic_analysis.position_score)}
                </span>
                {role_type_detected && <span className="industry-badge">Industry: {role_type_detected}</span>}
            </div>

            <div className="semantic-stats">
                <div className="semantic-stat">
                    <div className="semantic-stat-label">Position Score</div>
                    <div className="semantic-stat-value" style={{ 
                        color: Math.abs(semantic_analysis.position_score) <= 1.5 ? 'var(--accent-emerald)' : Math.abs(semantic_analysis.position_score) <= 3.5 ? 'var(--accent-amber)' : 'var(--accent-rose)' 
                    }}>
                        {semantic_analysis.position_score > 0 ? '+' : ''}{semantic_analysis.position_score}
                    </div>
                </div>
                <div className="semantic-stat">
                    <div className="semantic-stat-label">Detected Level</div>
                    <div className="semantic-stat-value">{semantic_analysis.detected_level || 'N/A'}</div>
                </div>
                <div className="semantic-stat">
                    <div className="semantic-stat-label">Confidence</div>
                    <div className="semantic-stat-value">{semantic_analysis.confidence || 0}%</div>
                </div>
            </div>

            <div className="position-scale">
                <div className="scale-line">
                    <div className="scale-marker" style={{ left: `${scalePosition}%` }}></div>
                </div>
                <div className="scale-labels">
                    <span>Under-positioned (-5)</span>
                    <span>Aligned (0)</span>
                    <span>Over-positioned (+5)</span>
                </div>
            </div>

            {isComparisonMode && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Alignment Score</span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{semantic_analysis.alignment_score}/10</span>
                    </div>
                    <div className="alignment-bar">
                        <div className="alignment-fill" style={{ width: `${(semantic_analysis.alignment_score / 10) * 100}%` }}></div>
                    </div>
                </div>
            )}

            <div className="explainer" onClick={() => setShowExplainer(!showExplainer)}>
                ℹ️ How to read this score (Click here)
                <div className={`explainer-content ${showExplainer ? 'show' : ''}`}>
                    <strong>POSITION SCORE (-5 to +5)</strong><br/>
                    Measures whether your resume language matches your experience level.<br/><br/>
                    <strong>What the score means:</strong><br/>
                    • -1.5 to +1.5 → ✅ Perfectly aligned<br/>
                    • -3.5 to -1.5 → ⚠️ You sound junior (under-positioned)<br/>
                    • +1.5 to +3.5 → ⚠️ You sound senior (over-positioned)<br/>
                    • Beyond ±3.5 → 🔴 Critical mismatch
                </div>
            </div>
        </div>
    );
}