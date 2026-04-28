import React from 'react';
import { Icons } from '../assets/icons';
import { getScoreColor, getScoreGrade, getRiskBadgeClass, getInterviewLabel } from '../utils/helpers';

export default function ScoreDashboard({ result, isComparisonMode }) {
    
    // PDF Health Score - PRIORITIZE Azure's calculated score, fallback to calculation
    const getPdfHealthScore = () => {
        // FIRST: Use Azure's calculated score if available (most accurate)
        if (result?.pdf_health?.pdf_health_score !== undefined && result?.pdf_health?.pdf_health_score !== null) {
            return result.pdf_health.pdf_health_score;
        }
        
        // SECOND: Fallback to calculating from issues
        if (!result?.pdf_health?.issues) return null;
        let score = 100;
        for (const issue of result.pdf_health.issues) {
            if (issue.severity === 'critical') score -= 25;
            else if (issue.severity === 'high') score -= 15;
            else if (issue.severity === 'medium') score -= 8;
            else if (issue.severity === 'low') score -= 3;
            else if (issue.severity === 'good') score += 5;
        }
        return Math.max(0, Math.min(100, score));
    };

    // PDF Health Label - PRIORITIZE Azure's label, fallback to calculation
    const getPdfHealthLabel = () => {
        // FIRST: Use Azure's label if available
        if (result?.pdf_health?.pdf_health_label) {
            return result.pdf_health.pdf_health_label;
        }
        
        // SECOND: Calculate from score
        const score = getPdfHealthScore();
        if (score === null) return null;
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Moderate';
        if (score >= 60) return 'Poor';
        return 'Critical';
    };

    const pdfScore = getPdfHealthScore();
    const pdfLabel = getPdfHealthLabel();
    const isPerfectScore = result.total_ats_score === 100 && result.fit_score === 100 && result.credibility_score === 100;
    const interviewLabel = result.interview_likelihood_score !== null 
        ? getInterviewLabel(result.interview_likelihood_score, isPerfectScore) 
        : null;

    return (
        <div className="score-grid">
            <div className="score-card">
                <h4><Icons.ATS /> ATS Score</h4>
                <div className="score-value" style={{ color: getScoreColor(result.total_ats_score) }}>{result.total_ats_score}</div>
                <div className="score-label">/100 ({getScoreGrade(result.total_ats_score)})</div>
            </div>
            
            {pdfScore !== null && (
                <div className="score-card">
                    <h4>📄 PDF Health</h4>
                    <div className="score-value" style={{ color: getScoreColor(pdfScore) }}>{pdfScore}</div>
                    <div className="score-label">/100 ({pdfLabel})</div>
                </div>
            )}
            
            {isComparisonMode && result.fit_score !== null && (
                <div className="score-card">
                    <h4><Icons.Fit /> Fit Score</h4>
                    <div className="score-value" style={{ color: getScoreColor(result.fit_score) }}>{result.fit_score}</div>
                    <div className="score-label">/100 (Role Match)</div>
                </div>
            )}
            
            {interviewLabel && (
                <div className="score-card">
                    <h4><Icons.Interview /> Interview Likelihood</h4>
                    <div className="score-value">{result.interview_likelihood_score}</div>
                    <div className="score-label">/100</div>
                    <div className="interview-label" style={{ backgroundColor: interviewLabel.bgColor, color: interviewLabel.color }}>
                        {interviewLabel.emoji} {interviewLabel.text}
                    </div>
                </div>
            )}
            
            <div className="score-card">
                <h4><Icons.Risk /> Risk Level</h4>
                <div className={`risk-badge ${getRiskBadgeClass(result.risk_level)}`}>
                    {result.risk_level || 'Medium'}
                </div>
            </div>
        </div>
    );
}