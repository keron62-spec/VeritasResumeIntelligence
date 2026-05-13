import React, { useState } from 'react';

export default function HermesModelToggle({ modelType, setModelType, isComparisonMode }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipContent, setTooltipContent] = useState('');
    
    // modelType can be: 'gemini' or 'hermes'
    
    const getGeminiIcon = () => '✨';
    const getHermesIcon = () => '🤖';
    
    const getGeminiLabel = () => 'Gemini';
    const getHermesLabel = () => 'Hermes';
    
    const getGeminiDescription = () => 'Google Gemini 3.1 Flash Lite with 4-model failover';
    const getHermesDescription = () => 'Nous Research Hermes 3 405B via OpenRouter';
    
    const getGeminiColor = () => '#4285f4';
    const getHermesColor = () => '#c9a84c';
    
    const toggleModel = () => {
        setModelType(modelType === 'gemini' ? 'hermes' : 'gemini');
    };
    
    const handleMouseEnter = (content) => {
        setTooltipContent(content);
        setShowTooltip(true);
    };
    
    const handleMouseLeave = () => {
        setShowTooltip(false);
    };
    
    // Fallback chain for Hermes mode
    const fallbackChain = [
        { icon: '🤖', name: 'Hermes 405B', tier: 'Primary', color: '#c9a84c' },
        { icon: '🦙', name: 'Meta Llama 70B', tier: 'Fallback 1', color: '#f59e0b' },
        { icon: '🦒', name: 'GPT-OSS 120B', tier: 'Fallback 2', color: '#10b981' }
    ];
    
    return (
        <div className="hermes-model-toggle-container" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
        }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🤖</span> AI Model
                <span style={{ fontSize: '10px', color: 'var(--accent-amber)' }}>
                    {isComparisonMode ? '(Comparison Mode)' : '(Resume Analysis)'}
                </span>
            </div>
            
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '6px 16px',
                borderRadius: '40px',
                border: '1px solid var(--border-light)'
            }}>
                {/* Gemini Option */}
                <div 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 12px',
                        borderRadius: '32px',
                        backgroundColor: modelType === 'gemini' ? `rgba(66, 133, 244, 0.15)` : 'transparent',
                        cursor: 'pointer',
                        opacity: modelType === 'gemini' ? 1 : 0.7
                    }}
                    onClick={() => modelType !== 'gemini' && toggleModel()}
                    onMouseEnter={() => handleMouseEnter(`${getGeminiIcon()} ${getGeminiLabel()} - ${getGeminiDescription()}`)}
                    onMouseLeave={handleMouseLeave}
                >
                    <span style={{ fontSize: '20px' }}>{getGeminiIcon()}</span>
                    <span style={{ 
                        fontSize: '13px', 
                        fontWeight: modelType === 'gemini' ? '600' : '400',
                        color: modelType === 'gemini' ? getGeminiColor() : 'var(--text-muted)'
                    }}>
                        {getGeminiLabel()}
                    </span>
                </div>
                
                {/* Slider/Toggle */}
                <button
                    onClick={toggleModel}
                    onMouseEnter={() => handleMouseEnter(
                        modelType === 'gemini' 
                            ? 'Switch to Hermes 405B (OpenRouter with fallback chain)'
                            : 'Switch to Gemini (Direct Google API)'
                    )}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        width: '48px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: modelType === 'hermes' ? getHermesColor() : getGeminiColor(),
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        padding: '2px'
                    }}
                >
                    <span style={{
                        display: 'block',
                        width: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        backgroundColor: 'white',
                        transform: modelType === 'hermes' ? 'translateX(24px)' : 'translateX(0)',
                        transition: 'transform 0.2s ease'
                    }} />
                </button>
                
                {/* Hermes Option with Fallback Chain */}
                <div 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 12px',
                        borderRadius: '32px',
                        backgroundColor: modelType === 'hermes' ? `rgba(201, 168, 76, 0.15)` : 'transparent',
                        cursor: 'pointer',
                        opacity: modelType === 'hermes' ? 1 : 0.7
                    }}
                    onClick={() => modelType !== 'hermes' && toggleModel()}
                    onMouseEnter={() => handleMouseEnter(
                        `${getHermesIcon()} ${getHermesLabel()} - ${getHermesDescription()}\nFallback: Hermes → Llama → GPT-OSS`
                    )}
                    onMouseLeave={handleMouseLeave}
                >
                    <span style={{ fontSize: '20px' }}>{getHermesIcon()}</span>
                    <span style={{ 
                        fontSize: '13px', 
                        fontWeight: modelType === 'hermes' ? '600' : '400',
                        color: modelType === 'hermes' ? getHermesColor() : 'var(--text-muted)'
                    }}>
                        {getHermesLabel()}
                    </span>
                    
                    {/* Fallback Chain Icons - only show when Hermes is active */}
                    {modelType === 'hermes' && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            marginLeft: '8px',
                            paddingLeft: '8px',
                            borderLeft: '1px solid var(--border-light)'
                        }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>→</span>
                            {fallbackChain.map((item, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        padding: '2px 6px',
                                        borderRadius: '16px',
                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={() => handleMouseEnter(
                                        `${item.icon} ${item.name} - ${item.tier} in fallback chain`
                                    )}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <span style={{ fontSize: '12px' }}>{item.icon}</span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                        {idx === 0 ? 'Primary' : idx === 1 ? 'FB1' : 'FB2'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Tooltip */}
            {showTooltip && (
                <div style={{
                    position: 'absolute',
                    marginTop: '45px',
                    padding: '8px 14px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    maxWidth: '280px',
                    lineHeight: '1.5',
                    pointerEvents: 'none'
                }}>
                    {tooltipContent.split('\n').map((line, idx) => (
                        <div key={idx}>
                            {line}
                            {idx === 0 && modelType === 'hermes' && (
                                <div style={{ 
                                    marginTop: '6px', 
                                    fontSize: '10px', 
                                    color: getHermesColor(),
                                    borderTop: '1px solid var(--border-light)',
                                    paddingTop: '4px',
                                    marginTop: '4px'
                                }}>
                                    Automatic fallback if primary fails
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}