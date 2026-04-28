import React from 'react';

export default function ModelToggle({ modelType, setModelType }) {
    return (
        <div className="model-toggle-container" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
            justifyContent: 'flex-end'
        }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {modelType === 'gemini' ? '✨ Gemini' : '⚡ Dual-Optimized'}
            </span>
            <button
                onClick={() => setModelType(modelType === 'gemini' ? 'dual' : 'gemini')}
                className={`toggle-switch ${modelType === 'dual' ? 'active' : ''}`}
                style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: modelType === 'dual' ? 'var(--accent-blue)' : 'var(--border-light)',
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
            <span style={{ fontSize: '12px', fontWeight: modelType === 'dual' ? '600' : '400', color: modelType === 'dual' ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                {modelType === 'dual' ? 'GPT-OSS + Minimax' : 'Standard'}
            </span>
        </div>
    );
}