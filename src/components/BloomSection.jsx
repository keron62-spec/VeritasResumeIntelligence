import React from 'react';
import { Icons } from '../assets/icons.jsx';

export default function BloomSection({ bloom_analysis, isComparisonMode }) {
    if (!bloom_analysis) return null;

    const getBloomLevelClass = (level) => {
        if (level === 6) return 'bloom-level-6';
        if (level === 5) return 'bloom-level-5';
        if (level === 4) return 'bloom-level-4';
        if (level === 3) return 'bloom-level-3';
        if (level === 2) return 'bloom-level-2';
        return 'bloom-level-1';
    };

    return (
        <div className="v8-section">
            <div className="results-section">
                <h3><Icons.Bloom /> Bloom's Taxonomy Analysis</h3>
                
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(5, 150, 105, 0.1)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📊 Your Resume Bloom Score</div>
                    <div>Your Resume Bloom Score: <strong>{bloom_analysis.average_bloom_level?.toFixed(1) || 'N/A'}</strong></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Based on cognitive complexity of your bullet points</div>
                </div>

                {isComparisonMode && (
                    <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎯 WHAT THIS ROLE REQUIRES</div>
                        {bloom_analysis.jd_bloom_score ? (
                            <div>JD Required Bloom Score: <strong>{bloom_analysis.jd_bloom_score?.toFixed(1)}</strong></div>
                        ) : (
                            <div>
                                <strong>Not enough data</strong>
                                <div className="bloom-na-message"><Icons.Info /> Paste full job description for accurate Bloom matching</div>
                            </div>
                        )}
                    </div>
                )}

                {!isComparisonMode && (
                    <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎯 EXPECTED FOR YOUR LEVEL</div>
                        <div>Expected Bloom Score: <strong>{bloom_analysis.expected_bloom_level?.toFixed(1) || 'N/A'}</strong></div>
                    </div>
                )}

                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚖️ YOUR ALIGNMENT</div>
                    <div>Bloom Gap: <strong style={{ color: (bloom_analysis.bloom_gap ?? 0) >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {(bloom_analysis.bloom_gap > 0 ? '+' : '')}{bloom_analysis.bloom_gap?.toFixed(1)}
                    </strong></div>
                    <div style={{ fontSize: '13px', marginTop: '8px' }}>{bloom_analysis.bloom_assessment}</div>
                </div>

                {bloom_analysis.bullets_by_level?.length > 0 && (
                    <details style={{ marginTop: '16px' }}>
                        <summary style={{ fontSize: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>View bullet distribution by cognitive level</summary>
                        <div style={{ marginTop: '12px' }}>
                            {bloom_analysis.bullets_by_level.map((item, idx) => (
                                <div key={idx} style={{ marginTop: '8px', fontSize: '13px' }}>
                                    <span className={getBloomLevelClass(item.level)}>Level {item.level}</span>
                                    <span style={{ marginLeft: '8px' }}>{item.count} bullet{item.count !== 1 ? 's' : ''}</span>
                                    {item.example && <span style={{ color: 'var(--text-muted)', marginLeft: '10px' }}>— "{item.example.substring(0, 60)}..."</span>}
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}