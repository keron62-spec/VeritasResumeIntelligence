import React, { useState } from 'react';

export default function BulletAnalyzer({ bulletAnalysis, isComparisonMode }) {
    const [expandedBullet, setExpandedBullet] = useState(null);
    const [copiedBulletId, setCopiedBulletId] = useState(null);
    
    // ADDED: Sort controls state
    const [sortBy, setSortBy] = useState('score_asc'); // default: weakest first
    const [scoreVersion, setScoreVersion] = useState('original'); // 'original' | 'veritas' | 'hidden_brief'
    
    // Check if bulletAnalysis exists and has data
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
    
    // ADDED: Helper to get score value based on selected version
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
    
    // ADDED: Helper to get label based on selected version
    const getScoreLabelForVersion = (bullet, version) => {
        const score = getScoreValue(bullet, version);
        if (version === 'veritas' && bullet.transformed_label) return bullet.transformed_label;
        if (version === 'hidden_brief' && bullet.hb_label) return bullet.hb_label;
        return getScoreLabel(score);
    };
    
    // ADDED: Sorting function with multiple sort options
    const getSortedBullets = (bullets, sortByVal, version) => {
        const bulletsCopy = [...bullets];
        
        switch(sortByVal) {
            case 'score_asc':
                return bulletsCopy.sort((a, b) => getScoreValue(a, version) - getScoreValue(b, version));
            case 'score_desc':
                return bulletsCopy.sort((a, b) => getScoreValue(b, version) - getScoreValue(a, version));
            case 'company_asc':
                return bulletsCopy.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
            case 'company_desc':
                return bulletsCopy.sort((a, b) => (b.company || '').localeCompare(a.company || ''));
            case 'role_asc':
                return bulletsCopy.sort((a, b) => (a.role || '').localeCompare(b.role || ''));
            case 'role_desc':
                return bulletsCopy.sort((a, b) => (b.role || '').localeCompare(a.role || ''));
            case 'section':
                const sectionOrder = { 
                    'Work Experience': 1, 
                    'Projects': 2, 
                    'Leadership': 3, 
                    'Volunteer Experience': 4, 
                    'Volunteer': 4,
                    'Internships': 5,
                    'Education': 6,
                    'Skills': 7,
                    'Other': 99 
                };
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
    
    // ADDED: Sort options array
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
    
    // ADDED: Score version options
    const scoreVersionOptions = [
        { value: 'original', label: 'Original Score', icon: '📊' },
        { value: 'veritas', label: 'Veritas Score', icon: '✨' },
        { value: 'hidden_brief', label: 'Hidden Brief Score', icon: '🕵️' }
    ];
    
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
    
    // ADDED: Check if hidden brief data exists in any bullet
    const hasHiddenBriefData = bulletAnalysis.bullets?.some(b => b.hb_score !== undefined || b.hb_transformed_text);
    
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
                
                {/* DISCLAIMER - Show in ALL modes, not just comparison */}
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
    
    // ADDED: Apply sorting to bullets
    const sortedBullets = getSortedBullets(bulletAnalysis.bullets, sortBy, scoreVersion);
    
    // ADDED: Get active sort display text for chip
    const getSortDisplayText = () => {
        switch(sortBy) {
            case 'score_asc': return '📈 Weakest first';
            case 'score_desc': return '📉 Strongest first';
            case 'company_asc': return '🏢 A-Z';
            case 'company_desc': return '🏢 Z-A';
            case 'role_asc': return '💼 A-Z';
            case 'role_desc': return '💼 Z-A';
            case 'section': return '📂 By section';
            case 'improvement_delta': return '✨ Biggest Veritas gain';
            case 'hb_improvement': return '🕵️ Biggest HB gain';
            default: return '📋 Original order';
        }
    };
    
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
            
            {/* DISCLAIMER - Show in ALL modes */}
            {bulletAnalysis.overall_disclaimer && (
                <div style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderLeft: '3px solid #f59e0b',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
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
                    <span style={{ color: '#10b981' }}>🚀 Average Optimized: <strong>{bulletAnalysis.average_transformed_score}</strong>/100 (+{Math.round(bulletAnalysis.average_transformed_score - (bulletAnalysis.average_original_score || bulletAnalysis.average_score))})</span>
                )}
                <span>🔍 Bullets Assessed: <strong>{bulletAnalysis.bullets_assessed}</strong></span>
            </div>
            
            {/* ADDED: Sort Controls */}
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
                    {/* Score version selector - only show if hidden brief data exists */}
                    {hasHiddenBriefData && (
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
                                            backgroundColor: scoreVersion === opt.value ? 
                                                (opt.value === 'hidden_brief' ? '#c9a84c' : '#2563eb') : 
                                                'transparent',
                                            color: scoreVersion === opt.value ? '#fff' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {opt.icon} {opt.value === 'hidden_brief' ? 'HB' : opt.value === 'veritas' ? 'VT' : 'OG'}
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
                                // Show HB-specific options only if HB data exists
                                if ((opt.value === 'hb_improvement') && !hasHiddenBriefData) {
                                    return null;
                                }
                                return (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
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
                        {getSortDisplayText()}
                    </div>
                </div>
            </div>
            
            {/* Bullet List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedBullets.map((bullet, idx) => {
                    // ADDED: Get score based on selected version
                    const currentScore = getScoreValue(bullet, scoreVersion);
                    const currentLabel = getScoreLabelForVersion(bullet, scoreVersion);
                    const scoreColor = getScoreColor(currentScore);
                    
                    // Original values for comparison
                    const originalScore = bullet.original_score;
                    const transformedScore = bullet.transformed_score;
                    const hbScore = bullet.hb_score;
                    const hasVeritasTransformation = bullet.transformed_text && bullet.transformed_text !== bullet.original_text;
                    const hasHBTransformation = bullet.hb_transformed_text && bullet.hb_transformed_text !== bullet.original_text;
                    const improvementDelta = bullet.improvement_delta || (transformedScore - originalScore);
                    
                    return (
                        <div key={bullet.id} style={{
                            border: `1px solid ${scoreColor}`,
                            borderRadius: '8px',
                            padding: '12px',
                            backgroundColor: originalScore < 50 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-tertiary)'
                        }}>
                            {/* Header with ID and Score - UPDATED to show current version score */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {bullet.id}
                                    {scoreVersion !== 'original' && (
                                        <span style={{ 
                                            marginLeft: '6px', 
                                            fontSize: '9px', 
                                            padding: '1px 4px', 
                                            backgroundColor: scoreVersion === 'hidden_brief' ? 'rgba(198, 164, 63, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                                            borderRadius: '4px',
                                            color: scoreVersion === 'hidden_brief' ? '#c9a84c' : '#2563eb'
                                        }}>
                                            {scoreVersion === 'hidden_brief' ? 'HB' : 'VT'}
                                        </span>
                                    )}
                                </div>
                                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                    <div style={{ fontSize: '24px', fontWeight: '600', color: scoreColor }}>
                                        {currentScore}
                                    </div>
                                    <div style={{ fontSize: '10px', color: scoreColor }}>
                                        {currentLabel}
                                    </div>
                                </div>
                            </div>
                            
                            {/* SECTION CONTEXT - NEW: Company, Role, Section Display */}
                            {(bullet.company || bullet.role || bullet.section) && (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                    marginBottom: '10px',
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
                            
                            {/* Original Bullet Text */}
                            <div style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '8px', color: 'var(--text-primary)' }}>
                                {bullet.original_text}
                            </div>
                            
                            {/* Keywords Found/Missing (Comparison Mode) */}
                            {isJDComparison && bullet.jd_keywords_found && (
                                <div style={{ marginBottom: '6px' }}>
                                    {bullet.jd_keywords_found.length > 0 && (
                                        <span style={{ fontSize: '10px', color: '#10b981', marginRight: '12px' }}>
                                            ✅ Found: {bullet.jd_keywords_found.join(', ')}
                                        </span>
                                    )}
                                    {bullet.jd_keywords_missing && bullet.jd_keywords_missing.length > 0 && (
                                        <span style={{ fontSize: '10px', color: '#ef4444' }}>
                                            ❌ Missing: {bullet.jd_keywords_missing.slice(0, 3).join(', ')}
                                            {bullet.jd_keywords_missing.length > 3 && '...'}
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            {/* Score Comparison (if transformed) - UPDATED to show multiple versions */}
                            {(hasVeritasTransformation || hasHBTransformation) && (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '16px', 
                                    marginBottom: '10px',
                                    padding: '8px 0',
                                    fontSize: '11px',
                                    borderTop: '1px dashed var(--border-light)',
                                    borderBottom: '1px dashed var(--border-light)',
                                    flexWrap: 'wrap'
                                }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Original: <strong style={{ color: getScoreColor(originalScore) }}>{originalScore}</strong></span>
                                    {hasVeritasTransformation && (
                                        <>
                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                            <span style={{ color: 'var(--text-muted)' }}>Veritas: <strong style={{ color: getScoreColor(transformedScore) }}>{transformedScore}</strong></span>
                                            {improvementDelta > 0 && <span style={{ color: '#10b981' }}>+{improvementDelta}</span>}
                                        </>
                                    )}
                                    {hasHBTransformation && bullet.hb_score && (
                                        <>
                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                            <span style={{ color: 'var(--text-muted)' }}>HB: <strong style={{ color: getScoreColor(bullet.hb_score) }}>{bullet.hb_score}</strong></span>
                                            {bullet.hb_improvement_delta > 0 && <span style={{ color: '#c9a84c' }}>+{bullet.hb_improvement_delta}</span>}
                                        </>
                                    )}
                                </div>
                            )}
                            
                            {/* VERITAS TRANSFORMATION SECTION - Shows for bullets with Veritas transformed_text */}
                            {hasVeritasTransformation && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #10b981'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                        <strong style={{ fontSize: '12px' }}>
                                            {isJDComparison ? '✏️ JD-Optimized Version' : '✏️ Suggested Rewrite (Veritas)'}
                                        </strong>
                                        {improvementDelta !== undefined && improvementDelta !== 0 && (
                                            <span style={{ 
                                                fontSize: '11px', 
                                                color: improvementDelta > 0 ? '#10b981' : '#ef4444',
                                                fontWeight: '600'
                                            }}>
                                                {improvementDelta > 0 ? `+${improvementDelta}` : improvementDelta} point improvement
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Transformed Bullet Text */}
                                    <div style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '10px', fontWeight: '500' }}>
                                        {bullet.transformed_text}
                                    </div>
                                    
                                    {/* Changes Made */}
                                    {bullet.changes_made && bullet.changes_made.length > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                                                What changed:
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                {bullet.changes_made.slice(0, 4).map((change, i) => (
                                                    <li key={i} style={{ marginBottom: '2px' }}>{change}</li>
                                                ))}
                                                {bullet.changes_made.length > 4 && (
                                                    <li style={{ color: 'var(--text-muted)' }}>+{bullet.changes_made.length - 4} more improvements</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {/* Copy Button */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <button
                                            onClick={() => copyToClipboard(bullet.transformed_text, `${bullet.id}_vt`)}
                                            style={{
                                                padding: '4px 10px',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {copiedBulletId === `${bullet.id}_vt` ? '✓ Copied!' : '📋 Copy to Clipboard'}
                                        </button>
                                        {bullet.confidence && (
                                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                                AI Confidence: {Math.round(bullet.confidence * 100)}%
                                            </span>
                                        )}
                                        {bullet.preserves_truth && (
                                            <span style={{ fontSize: '9px', color: '#10b981', alignSelf: 'center' }}>
                                                ✓ Preserves original truth
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* ADDED: HIDDEN BRIEF TRANSFORMATION SECTION - Shows for bullets with HB transformed_text */}
                            {hasHBTransformation && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '12px',
                                    backgroundColor: 'rgba(198, 164, 63, 0.1)',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #c9a84c'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                        <strong style={{ fontSize: '12px' }}>
                                            🕵️ Hidden Brief Version (Insider Intelligence)
                                        </strong>
                                        {bullet.hb_improvement_delta !== undefined && bullet.hb_improvement_delta !== 0 && (
                                            <span style={{ 
                                                fontSize: '11px', 
                                                color: bullet.hb_improvement_delta > 0 ? '#c9a84c' : '#ef4444',
                                                fontWeight: '600'
                                            }}>
                                                {bullet.hb_improvement_delta > 0 ? `+${bullet.hb_improvement_delta}` : bullet.hb_improvement_delta} point improvement
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* HB Transformed Bullet Text */}
                                    <div style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '10px', fontWeight: '500' }}>
                                        {bullet.hb_transformed_text}
                                    </div>
                                    
                                    {/* HB Changes Made */}
                                    {bullet.hb_changes_made && bullet.hb_changes_made.length > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: '#c9a84c' }}>
                                                What hidden brief changed:
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                {bullet.hb_changes_made.slice(0, 4).map((change, i) => (
                                                    <li key={i} style={{ marginBottom: '2px' }}>{change}</li>
                                                ))}
                                                {bullet.hb_changes_made.length > 4 && (
                                                    <li style={{ color: 'var(--text-muted)' }}>+{bullet.hb_changes_made.length - 4} more improvements</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {/* HB Insight Note */}
                                    {bullet.hb_insight_note && (
                                        <div style={{ 
                                            marginBottom: '8px', 
                                            fontSize: '10px', 
                                            color: '#c9a84c',
                                            fontStyle: 'italic',
                                            padding: '4px 0'
                                        }}>
                                            💡 {bullet.hb_insight_note}
                                        </div>
                                    )}
                                    
                                    {/* HB Copy Button */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <button
                                            onClick={() => copyToClipboard(bullet.hb_transformed_text, `${bullet.id}_hb`)}
                                            style={{
                                                padding: '4px 10px',
                                                background: '#c9a84c',
                                                color: '#1a1f2e',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            {copiedBulletId === `${bullet.id}_hb` ? '✓ Copied!' : '📋 Copy Hidden Brief Version'}
                                        </button>
                                        {bullet.hb_confidence && (
                                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                                HB Confidence: {Math.round(bullet.hb_confidence * 100)}%
                                            </span>
                                        )}
                                        {bullet.hb_preserves_truth !== false && (
                                            <span style={{ fontSize: '9px', color: '#c9a84c', alignSelf: 'center' }}>
                                                ✓ Preserves original truth
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Score Breakdown (Expandable) - UPDATED to show selected version scores */}
                            <details style={{ marginTop: '8px' }}>
                                <summary style={{ fontSize: '10px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    Show score breakdown {scoreVersion !== 'original' && `(${scoreVersion === 'hidden_brief' ? 'Hidden Brief' : 'Veritas'} scores)`}
                                </summary>
                                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10px' }}>
                                    {scoreVersion === 'hidden_brief' && bullet.hb_scores ? (
                                        Object.entries(bullet.hb_scores).map(([key, value]) => {
                                            let max = 25;
                                            if (key === 'keyword_match') max = 35;
                                            else if (key === 'verb_alignment') max = 20;
                                            else if (key === 'outcome_relevance') max = 20;
                                            else if (key === 'level_match') max = 15;
                                            else if (key === 'industry_match') max = 10;
                                            
                                            return (
                                                <div key={key} style={{ 
                                                    backgroundColor: 'rgba(198, 164, 63, 0.1)', 
                                                    padding: '2px 6px', 
                                                    borderRadius: '4px' 
                                                }}>
                                                    {key.replace(/_/g, ' ')}: {value}/{max}
                                                </div>
                                            );
                                        })
                                    ) : scoreVersion === 'veritas' && bullet.scores ? (
                                        Object.entries(bullet.scores).map(([key, value]) => {
                                            let max = 25;
                                            if (key === 'keyword_match') max = 35;
                                            else if (key === 'verb_alignment') max = 20;
                                            else if (key === 'outcome_relevance') max = 20;
                                            else if (key === 'level_match') max = 15;
                                            else if (key === 'industry_match') max = 10;
                                            
                                            return (
                                                <div key={key} style={{ 
                                                    backgroundColor: 'var(--bg-secondary)', 
                                                    padding: '2px 6px', 
                                                    borderRadius: '4px' 
                                                }}>
                                                    {key.replace(/_/g, ' ')}: {value}/{max}
                                                </div>
                                            );
                                        })
                                    ) : bullet.scores ? (
                                        Object.entries(bullet.scores).map(([key, value]) => {
                                            let max = 25;
                                            if (key === 'keyword_match') max = 35;
                                            else if (key === 'verb_alignment') max = 20;
                                            else if (key === 'outcome_relevance') max = 20;
                                            else if (key === 'level_match') max = 15;
                                            else if (key === 'industry_match') max = 10;
                                            
                                            return (
                                                <div key={key} style={{ 
                                                    backgroundColor: 'var(--bg-secondary)', 
                                                    padding: '2px 6px', 
                                                    borderRadius: '4px' 
                                                }}>
                                                    {key.replace(/_/g, ' ')}: {value}/{max}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            Score details not available for this version
                                        </div>
                                    )}
                                </div>
                            </details>
                        </div>
                    );
                })}
            </div>
            
            {/* Weakest First Note - UPDATED to reflect current sort */}
            {sortBy === 'score_asc' && bulletAnalysis.weakest_first && bulletAnalysis.weakest_first.length > 0 && (
                <div style={{
                    marginTop: '16px',
                    padding: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                }}>
                    💡 Weakest bullets shown first (based on {scoreVersion === 'hidden_brief' ? 'Hidden Brief scores' : scoreVersion === 'veritas' ? 'Veritas scores' : 'original scores'}). Focus on improving the ones at the top.
                </div>
            )}
        </div>
    );
}