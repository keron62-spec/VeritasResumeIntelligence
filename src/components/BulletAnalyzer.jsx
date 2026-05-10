import React, { useState } from 'react';

export default function BulletAnalyzer({ bulletAnalysis, isComparisonMode }) {
    const [expandedBullet, setExpandedBullet] = useState(null);
    const [copiedBulletId, setCopiedBulletId] = useState(null);
    const [sortBy, setSortBy] = useState('score_asc');
    const [scoreVersion, setScoreVersion] = useState('original'); // 'original', 'veritas', 'hidden_brief'
    
    // Check if bullet analysis exists and has data
    if (!bulletAnalysis) {
        return null;
    }
    
    const copyToClipboard = (text, bulletId) => {
        navigator.clipboard.writeText(text);
        setCopiedBulletId(bulletId);
        setTimeout(() => setCopiedBulletId(null), 2000);
    };
    
    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#86efac';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };
    
    const getScoreLabel = (score) => {
        if (score >= 85) return 'Strong';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Needs Work';
        return 'Weak';
    };
    
    // Helper to get section icon
    const getSectionIcon = (section) => {
        const icons = {
            'Work Experience': '💼',
            'Projects': '🚀',
            'Volunteer Experience': '🤝',
            'Internships': '🎓',
            'Leadership': '👔',
            'Education': '📚',
            'Skills': '⚙️',
            'Other': '📄'
        };
        return icons[section] || '📄';
    };
    
    // Sort options
    const sortOptions = [
        { value: 'score_asc', label: 'Weakest First' },
        { value: 'score_desc', label: 'Strongest First' },
        { value: 'company_asc', label: 'Company (A-Z)' },
        { value: 'company_desc', label: 'Company (Z-A)' },
        { value: 'role_asc', label: 'Role (A-Z)' },
        { value: 'role_desc', label: 'Role (Z-A)' },
        { value: 'section', label: 'Section (Work → Projects → Other)' },
        { value: 'original_order', label: 'Original Order' },
        { value: 'improvement_delta', label: '✨ Biggest Veritas Gain' },
        { value: 'hb_improvement', label: '🕵️ Biggest Hidden Brief Gain' }
    ];
    
    // Score version options
    const scoreVersionOptions = [
        { value: 'original', label: 'Original', icon: '📄', color: '#64748b' },
        { value: 'veritas', label: 'Veritas', icon: '✨', color: '#2563eb' },
        { value: 'hidden_brief', label: 'Hidden Brief', icon: '🕵️', color: '#c9a84c' }
    ];
    
    // Get score based on selected version
    const getScoreValue = (bullet, version) => {
        switch(version) {
            case 'original':
                return bullet.original_score || 0;
            case 'veritas':
                return bullet.transformed_score || bullet.original_score || 0;
            case 'hidden_brief':
                return bullet.hb_score || bullet.original_score || 0;
            default:
                return bullet.original_score || 0;
        }
    };
    
    // Get label based on selected version
    const getScoreLabelValue = (bullet, version) => {
        const score = getScoreValue(bullet, version);
        return getScoreLabel(score);
    };
    
    // Get color based on selected version
    const getScoreColorValue = (bullet, version) => {
        const score = getScoreValue(bullet, version);
        return getScoreColor(score);
    };
    
    // Sorting function
    const getSortedBullets = (bullets, sortByParam, scoreVersionParam) => {
        const bulletsCopy = [...bullets];
        
        switch(sortByParam) {
            case 'score_asc':
                return bulletsCopy.sort((a, b) => getScoreValue(a, scoreVersionParam) - getScoreValue(b, scoreVersionParam));
            case 'score_desc':
                return bulletsCopy.sort((a, b) => getScoreValue(b, scoreVersionParam) - getScoreValue(a, scoreVersionParam));
            case 'company_asc':
                return bulletsCopy.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
            case 'company_desc':
                return bulletsCopy.sort((a, b) => (b.company || '').localeCompare(a.company || ''));
            case 'role_asc':
                return bulletsCopy.sort((a, b) => (a.role || '').localeCompare(b.role || ''));
            case 'role_desc':
                return bulletsCopy.sort((a, b) => (b.role || '').localeCompare(a.role || ''));
            case 'section':
                const sectionOrder = { 'Work Experience': 1, 'Projects': 2, 'Leadership': 3, 'Volunteer Experience': 4, 'Volunteer': 4, 'Internships': 5, 'Education': 6, 'Other': 99 };
                return bulletsCopy.sort((a, b) => (sectionOrder[a.section] || 99) - (sectionOrder[b.section] || 99));
            case 'improvement_delta':
                return bulletsCopy.sort((a, b) => {
                    const deltaA = (a.transformed_score || a.original_score || 0) - (a.original_score || 0);
                    const deltaB = (b.transformed_score || b.original_score || 0) - (b.original_score || 0);
                    return deltaB - deltaA;
                });
            case 'hb_improvement':
                return bulletsCopy.sort((a, b) => {
                    const deltaA = (a.hb_score || a.original_score || 0) - (a.original_score || 0);
                    const deltaB = (b.hb_score || b.original_score || 0) - (b.original_score || 0);
                    return deltaB - deltaA;
                });
            case 'original_order':
            default:
                return bulletsCopy;
        }
    };
    
    // Check if any bullet has hidden brief transformation
    const hasHiddenBrief = bulletAnalysis.bullets?.some(b => b.hb_transformed_text);
    
    // Get sorted bullets
    const sortedBullets = getSortedBullets(bulletAnalysis.bullets || [], sortBy, scoreVersion);
    
    // Handle case where bullets array is empty but we have summary
    if (!bulletAnalysis.bullets || bulletAnalysis.bullets.length === 0) {
        return (
            <div className="bullet-analyzer" style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid var(--border-light)'
            }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>🎯</span> 
                    {isComparisonMode ? 'JD Alignment Analysis' : 'Bullet Point Analysis'}
                    <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                        {bulletAnalysis.bullets_assessed || 0} bullets assessed
                    </span>
                    {hasHiddenBrief && (
                        <span style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            backgroundColor: 'rgba(198, 164, 63, 0.15)',
                            borderRadius: '12px',
                            color: '#c9a84c'
                        }}>
                            🕵️ Hidden Brief available
                        </span>
                    )}
                </h3>
                
                <div style={{ 
                    marginBottom: '16px', 
                    display: 'flex', 
                    gap: '16px', 
                    fontSize: '12px',
                    flexWrap: 'wrap',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-light)'
                }}>
                    <span>📊 Average Score: <strong>{bulletAnalysis.average_original_score || bulletAnalysis.average_score}</strong>/100</span>
                    <span>🔍 Bullets Assessed: <strong>{bulletAnalysis.bullets_assessed || 0}</strong></span>
                    {bulletAnalysis.average_transformed_score && (
                        <span style={{ color: '#10b981' }}>🚀 Potential Avg: <strong>{bulletAnalysis.average_transformed_score}</strong>/100 (+{Math.round(bulletAnalysis.average_transformed_score - (bulletAnalysis.average_original_score || bulletAnalysis.average_score))})</span>
                    )}
                </div>
                
                <div style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderLeft: '3px solid #f59e0b',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px'
                }}>
                    <p style={{ margin: 0, fontSize: '13px' }}>
                        {bulletAnalysis.summary || 'Bullet analysis completed.'}
                    </p>
                </div>
                
                {bulletAnalysis.overall_disclaimer && (
                    <div style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderLeft: '3px solid #f59e0b',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span>⚠️</span>
                            <strong>AI-Generated Suggestions</strong>
                        </div>
                        <p style={{ margin: 0 }}>{bulletAnalysis.overall_disclaimer}</p>
                    </div>
                )}
            </div>
        );
    }
    
    // Determine if we're in JD Comparison mode (has jd_context)
    const isJDComparison = isComparisonMode && bulletAnalysis.jd_context;
    
    return (
        <div className="bullet-analyzer" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid var(--border-light)'
        }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>🎯</span> 
                {isJDComparison ? 'JD Alignment Analysis' : 'Bullet Point Analysis'}
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                    {bulletAnalysis.summary}
                </span>
                {hasHiddenBrief && (
                    <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(198, 164, 63, 0.15)',
                        borderRadius: '12px',
                        color: '#c9a84c'
                    }}>
                        🕵️ Hidden Brief available
                    </span>
                )}
            </h3>
            
            {/* JD Context Panel (Comparison Mode Only) */}
            {isJDComparison && bulletAnalysis.jd_context && (
                <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px'
                }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                        📋 Role Context: {bulletAnalysis.jd_context.role_title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <strong>Critical Keywords:</strong> {bulletAnalysis.jd_context.critical_keywords?.slice(0, 8).join(', ')}
                        {bulletAnalysis.jd_context.critical_keywords?.length > 8 && '...'}
                    </div>
                    {bulletAnalysis.jd_context.required_seniority && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <strong>Target Seniority:</strong> {bulletAnalysis.jd_context.required_seniority}
                        </div>
                    )}
                </div>
            )}
            
            {/* Sort Controls */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>
                    📋 {sortedBullets.length} bullets
                    {scoreVersion !== 'original' && (
                        <span style={{ 
                            marginLeft: '8px', 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            backgroundColor: scoreVersion === 'hidden_brief' ? 'rgba(198, 164, 63, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                            borderRadius: '12px',
                            color: scoreVersion === 'hidden_brief' ? '#c9a84c' : '#2563eb'
                        }}>
                            {scoreVersion === 'hidden_brief' ? '🕵️ Hidden Brief scores' : '✨ Veritas scores'}
                        </span>
                    )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Score version selector */}
                    {hasHiddenBrief && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Score:</span>
                            <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', padding: '2px' }}>
                                {scoreVersionOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setScoreVersion(opt.value)}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            backgroundColor: scoreVersion === opt.value ? opt.color : 'transparent',
                                            color: scoreVersion === opt.value ? '#fff' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>{opt.icon}</span>
                                        <span>{opt.label === 'Hidden Brief' ? 'HB' : opt.label === 'Veritas' ? 'VT' : 'OG'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Sort by selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sort by:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--bg-secondary)',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            {sortOptions.map(opt => {
                                if (opt.value === 'hb_improvement' && !hasHiddenBrief) return null;
                                return (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.value === 'hb_improvement' ? '🕵️ Hidden Brief Gain' : opt.label}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    
                    {/* Active sort chip */}
                    <div style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {sortBy === 'score_asc' ? '📈 Weakest first' : 
                         sortBy === 'score_desc' ? '📉 Strongest first' :
                         sortBy === 'company_asc' ? '🏢 A-Z' :
                         sortBy === 'company_desc' ? '🏢 Z-A' :
                         sortBy === 'role_asc' ? '💼 A-Z' :
                         sortBy === 'role_desc' ? '💼 Z-A' :
                         sortBy === 'section' ? '📂 By section' :
                         sortBy === 'improvement_delta' ? '✨ Biggest Veritas gain' :
                         sortBy === 'hb_improvement' ? '🕵️ Biggest HB gain' :
                         '📋 Original order'}
                    </div>
                </div>
            </div>
            
            {/* Stats Summary */}
            <div style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                gap: '16px', 
                fontSize: '12px',
                flexWrap: 'wrap',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)'
            }}>
                <span>📊 Average Original Score: <strong>{bulletAnalysis.average_original_score || bulletAnalysis.average_score}</strong>/100</span>
                {bulletAnalysis.average_transformed_score && (
                    <span style={{ color: '#10b981' }}>✨ Average Veritas: <strong>{bulletAnalysis.average_transformed_score}</strong>/100 (+{Math.round(bulletAnalysis.average_transformed_score - (bulletAnalysis.average_original_score || bulletAnalysis.average_score))})</span>
                )}
                {hasHiddenBrief && bulletAnalysis.average_hb_score && (
                    <span style={{ color: '#c9a84c' }}>🕵️ Average Hidden Brief: <strong>{bulletAnalysis.average_hb_score}</strong>/100 (+{Math.round(bulletAnalysis.average_hb_score - (bulletAnalysis.average_original_score || bulletAnalysis.average_score))})</span>
                )}
                <span>🔍 Bullets Assessed: <strong>{bulletAnalysis.bullets_assessed}</strong></span>
            </div>
            
            {/* Three-Column Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid var(--border-light)'
            }}>
                <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#64748b' }}>
                    📄 Original Version
                </div>
                <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#2563eb' }}>
                    ✨ Veritas Optimized
                </div>
                <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#c9a84c' }}>
                    🕵️ Hidden Brief Version
                </div>
            </div>
            
            {/* Bullet List - Three Columns Side by Side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {sortedBullets.map((bullet, idx) => {
                    const originalScore = bullet.original_score;
                    const veritasScore = bullet.transformed_score;
                    const hbScore = bullet.hb_score;
                    const hasTransformation = bullet.transformed_text && bullet.transformed_text !== bullet.original_text;
                    const hasHBTransformation = bullet.hb_transformed_text && bullet.hb_transformed_text !== bullet.original_text;
                    const veritasImprovement = veritasScore - originalScore;
                    const hbImprovement = hbScore - originalScore;
                    
                    // Determine which score to show based on sort version (for highlighting)
                    const activeScoreColor = getScoreColorValue(bullet, scoreVersion);
                    
                    return (
                        <div key={bullet.id} style={{
                            border: `1px solid ${activeScoreColor}`,
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: originalScore < 50 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-tertiary)'
                        }}>
                            {/* Header with ID and Score Summary */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {bullet.id}
                                </div>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center', minWidth: '50px' }}>
                                        <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(originalScore) }}>
                                            {originalScore}
                                        </div>
                                        <div style={{ fontSize: '9px', color: getScoreColor(originalScore) }}>
                                            {getScoreLabel(originalScore)}
                                        </div>
                                    </div>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                    <div style={{ textAlign: 'center', minWidth: '50px' }}>
                                        <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(veritasScore) }}>
                                            {veritasScore}
                                        </div>
                                        <div style={{ fontSize: '9px', color: getScoreColor(veritasScore) }}>
                                            {getScoreLabel(veritasScore)}
                                        </div>
                                        {veritasImprovement > 0 && (
                                            <div style={{ fontSize: '9px', color: '#10b981' }}>+{veritasImprovement}</div>
                                        )}
                                    </div>
                                    {hasHBTransformation && (
                                        <>
                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                            <div style={{ textAlign: 'center', minWidth: '50px' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '600', color: getScoreColor(hbScore) }}>
                                                    {hbScore}
                                                </div>
                                                <div style={{ fontSize: '9px', color: getScoreColor(hbScore) }}>
                                                    {getScoreLabel(hbScore)}
                                                </div>
                                                {hbImprovement > 0 && (
                                                    <div style={{ fontSize: '9px', color: '#c9a84c' }}>+{hbImprovement}</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* SECTION CONTEXT */}
                            {(bullet.company || bullet.role || bullet.section) && (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                    marginBottom: '12px',
                                    padding: '6px 8px',
                                    backgroundColor: 'var(--bg-primary)',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    color: 'var(--text-muted)'
                                }}>
                                    {bullet.company && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>🏢</span> {bullet.company}
                                        </span>
                                    )}
                                    {bullet.role && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>💼</span> {bullet.role}
                                        </span>
                                    )}
                                    {bullet.section && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>{getSectionIcon(bullet.section)}</span> {bullet.section}
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            {/* THREE COLUMN GRID FOR BULLETS */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '16px',
                                marginTop: '12px'
                            }}>
                                {/* Column 1: Original */}
                                <div style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                        Original
                                    </div>
                                    <div style={{ fontSize: '12px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                                        {bullet.original_text}
                                    </div>
                                </div>
                                
                                {/* Column 2: Veritas Transformed */}
                                <div style={{
                                    backgroundColor: 'rgba(37, 99, 235, 0.03)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: '1px solid rgba(37, 99, 235, 0.2)'
                                }}>
                                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#2563eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>✨ Veritas Optimized</span>
                                        {veritasImprovement > 0 && (
                                            <span style={{ fontSize: '10px', color: '#10b981' }}>+{veritasImprovement} pts</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', lineHeight: '1.4', marginBottom: '10px', color: 'var(--text-primary)' }}>
                                        {bullet.transformed_text || bullet.original_text}
                                    </div>
                                    {bullet.changes_made && bullet.changes_made.length > 0 && (
                                        <details style={{ marginTop: '8px' }}>
                                            <summary style={{ fontSize: '9px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                What changed
                                            </summary>
                                            <ul style={{ marginTop: '6px', paddingLeft: '16px', fontSize: '9px', color: 'var(--text-secondary)' }}>
                                                {bullet.changes_made.slice(0, 3).map((change, i) => (
                                                    <li key={i} style={{ marginBottom: '2px' }}>{change}</li>
                                                ))}
                                            </ul>
                                        </details>
                                    )}
                                    <button
                                        onClick={() => copyToClipboard(bullet.transformed_text || bullet.original_text, `${bullet.id}_veritas`)}
                                        style={{
                                            marginTop: '8px',
                                            padding: '3px 8px',
                                            background: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '9px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {copiedBulletId === `${bullet.id}_veritas` ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                </div>
                                
                                {/* Column 3: Hidden Brief Transformed */}
                                <div style={{
                                    backgroundColor: 'rgba(198, 164, 63, 0.03)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: bullet.hb_transformed_text ? '1px solid rgba(198, 164, 63, 0.3)' : '1px solid var(--border-light)'
                                }}>
                                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#c9a84c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>🕵️ Hidden Brief</span>
                                        {hasHBTransformation && hbImprovement > 0 && (
                                            <span style={{ fontSize: '10px', color: '#c9a84c' }}>+{hbImprovement} pts</span>
                                        )}
                                    </div>
                                    {bullet.hb_transformed_text ? (
                                        <>
                                            <div style={{ fontSize: '12px', lineHeight: '1.4', marginBottom: '10px', color: 'var(--text-primary)' }}>
                                                {bullet.hb_transformed_text}
                                            </div>
                                            {bullet.hb_changes_made && bullet.hb_changes_made.length > 0 && (
                                                <details style={{ marginTop: '8px' }}>
                                                    <summary style={{ fontSize: '9px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                        Hidden Brief changes
                                                    </summary>
                                                    <ul style={{ marginTop: '6px', paddingLeft: '16px', fontSize: '9px', color: 'var(--text-secondary)' }}>
                                                        {bullet.hb_changes_made.slice(0, 3).map((change, i) => (
                                                            <li key={i} style={{ marginBottom: '2px' }}>{change}</li>
                                                        ))}
                                                    </ul>
                                                </details>
                                            )}
                                            <button
                                                onClick={() => copyToClipboard(bullet.hb_transformed_text, `${bullet.id}_hb`)}
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '3px 8px',
                                                    background: '#c9a84c',
                                                    color: '#1a1f2e',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '9px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {copiedBulletId === `${bullet.id}_hb` ? '✓ Copied!' : '📋 Copy'}
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                            Click "Apply to Bullets" in the Hidden Brief card to generate
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Keywords Found/Missing (Comparison Mode) - show below columns */}
                            {isJDComparison && (bullet.jd_keywords_found?.length > 0 || bullet.jd_keywords_missing?.length > 0) && (
                                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-light)', fontSize: '10px' }}>
                                    {bullet.jd_keywords_found && bullet.jd_keywords_found.length > 0 && (
                                        <span style={{ color: '#10b981', marginRight: '16px' }}>
                                            ✅ Found: {bullet.jd_keywords_found.slice(0, 4).join(', ')}
                                            {bullet.jd_keywords_found.length > 4 && ` +${bullet.jd_keywords_found.length - 4}`}
                                        </span>
                                    )}
                                    {bullet.jd_keywords_missing && bullet.jd_keywords_missing.length > 0 && (
                                        <span style={{ color: '#ef4444' }}>
                                            ❌ Missing: {bullet.jd_keywords_missing.slice(0, 3).join(', ')}
                                            {bullet.jd_keywords_missing.length > 3 && ` +${bullet.jd_keywords_missing.length - 3}`}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {bulletAnalysis.overall_disclaimer && (
                <div style={{
                    marginTop: '20px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderLeft: '3px solid #f59e0b',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span>⚠️</span>
                        <strong>AI-Generated Suggestions</strong>
                    </div>
                    <p style={{ margin: 0 }}>{bulletAnalysis.overall_disclaimer}</p>
                </div>
            )}
        </div>
    );
}