import React from 'react';

export default function StrengthsAndKeywords({ strengths, market_positioning, missing_keywords, role_adjustment_note }) {
    return (
        <div className="results-section">
            <h3>✅ What's Working Well</h3>
            {strengths?.length > 0 ? (
                <ul className="strengths-list">
                    {strengths.map((strength, idx) => <li key={idx}>{strength}</li>)}
                </ul>
            ) : <p>No strengths identified</p>}

            {market_positioning && (
                <>
                    <h3 style={{ marginTop: '20px' }}>📊 Market Positioning</h3>
                    <p><strong>Level:</strong> {market_positioning.level}</p>
                    <p><strong>Assessment:</strong> {market_positioning.assessment}</p>
                </>
            )}

            {missing_keywords?.length > 0 && (
                <>
                    <h3 style={{ marginTop: '20px' }}>🔍 Missing Keywords</h3>
                    <ul className="missing-keywords-list">
                        {missing_keywords.map((keyword, idx) => <li key={idx}>{keyword}</li>)}
                    </ul>
                </>
            )}

            {role_adjustment_note && (
                <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', fontSize: '13px' }}>
                    ℹ️ {role_adjustment_note}
                </div>
            )}
        </div>
    );
}