import React from 'react';

const getRoleMatchDisclaimer = (roleMatches, atsScore, positionScore) => {
    if (!roleMatches || roleMatches.length === 0) return null;
    const strongMatches = roleMatches.filter(m => (m.match_percentage ?? 0) >= 80);
    const strongMatchCount = strongMatches.length;
    const isPositionedOutsideRange = Math.abs(positionScore) > 1.5;
    const isLowAts = atsScore < 70;
    
    if (strongMatchCount === 0) {
        return {
            type: 'critical',
            title: 'CRITICAL: No strong role matches detected',
            message: `Your ATS score (${atsScore}) and positioning score (${positionScore > 0 ? '+' : ''}${positionScore}) are directly limiting your role matches.`,
            actions: ['Replace weak verbs', 'Add quantified results', 'Review Missing Keywords'],
            callToAction: 'Start with "Immediate Fixes" at the bottom of this report'
        };
    }
    if (strongMatchCount === 1 && (isLowAts || isPositionedOutsideRange)) {
        return {
            type: 'warning',
            title: '⚠️ You have 1 strong role match. Aim for 2-3.',
            message: 'Your resume is limiting you to only 1 strong match.',
            actions: ['Replace weak verbs', 'Add quantified results', 'Add keywords from adjacent roles'],
            callToAction: 'Aim for 2-3 roles above 80% for better job search breadth'
        };
    }
    return null;
};

export default function RoleMatches({ role_match, total_ats_score, position_score, immediate_fixes }) {
    const disclaimer = getRoleMatchDisclaimer(role_match, total_ats_score, position_score);

    return (
        <div className="results-section">
            <h3>🎯 Role Match Scores</h3>
            {role_match?.length > 0 ? (
                <>
                    {role_match.map((role, idx) => (
                        <div key={idx} className="role-match-item">
                            <span>{role.role || 'Unknown Role'}</span>
                            <span className={(role.match_percentage ?? 0) >= 80 ? "match-strong" : "match-percentage"}>
                                {role.match_percentage || 0}%
                            </span>
                        </div>
                    ))}
                    
                    {disclaimer && (
                        <div className={`disclaimer-box ${disclaimer.type}`}>
                            <strong>{disclaimer.title}</strong><br/><br/>
                            <p>{disclaimer.message}</p>
                            <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
                                {disclaimer.actions.map((action, i) => <li key={i}>{action}</li>)}
                            </ul>
                            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>→ {disclaimer.callToAction}</p>
                        </div>
                    )}
                </>
            ) : <p>No role matches identified</p>}

            {immediate_fixes?.length > 0 && (
                <>
                    <h3 style={{ marginTop: '20px' }}>🔧 Immediate Fixes</h3>
                    <ul>
                        {immediate_fixes.map((fix, idx) => <li key={idx} style={{ marginBottom: '10px' }}>{fix}</li>)}
                    </ul>
                </>
            )}
        </div>
    );
}