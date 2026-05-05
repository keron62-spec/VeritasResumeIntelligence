import React from 'react';

export default function SkillExtractor({ skillExtractor }) {
    if (!skillExtractor || !skillExtractor.skill_analysis) {
        return null;
    }
    
    const { keep, add, consider, remove, summary } = skillExtractor.skill_analysis;
    
    return (
        <div className="skill-extractor" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-light)'
        }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔧</span> Skill Extractor
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    JD vs Resume Skills Audit
                </span>
            </h3>
            
            {/* Summary Banner */}
            {summary && (
                <div style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    borderLeft: '3px solid #2563eb'
                }}>
                    💡 <strong>Actionable Summary:</strong> {summary}
                </div>
            )}
            
            {/* KEEP Section */}
            {keep && keep.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '16px' }}>✅</span>
                        <strong style={{ color: '#10b981' }}>Skills to Keep</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{keep.length} skills matched JD</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {keep.map((item, i) => (
                            <div key={i} style={{
                                padding: '10px 12px',
                                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                borderRadius: '8px',
                                borderLeft: '3px solid #10b981'
                            }}>
                                <strong>{item.skill}</strong>
                                {item.matched_to !== item.skill && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {' '}→ matches "{item.matched_to}"
                                    </span>
                                )}
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {item.reason}
                                </div>
                                <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>
                                    💡 {item.action}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* ADD Section */}
            {add && add.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '16px' }}>➕</span>
                        <strong style={{ color: '#ef4444' }}>Skills to Add</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{add.length} missing from JD</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {add.map((item, i) => (
                            <div key={i} style={{
                                padding: '10px 12px',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? '#f59e0b' : '#10b981'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <strong>{item.skill}</strong>
                                    {item.priority === 'high' && (
                                        <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '12px' }}>REQUIRED</span>
                                    )}
                                    {item.priority === 'medium' && (
                                        <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '12px' }}>PREFERRED</span>
                                    )}
                                    {item.priority === 'low' && (
                                        <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#10b981', color: 'white', borderRadius: '12px' }}>OPTIONAL</span>
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    {item.reason}
                                </div>
                                <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '4px' }}>
                                    💡 {item.suggestion}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* CONSIDER Section */}
            {consider && consider.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '16px' }}>🤔</span>
                        <strong style={{ color: '#f59e0b' }}>Skills to Consider</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{consider.length} nice-to-have</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {consider.map((item, i) => (
                            <div key={i} style={{
                                padding: '10px 12px',
                                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                                borderRadius: '8px',
                                borderLeft: '3px solid #f59e0b'
                            }}>
                                <strong>{item.skill}</strong>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {item.reason}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    💡 {item.suggestion}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* REMOVE Section */}
            {remove && remove.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '16px' }}>🗑️</span>
                        <strong style={{ color: 'var(--text-muted)' }}>Skills to Remove</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{remove.length} irrelevant to JD</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {remove.map((item, i) => (
                            <div key={i} style={{
                                padding: '10px 12px',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '8px',
                                textDecoration: 'line-through',
                                color: 'var(--text-muted)'
                            }}>
                                <strong>{item.skill}</strong>
                                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                                    {item.reason}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    ✂️ {item.action}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Source Data Toggle (Optional - shows extracted skills) */}
            <details style={{ marginTop: '16px' }}>
                <summary style={{ fontSize: '11px', cursor: 'pointer', color: 'var(--text-muted)', textAlign: 'center' }}>
                    📋 Show extracted skills (JD vs Resume)
                </summary>
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11px' }}>
                    <div>
                        <strong>JD Skills:</strong>
                        <ul style={{ marginTop: '4px', paddingLeft: '16px', color: 'var(--text-muted)' }}>
                            {skillExtractor.jd_skills_extracted?.map((s, i) => (
                                <li key={i}>{s.skill} <span style={{ color: s.importance === 'required' ? '#ef4444' : '#f59e0b' }}>({s.importance})</span></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <strong>Your Skills:</strong>
                        <ul style={{ marginTop: '4px', paddingLeft: '16px', color: 'var(--text-muted)' }}>
                            {skillExtractor.resume_skills_extracted?.map((s, i) => (
                                <li key={i}>{s.skill}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </details>
        </div>
    );
}