import React, { useState, useEffect } from 'react';

export default function ATSEyeViewModal({ pdfFile, pdfIssues, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [atsData, setAtsData] = useState(null);
    
    useEffect(() => {
        const fetchATSView = async () => {
            try {
                setLoading(true);
                const formData = new FormData();
                formData.append('file', pdfFile);
                
                const response = await fetch('https://ats-parser.keron62.workers.dev/ats-eye-view', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (!data.success) throw new Error(data.error || 'Failed to get ATS view');
                setAtsData(data);
            } catch (err) {
                console.error('ATS Eye View error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        if (pdfFile) fetchATSView();
    }, [pdfFile]);
    
    const copyToClipboard = () => {
        if (atsData?.cleaned_text) {
            navigator.clipboard.writeText(atsData.cleaned_text);
            alert('Cleaned text copied to clipboard!');
        }
    };
    
    const copyRawToClipboard = () => {
        if (atsData?.original_text) {
            navigator.clipboard.writeText(atsData.original_text);
            alert('Raw text copied to clipboard!');
        }
    };
    
    // Helper to highlight issues in the raw ATS view text
    const renderHighlightedText = () => {
        if (!atsData?.ats_view) return <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', margin: 0 }}>{atsData?.original_text || 'No text available'}</pre>;
        
        let text = atsData.ats_view;
        const highlights = [];
        
        // Find and mark header text
        const headerMatch = text.match(/\[HEADER:[^\]]+\]/g);
        if (headerMatch) {
            headerMatch.forEach(match => {
                const index = text.indexOf(match);
                highlights.push({ text: match, type: 'header', start: index, end: index + match.length });
            });
        }
        
        // Find pagination markers
        const paginationMatch = text.match(/\[PAGINATION MARKER\]/g);
        if (paginationMatch) {
            paginationMatch.forEach(match => {
                const index = text.indexOf(match);
                highlights.push({ text: match, type: 'pagination', start: index, end: index + match.length });
            });
        }
        
        // Find non-printable markers
        const nonPrintableMatch = text.match(/\[NON-PRINTABLE\]/g);
        if (nonPrintableMatch) {
            nonPrintableMatch.forEach(match => {
                const index = text.indexOf(match);
                highlights.push({ text: match, type: 'nonprintable', start: index, end: index + match.length });
            });
        }
        
        // If no highlights, return plain text
        if (highlights.length === 0) {
            return <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', margin: 0, fontFamily: 'monospace' }}>{text}</pre>;
        }
        
        // Build highlighted text
        let lastIndex = 0;
        const elements = [];
        
        highlights.sort((a, b) => a.start - b.start).forEach((highlight, idx) => {
            if (highlight.start > lastIndex) {
                elements.push(<span key={`text-${idx}`}>{text.substring(lastIndex, highlight.start)}</span>);
            }
            
            let style = {
                backgroundColor: 'rgba(225, 29, 72, 0.2)',
                color: 'var(--accent-rose)',
                fontWeight: 'bold',
                padding: '2px 4px',
                borderRadius: '4px',
                cursor: 'pointer'
            };
            
            let title = '';
            if (highlight.type === 'header') {
                title = 'Header text detected - ATS may ignore this content';
                style.backgroundColor = 'rgba(225, 29, 72, 0.2)';
                style.color = 'var(--accent-rose)';
            } else if (highlight.type === 'pagination') {
                title = 'Pagination marker detected - should be removed';
                style.backgroundColor = 'rgba(217, 119, 6, 0.2)';
                style.color = 'var(--accent-amber)';
            } else if (highlight.type === 'nonprintable') {
                title = 'Non-printable character detected - may cause parsing errors';
                style.backgroundColor = 'rgba(217, 119, 6, 0.2)';
                style.color = 'var(--accent-amber)';
            }
            
            elements.push(
                <span key={`highlight-${idx}`} style={style} title={title}>
                    {highlight.text}
                </span>
            );
            
            lastIndex = highlight.end;
        });
        
        if (lastIndex < text.length) {
            elements.push(<span key="text-last">{text.substring(lastIndex)}</span>);
        }
        
        return <div style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.5', fontFamily: 'monospace' }}>{elements}</div>;
    };
    
    // Group issues by severity
    const criticalIssues = pdfIssues?.filter(i => i.severity === 'critical') || [];
    const highIssues = pdfIssues?.filter(i => i.severity === 'high') || [];
    const mediumIssues = pdfIssues?.filter(i => i.severity === 'medium') || [];
    const infoIssues = pdfIssues?.filter(i => i.severity === 'info') || [];
    
    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border-light)',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--bg-secondary)',
                    zIndex: 10
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        👁️ ATS Eye View
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '28px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)'
                    }}>×</button>
                </div>
                
                {loading && (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                        <p>Analyzing your PDF for ATS compatibility...</p>
                    </div>
                )}
                
                {error && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-rose)' }}>
                        <p>Error: {error}</p>
                        <button onClick={onClose} style={{ marginTop: '20px', padding: '8px 16px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Close
                        </button>
                    </div>
                )}
                
                {atsData && !loading && (
                    <>
                        {/* Issues Summary Bar */}
                        {(criticalIssues.length > 0 || highIssues.length > 0 || mediumIssues.length > 0) && (
                            <div style={{
                                padding: '16px 24px',
                                backgroundColor: 'rgba(225, 29, 72, 0.08)',
                                borderBottom: '1px solid var(--border-light)'
                            }}>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', fontSize: '14px' }}>⚠️ Issues Detected:</span>
                                    {criticalIssues.length > 0 && <span style={{ color: 'var(--accent-rose)', fontSize: '13px' }}>🔴 {criticalIssues.length} Critical</span>}
                                    {highIssues.length > 0 && <span style={{ color: 'var(--accent-rose)', fontSize: '13px' }}>🟠 {highIssues.length} High</span>}
                                    {mediumIssues.length > 0 && <span style={{ color: 'var(--accent-amber)', fontSize: '13px' }}>🟡 {mediumIssues.length} Medium</span>}
                                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>📄 {atsData.pages || 1} page(s)</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Side-by-side comparison */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            padding: '24px'
                        }}>
                            {/* Left Column: What ATS actually extracts (raw with issues) */}
                            <div style={{
                                border: '1px solid var(--border-light)',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--border-light)',
                                    fontWeight: '600',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }}>
                                    <span>🔍 WHAT ATS EXTRACTS (Raw)</span>
                                    <span style={{ fontSize: '11px', color: 'var(--accent-rose)' }}>⚠️ Issues highlighted</span>
                                </div>
                                <div style={{
                                    padding: '16px',
                                    maxHeight: '500px',
                                    overflow: 'auto',
                                    backgroundColor: 'var(--bg-secondary)'
                                }}>
                                    {renderHighlightedText()}
                                    {!atsData.ats_view && (
                                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', margin: 0, fontFamily: 'monospace' }}>
                                            {atsData.original_text?.substring(0, 5000) || 'No text extracted'}
                                        </pre>
                                    )}
                                </div>
                                <div style={{
                                    padding: '12px 16px',
                                    borderTop: '1px solid var(--border-light)',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}>
                                    <button onClick={copyRawToClipboard} style={{
                                        padding: '6px 12px',
                                        background: 'transparent',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        📋 Copy Raw Text
                                    </button>
                                </div>
                            </div>
                            
                            {/* Right Column: Cleaned version (what ATS should read) */}
                            <div style={{
                                border: '1px solid var(--border-light)',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--border-light)',
                                    fontWeight: '600',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }}>
                                    <span>✅ CLEANED VERSION (Fixed)</span>
                                    <span style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>Ready for ATS</span>
                                </div>
                                <div style={{
                                    padding: '16px',
                                    maxHeight: '500px',
                                    overflow: 'auto',
                                    backgroundColor: 'var(--bg-secondary)',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {atsData.cleaned_text ? (
                                        atsData.cleaned_text.substring(0, 5000)
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No cleaned version available - your PDF may not have issues</span>
                                    )}
                                    {atsData.cleaned_text?.length > 5000 && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '8px' }}>
                                            ... (truncated, {atsData.cleaned_text.length - 5000} more characters)
                                        </span>
                                    )}
                                </div>
                                <div style={{
                                    padding: '12px 16px',
                                    borderTop: '1px solid var(--border-light)',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}>
                                    <button onClick={copyToClipboard} style={{
                                        padding: '6px 12px',
                                        background: 'var(--accent-blue)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        color: 'white'
                                    }}>
                                        📋 Copy Cleaned Text
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Detailed Issues List */}
                        {(criticalIssues.length > 0 || highIssues.length > 0 || mediumIssues.length > 0) && (
                            <div style={{
                                padding: '20px 24px',
                                borderTop: '1px solid var(--border-light)',
                                backgroundColor: 'var(--bg-tertiary)'
                            }}>
                                <h3 style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>📋 Detailed Issues & Fixes</h3>
                                
                                {criticalIssues.map((issue, i) => (
                                    <div key={`critical-${i}`} style={{
                                        marginBottom: '12px',
                                        padding: '12px',
                                        backgroundColor: 'rgba(225, 29, 72, 0.1)',
                                        borderRadius: '8px',
                                        borderLeft: `3px solid var(--accent-rose)`
                                    }}>
                                        <div style={{ fontWeight: '600', color: 'var(--accent-rose)', marginBottom: '4px' }}>🔴 {issue.type?.toUpperCase().replace(/_/g, ' ') || 'Critical Issue'}</div>
                                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>{issue.message}</div>
                                        {issue.location && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 Location: {issue.location}</div>}
                                        {issue.fix && <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '6px' }}>💡 Fix: {issue.fix}</div>}
                                    </div>
                                ))}
                                
                                {highIssues.map((issue, i) => (
                                    <div key={`high-${i}`} style={{
                                        marginBottom: '12px',
                                        padding: '12px',
                                        backgroundColor: 'rgba(225, 29, 72, 0.05)',
                                        borderRadius: '8px',
                                        borderLeft: `3px solid var(--accent-rose)`
                                    }}>
                                        <div style={{ fontWeight: '600', color: 'var(--accent-rose)', marginBottom: '4px' }}>🟠 {issue.type?.toUpperCase().replace(/_/g, ' ') || 'High Priority'}</div>
                                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>{issue.message}</div>
                                        {issue.fix && <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '6px' }}>💡 Fix: {issue.fix}</div>}
                                    </div>
                                ))}
                                
                                {mediumIssues.map((issue, i) => (
                                    <div key={`medium-${i}`} style={{
                                        marginBottom: '12px',
                                        padding: '12px',
                                        backgroundColor: 'rgba(217, 119, 6, 0.1)',
                                        borderRadius: '8px',
                                        borderLeft: `3px solid var(--accent-amber)`
                                    }}>
                                        <div style={{ fontWeight: '600', color: 'var(--accent-amber)', marginBottom: '4px' }}>🟡 {issue.type?.toUpperCase().replace(/_/g, ' ') || 'Medium Priority'}</div>
                                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>{issue.message}</div>
                                        {issue.fix && <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '6px' }}>💡 Fix: {issue.fix}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Action Buttons Footer */}
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid var(--border-light)',
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <a href="https://createfreecv.com" target="_blank" rel="noopener noreferrer" style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    ✨ Create Clean PDF (Free)
                                </a>
                                <button
                                    onClick={() => window.open('https://createfreecv.com', '_blank')}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'transparent',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    📄 Fix with Microsoft Word Guide
                                </button>
                            </div>
                            
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                💎 <strong>Veritas Premium (Coming Soon)</strong> - One-click PDF cleaning
                            </div>
                        </div>
                        
                        {/* Tip Footer */}
                        <div style={{
                            padding: '12px 24px',
                            borderTop: '1px solid var(--border-light)',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--bg-tertiary)',
                            textAlign: 'center'
                        }}>
                            💡 Tip: Always export PDFs as "Standard" or "Print" quality, not "Minimum Size". 
                            Avoid Canva, Novoresume, and other design tools that inject code into your PDF.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}