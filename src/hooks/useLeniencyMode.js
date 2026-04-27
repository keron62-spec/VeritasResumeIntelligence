import { useState, useEffect } from 'react';

const STORAGE_KEY = 'veritas_leniency_acknowledged';

export function useLeniencyMode() {
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem('veritas_leniency_mode');
        return saved && ['normal', 'strict', 'very_strict', 'lenient'].includes(saved) 
            ? saved 
            : 'normal';
    });
    
    const [showVeryStrictModal, setShowVeryStrictModal] = useState(false);
    const [showStrictTooltip, setShowStrictTooltip] = useState(false);
    
    // Save mode preference
    useEffect(() => {
        localStorage.setItem('veritas_leniency_mode', mode);
    }, [mode]);
    
    // Apply body class for mode-specific styling
    useEffect(() => {
        // Remove existing mode classes
        document.body.classList.remove('very-strict-mode', 'strict-mode', 'lenient-mode');
        
        if (mode === 'very_strict') {
            document.body.classList.add('very-strict-mode');
        } else if (mode === 'strict') {
            document.body.classList.add('strict-mode');
        } else if (mode === 'lenient') {
            document.body.classList.add('lenient-mode');
        }
    }, [mode]);
    
    const changeMode = (newMode, acknowledge = false) => {
        // Special handling for Very Strict mode
        if (newMode === 'very_strict') {
            const hasAcknowledged = localStorage.getItem(`${STORAGE_KEY}_very_strict`) === 'true';
            
            if (!hasAcknowledged && !acknowledge) {
                setShowVeryStrictModal(true);
                return;
            }
        }
        
        // Special handling for Strict mode - show tooltip first time
        if (newMode === 'strict') {
            const hasSeenTooltip = localStorage.getItem(`${STORAGE_KEY}_strict_tooltip`) === 'true';
            if (!hasSeenTooltip) {
                setShowStrictTooltip(true);
                setTimeout(() => setShowStrictTooltip(false), 5000);
                localStorage.setItem(`${STORAGE_KEY}_strict_tooltip`, 'true');
            }
        }
        
        setMode(newMode);
    };
    
    const acknowledgeVeryStrict = () => {
        localStorage.setItem(`${STORAGE_KEY}_very_strict`, 'true');
        setShowVeryStrictModal(false);
        setMode('very_strict');
    };
    
    const dismissVeryStrictModal = () => {
        setShowVeryStrictModal(false);
    };
    
    const resetAcknowledgment = () => {
        localStorage.removeItem(`${STORAGE_KEY}_very_strict`);
        localStorage.removeItem(`${STORAGE_KEY}_strict_tooltip`);
    };
    
    return {
        mode,
        setMode: changeMode,
        showVeryStrictModal,
        showStrictTooltip,
        acknowledgeVeryStrict,
        dismissVeryStrictModal,
        resetAcknowledgment,
        isVeryStrict: mode === 'very_strict',
        isStrict: mode === 'strict',
        isLenient: mode === 'lenient',
        isNormal: mode === 'normal'
    };
}