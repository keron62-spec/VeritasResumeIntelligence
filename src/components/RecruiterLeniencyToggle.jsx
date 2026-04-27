import React from 'react';
import LeniencyDisclaimerModal from './LeniencyDisclaimerModal.jsx';

export default function RecruiterLeniencyToggle({ mode, setMode, showStrictTooltip }) {
    const [showDisclaimer, setShowDisclaimer] = React.useState(false);
    
    const modes = [
        { 
            value: 'lenient', 
            label: '🌱 Lenient', 
            description: 'Startups, NGOs, Small Business',
            color: '#10b981'
        },
        { 
            value: 'normal', 
            label: '📊 Normal', 
            description: 'Mid-size, Standard Corporate',
            color: '#64748b'
        },
        { 
            value: 'strict', 
            label: '⚡ Strict', 
            description: 'Tech, Finance, Healthcare',
            color: '#f59e0b'
        },
        { 
            value: 'very_strict', 
            label: '👑 Very Strict', 
            description: 'Fortune 500, Consulting, Elite',
            color: '#c41e3a'
        }
    ];
    
    const handleModeClick = (value) => {
        if (value === 'very_strict') {
            setShowDisclaimer(true);
        } else {
            setMode(value);
        }
    };
    
    const handleConfirmVeryStrict = () => {
        setShowDisclaimer(false);
        setMode('very_strict', true);
    };
    
    return (
        <>
            <div className="leniency-toggle" style={{ marginBottom: '24px' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}>
                    <div>
                        <span style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            Recruiter Leniency
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 'normal', 
                                color: 'var(--text-muted)' 
                            }}>
                                ⚡ Adjusts scoring strictness
                            </span>
                        </span>
                    </div>
                    
                    {/* Reset acknowledgment link - appears in Very Strict mode */}
                    {mode === 'very_strict' && (
                        <button
                            onClick={() => {
                                localStorage.removeItem('veritas_leniency_acknowledged_very_strict');
                                alert('Acknowledgment reset. Very Strict mode disclaimer will show again next time.');
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Reset Acknowledgment
                        </button>
                    )}
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    flexWrap: 'wrap',
                    position: 'relative'
                }}>
                    {modes.map(m => (
                        <button
                            key={m.value}
                            onClick={() => handleModeClick(m.value)}
                            className={`leniency-option ${mode === m.value ? 'active' : ''}`}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '40px',
                                border: mode === m.value 
                                    ? `1px solid ${m.color}` 
                                    : '1px solid var(--border-light)',
                                background: mode === m.value ? m.color : 'transparent',
                                color: mode === m.value ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: mode === m.value ? '600' : '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {m.label}
                            <span style={{ 
                                display: 'block', 
                                fontSize: '10px', 
                                opacity: mode === m.value ? 0.8 : 0.7,
                                marginTop: '2px'
                            }}>
                                {m.description}
                            </span>
                        </button>
                    ))}
                </div>
                
                {/* Strict Mode Tooltip */}
                {showStrictTooltip && (
                    <div style={{
                        position: 'absolute',
                        marginTop: '8px',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--accent-amber)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        maxWidth: '280px',
                        zIndex: 100,
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        ⚡ Strict mode simulates competitive industry standards. 
                        Scores will be 5-15% lower than Normal mode.
                    </div>
                )}
            </div>
            
            <LeniencyDisclaimerModal 
                mode="very_strict"
                onConfirm={handleConfirmVeryStrict}
                onCancel={() => setShowDisclaimer(false)}
            />
        </>
    );
}