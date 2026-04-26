import React from 'react';
import { Icons } from '../assets/icons.jsx';

const RIASEC_COLORS = {
    R: '#ef4444', I: '#3b82f6', A: '#ec4899', 
    S: '#10b981', E: '#f59e0b', C: '#8b5cf6'
};

const RIASEC_NAMES = {
    R: 'Realistic', I: 'Investigative', A: 'Artistic', 
    S: 'Social', E: 'Enterprising', C: 'Conventional'
};

export default function RiasecSection({ riasec, isComparisonMode }) {
    if (!riasec) return null;
    const types = ['R', 'I', 'A', 'S', 'E', 'C'];

    return (
        <div className="riasec-container">
            <div className="riasec-title"><Icons.Riasec /> RIASEC Personality Match</div>
            
            <div className="riasec-compare-grid">
                <div className="riasec-column">
                    <div className="riasec-column-title">🎯 Your Profile</div>
                    <div className="riasec-bars">
                        {types.map(code => (
                            <div key={code} className="riasec-bar-item">
                                <div className="riasec-bar-label" style={{ color: RIASEC_COLORS[code] }}>{code}</div>
                                <div className="riasec-bar-name">{RIASEC_NAMES[code]}</div>
                                <div className="riasec-bar-track">
                                    <div className="riasec-bar-fill" style={{ width: `${(riasec.candidate_scores?.[code] || 0) * 10}%`, backgroundColor: RIASEC_COLORS[code] }}></div>
                                </div>
                                <div className="riasec-bar-value">{riasec.candidate_scores?.[code] || 0}/10</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {isComparisonMode && riasec.jd_scores && (
                    <div className="riasec-column">
                        <div className="riasec-column-title">📋 Role Requirements</div>
                        <div className="riasec-bars">
                            {types.map(code => (
                                <div key={code} className="riasec-bar-item">
                                    <div className="riasec-bar-label" style={{ color: RIASEC_COLORS[code] }}>{code}</div>
                                    <div className="riasec-bar-name">{RIASEC_NAMES[code]}</div>
                                    <div className="riasec-bar-track">
                                        <div className="riasec-bar-fill" style={{ width: `${(riasec.jd_scores?.[code] || 0) * 10}%`, backgroundColor: RIASEC_COLORS[code], opacity: 0.7 }}></div>
                                    </div>
                                    <div className="riasec-bar-value">{riasec.jd_scores?.[code] || 0}/10</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="riasec-codes">
                <div className="riasec-code">
                    <div className="riasec-code-letter">{riasec.candidate_codes}</div>
                    <div className="riasec-code-label">Your Code</div>
                </div>
                {isComparisonMode && riasec.jd_codes && (
                    <div className="riasec-code">
                        <div className="riasec-code-letter">{riasec.jd_codes}</div>
                        <div className="riasec-code-label">Role Code</div>
                    </div>
                )}
                <div className="riasec-code">
                    <div className="riasec-code-letter">{riasec.match_percent}%</div>
                    <div className="riasec-code-label">Match</div>
                </div>
            </div>
            
            <div className="riasec-insight">{riasec.insight}</div>
        </div>
    );
}