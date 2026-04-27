import React from 'react';

export default function LeniencyDisclaimerModal({ onConfirm, onCancel }) {
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
            zIndex: 2000,
            padding: '20px'
        }}>
            <div className="very-strict-modal" style={{
                backgroundColor: '#fdfbf7',
                borderRadius: '8px',
                maxWidth: '560px',
                width: '100%',
                border: '1px solid #d1d1d1',
                boxShadow: 'none',
                fontFamily: "'Playfair Display', 'Times New Roman', serif"
            }}>
                <div style={{
                    padding: '32px 32px 24px',
                    borderBottom: '1px solid #d1d1d1'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                    }}>
                        <span style={{ fontSize: '32px' }}>👑</span>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#1a1a1a',
                            letterSpacing: '-0.01em',
                            margin: 0,
                            fontFamily: "inherit"
                        }}>
                            Very Strict Mode
                        </h2>
                    </div>
                    <p style={{
                        fontSize: '14px',
                        color: '#4a4a4a',
                        lineHeight: '1.5',
                        marginBottom: '8px'
                    }}>
                        Elite Recruiting Simulation
                    </p>
                </div>
                
                <div style={{ padding: '24px 32px' }}>
                    <p style={{
                        fontSize: '13px',
                        color: '#1a1a1a',
                        lineHeight: '1.6',
                        marginBottom: '20px'
                    }}>
                        This mode simulates hiring practices at <strong>Fortune 500 companies</strong>, 
                        top-tier consulting firms (<strong>McKinsey, BCG, Bain</strong>), investment banks 
                        (<strong>Goldman Sachs, JPMorgan</strong>), and elite law firms.
                    </p>
                    
                    <div style={{
                        backgroundColor: '#f5f3ef',
                        padding: '20px',
                        marginBottom: '20px',
                        borderLeft: '3px solid #c41e3a'
                    }}>
                        <p style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#c41e3a',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            What to expect:
                        </p>
                        <ul style={{
                            fontSize: '12px',
                            color: '#4a4a4a',
                            lineHeight: '1.8',
                            paddingLeft: '20px',
                            margin: 0
                        }}>
                            <li>Scores will be <strong>20-30% LOWER</strong> than Normal mode</li>
                            <li>Feedback will be <strong>direct, harsh, and uncompromising</strong></li>
                            <li>Minor gaps and missing keywords will be <strong>heavily penalized</strong></li>
                            <li>Elite university credentials provide scoring offsets</li>
                            <li>Executive-level candidates (9+ years) receive exceptions</li>
                        </ul>
                    </div>
                    
                    <div style={{
                        backgroundColor: '#fdfbf7',
                        padding: '16px',
                        border: '1px solid #e8e5df',
                        marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ fontSize: '20px' }}>⚠️</span>
                            <p style={{
                                fontSize: '11px',
                                color: '#6b6b6b',
                                lineHeight: '1.4',
                                margin: 0
                            }}>
                                <strong>This is not a bug.</strong> This is an accurate simulation of 
                                elite recruiting practices. Only use this mode if you are targeting 
                                top-tier employers.
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={onConfirm}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: '#1a1a1a',
                            color: '#fdfbf7',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            letterSpacing: '0.5px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                            fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#c41e3a'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#1a1a1a'}
                    >
                        I Understand - Proceed
                    </button>
                    
                    <button
                        onClick={onCancel}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'transparent',
                            color: '#6b6b6b',
                            border: '1px solid #d1d1d1',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                        }}
                    >
                        Cancel - Stay in Normal Mode
                    </button>
                </div>
            </div>
        </div>
    );
}