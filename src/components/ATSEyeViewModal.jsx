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
    
    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-light)'
                }}>
                    <h3>👁️ ATS Eye View</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>
                
                {loading && <div style={{ padding: '40px', textAlign: 'center' }}>Loading ATS view...</div>}
                
                {error && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent-rose)' }}>Error: {error}</div>}
                
                {atsData && (
                    <div style={{ padding: '20px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>📋 Issues Found ({pdfIssues?.length || 0})</h4>
                            {pdfIssues?.filter(i => i.severity === 'critical').map((issue, i) => (
                                <div key={i} style={{ fontSize: '12px', padding: '8px', background: 'rgba(225,29,72,0.1)', marginBottom: '4px', borderRadius: '4px' }}>
                                    🔴 {issue.message}
                                </div>
                            ))}
                        </div>
                        
                        <div>
                            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>🤖 What ATS Reads (Cleaned)</h4>
                            <pre style={{
                                background: 'var(--bg-tertiary)',
                                padding: '12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                whiteSpace: 'pre-wrap',
                                maxHeight: '300px',
                                overflow: 'auto'
                            }}>
                                {atsData.cleaned_text?.substring(0, 3000)}...
                            </pre>
                        </div>
                        
                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={copyToClipboard} style={{ padding: '8px 16px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                📋 Copy Cleaned Text
                            </button>
                            <a href="https://createfreecv.com" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
                                ✨ Create Clean PDF
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}