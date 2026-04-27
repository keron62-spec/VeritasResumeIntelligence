import React, { useState } from 'react';
import ATSEyeViewModal from './ATSEyeViewModal.jsx';

export default function ATSEyeViewWarning({ pdfIssues, pdfFile, onDismiss }) {
    const [showModal, setShowModal] = useState(false);
    
    if (!pdfIssues || pdfIssues.length === 0) return null;
    
    const criticalIssues = pdfIssues.filter(i => i.severity === 'critical');
    const hasCriticalIssues = criticalIssues.length > 0;
    
    if (!hasCriticalIssues) return null;
    
    return (
        <>
            <div className="ats-warning-banner" style={{
                backgroundColor: 'rgba(225, 29, 72, 0.1)',
                border: '1px solid var(--accent-rose)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '28px' }}>⚠️</span>
                    <div>
                        <h3 style={{ color: 'var(--accent-rose)', marginBottom: '4px' }}>
                            ATS Compatibility Warning
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Your PDF has issues that could cause rejection by Applicant Tracking Systems.
                        </p>
                    </div>
                </div>
                
                {criticalIssues.map((issue, i) => (
                    <div key={i} style={{ fontSize: '13px', paddingLeft: '20px', marginBottom: '8px' }}>
                        • {issue.message}
                        {issue.location && <span style={{ color: 'var(--text-muted)' }}> ({issue.location})</span>}
                    </div>
                ))}
                
                <details style={{ marginTop: '16px' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--accent-blue)', fontSize: '13px' }}>
                        How to fix your PDF
                    </summary>
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '12px', marginBottom: '8px' }}><strong>Option 1:</strong> Export from Microsoft Word as PDF (Best for electronic distribution)</p>
                        <p style={{ fontSize: '12px', marginBottom: '8px' }}><strong>Option 2:</strong> Use Adobe Acrobat → Export PDF → Microsoft Word, then re-export</p>
                        <p style={{ fontSize: '12px' }}><strong>Option 3:</strong> Use <a href="https://createfreecv.com" target="_blank" rel="noopener noreferrer">createfreecv.com</a> for a clean ATS-friendly PDF</p>
                    </div>
                </details>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            background: 'var(--accent-blue)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        👁️ View ATS Eye View
                    </button>
                    <button
                        onClick={onDismiss}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-light)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
            
            {showModal && (
                <ATSEyeViewModal 
                    pdfFile={pdfFile}
                    pdfIssues={pdfIssues}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}