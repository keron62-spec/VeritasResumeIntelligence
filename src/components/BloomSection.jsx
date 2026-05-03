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

    // Get JD Bloom level - handles both field names
    const jdBloomLevel = bloom_analysis.jd_bloom_level || bloom_analysis.jd_bloom_score;
    const hasJDBloom = jdBloomLevel !== null && jdBloomLevel !== undefined;

    return (
        <div className="v8-section">
            <div className="results-section">
                <h3><Icons.Bloom /> Bloom's Taxonomy Analysis</h3>
                
                {/* Section 1: Your Cognitive Profile */}
                <div style={{ marginBottom: '20px', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📊 YOUR COGNITIVE PROFILE</div>
                    <div>Your Resume Bloom Score: <strong>{bloom_analysis.average_bloom_level?.toFixed(1) || 'N/A'}</strong></div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Based on cognitive complexity of your bullet points</div>
                </div>
                
                {/* Section 2: Role Requirements (Comparison Mode only) */}
                {isComparisonMode && (
                    <div style={{ marginBottom: '20px', padding: '12px', background: '#eff6ff', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎯 WHAT THIS ROLE REQUIRES</div>
                        {hasJDBloom ? (
                            <div>JD Required Bloom Score: <strong>{jdBloomLevel.toFixed(1)}</strong></div>
                        ) : (
                            <div>
                                <strong>Not enough data</strong>
                                <div className="bloom-na-message" style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Info /> Paste full job description for accurate Bloom matching
                                </div>
                            </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Based on verbs in the job description</div>
                    </div>
                )}
                
                {/* Section 3: Expected Level (Standard Mode only) */}
                {!isComparisonMode && (
                    <div style={{ marginBottom: '20px', padding: '12px', background: '#f3e8ff', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎯 EXPECTED FOR YOUR LEVEL</div>
                        <div>Expected Bloom Score: <strong>{bloom_analysis.expected_bloom_level?.toFixed(1) || 'N/A'}</strong></div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Based on your years of experience</div>
                    </div>
                )}
                
                {/* Section 4: Alignment */}
                <div style={{ marginBottom: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚖️ YOUR ALIGNMENT</div>
                    <div>Bloom Gap: <strong style={{ color: (bloom_analysis.bloom_gap ?? 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {(bloom_analysis.bloom_gap > 0 ? '+' : '')}{bloom_analysis.bloom_gap?.toFixed(1)}
                    </strong></div>
                    <div style={{ fontSize: '13px', marginTop: '8px' }}>{bloom_analysis.bloom_assessment}</div>
                </div>

                {/* Bloom Flags (if any) */}
                {bloom_analysis.flags && bloom_analysis.flags.length > 0 && (
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px', color: '#ef4444' }}>⚠️ Cognitive Complexity Flags</div>
                        {bloom_analysis.flags.map((flag, idx) => {
                            if (typeof flag === 'string') {
                                if (flag === 'bloom_inflation') {
                                    return <div key={idx} style={{ fontSize: '13px' }}>🔴 Your language sounds more strategic than your experience level. Consider toning down executive-level claims.</div>;
                                } else if (flag === 'bloom_under_selling') {
                                    return <div key={idx} style={{ fontSize: '13px' }}>🟡 Your language sounds more junior than your experience level. Use stronger action verbs.</div>;
                                }
                                return <div key={idx} style={{ fontSize: '13px' }}>⚠️ {flag.replace(/_/g, ' ')}</div>;
                            }
                            return (
                                <div key={idx} style={{ fontSize: '13px', marginBottom: '4px' }}>
                                    {flag.type === 'bloom_inflation' && '🔴 Your language sounds more strategic than your experience level.'}
                                    {flag.type === 'bloom_under_selling' && '🟡 Your language sounds more junior than your experience level.'}
                                    {!flag.type && `⚠️ ${flag}`}
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* Bullets by Level with Color Coding */}
                {(bloom_analysis.bullets_by_level?.length > 0) && (
                    <details style={{ marginTop: '16px' }}>
                        <summary style={{ fontSize: '12px', cursor: 'pointer', color: '#64748b' }}>View bullet distribution by cognitive level</summary>
                        <div style={{ marginTop: '12px' }}>
                            {bloom_analysis.bullets_by_level.map((item, idx) => (
                                <div key={idx} style={{ marginTop: '8px', fontSize: '13px' }}>
                                    <span className={getBloomLevelClass(item.level)}>Level {item.level}</span>
                                    <span style={{ marginLeft: '8px' }}>{item.count} bullet{item.count !== 1 ? 's' : ''}</span>
                                    {item.example && <span style={{ color: '#64748b', marginLeft: '10px' }}>— "{item.example.substring(0, 60)}..."</span>}
                                    {item.bullet && <span style={{ color: '#64748b', marginLeft: '10px' }}>— "{item.bullet.substring(0, 60)}..."</span>}
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}