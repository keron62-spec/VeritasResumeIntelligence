import React, { useState } from 'react';

export default function ModelToggle({ modelType, setModelType, isComparisonMode }) {
    const [showTooltip, setShowTooltip] = useState(false);
    
    // Only show in Comparison Mode
    if (!isComparisonMode) {
        return null;
    }
    
    const getModelIcon = () => {
        return modelType === 'gemini' ? '✨' : '⚡';
    };
    
    const getModelLabel = () => {
        return modelType === 'gemini' ? 'Gemini' : 'GPT-OSS';
    };
    
    const getModelDescription = () => {
        return modelType === 'gemini' 
            ? 'Google Gemini 3.1 Flash Lite with 4-model fallback' 
            : 'GPT-OSS 120B + Minimax (Open Source ensemble)';
    };
    
    const getModelColor = () => {
        return modelType === 'gemini' ? '#4285f4' : '#10b981';
    };
    
    const toggleModel = () => {
        setModelType(modelType === 'gemini' ? 'dual' : 'gemini');
    };
    
    return (
        <div className="model-toggle-container" style={{
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
                    (Comparison Mode)
                </span>
            </div>
            
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '6px 12px',
                borderRadius: '40px',
                border: '1px solid var(--border-light)'
            }}>
                {/* Active Model Display with Icon */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 8px',
                    borderRadius: '32px',
                    backgroundColor: `rgba(${modelType === 'gemini' ? '66, 133, 244' : '16, 185, 129'}, 0.15)`
                }}>
                    <span style={{ fontSize: '18px' }}>{getModelIcon()}</span>
                    <span style={{ 
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: getModelColor()
                    }}>
                        {getModelLabel()}
                    </span>
                </div>
                
                {/* Slider/Toggle */}
                <button
                    onClick={toggleModel}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    style={{
                        width: '48px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: modelType === 'dual' ? '#10b981' : '#4285f4',
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
                        transform: modelType === 'dual' ? 'translateX(24px)' : 'translateX(0)',
                        transition: 'transform 0.2s ease'
                    }} />
                </button>
                
                {/* Inactive Model Display */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: 0.7
                }}>
                    <span style={{ fontSize: '14px' }}>{modelType === 'gemini' ? '⚡' : '✨'}</span>
                    <span style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-muted)'
                    }}>
                        {modelType === 'gemini' ? 'GPT-OSS' : 'Gemini'}
                    </span>
                </div>
            </div>
            
            {/* Tooltip */}
            {showTooltip && (
                <div style={{
                    position: 'absolute',
                    marginTop: '45px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    maxWidth: '260px'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {modelType === 'gemini' ? '✨ Gemini 3.1 Flash Lite' : '⚡ GPT-OSS + Minimax'}
                    </div>
                    <div>{getModelDescription()}</div>
                    {modelType === 'dual' && (
                        <div style={{ marginTop: '4px', fontSize: '10px', color: '#10b981' }}>
                            Open source ensemble for creative rewriting
                        </div>
                    )}
                    {modelType === 'gemini' && (
                        <div style={{ marginTop: '4px', fontSize: '10px', color: '#4285f4' }}>
                            Direct Google API with 4-model failover
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}