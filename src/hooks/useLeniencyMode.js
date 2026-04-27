import { useState, useEffect } from 'react';

const STORAGE_KEY = 'veritas_leniency_acknowledged';

export function useLeniencyMode() {
    // Fix: Default to 'normal', not 'very_strict'
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem('veritas_leniency_mode');
        // Only use saved value if it's valid, otherwise default to 'normal'
        if (saved && ['normal', 'strict', 'very_strict', 'lenient'].includes(saved)) {
            return saved;
        }
        return 'normal';
    });
    
    const [showVeryStrictModal, setShowVeryStrictModal] = useState(false);
    const [showStrictTooltip, setShowStrictTooltip] = useState(false);
    
    // Save mode preference when it changes
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
    
    const changeMode = (newMode, acknowledged = false) => {
        // Special handling for Very Strict mode
        if (newMode === 'very_strict') {
            const hasAcknowledged = localStorage.getItem(`${STORAGE_KEY}_very_strict`) === 'true';
            
            // If not acknowledged and this is not an acknowledgment call, show modal
            if (!hasAcknowledged && !acknowledged) {
                setShowVeryStrictModal(true);
                return;
            }
            
            // If acknowledged or this is the acknowledgment call, set the mode
            setMode('very_strict');
            setShowVeryStrictModal(false);
            return;
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
        
        // For all other modes, just set it
        setMode(newMode);
    };
    
    const acknowledgeVeryStrict = () => {
        // Save acknowledgment to localStorage
        localStorage.setItem(`${STORAGE_KEY}_very_strict`, 'true');
        // Close the modal
        setShowVeryStrictModal(false);
        // Set the mode
        setMode('very_strict');
    };
    
    const dismissVeryStrictModal = () => {
        setShowVeryStrictModal(false);
        // Don't change mode - stay on current mode (which should be 'normal')
    };
    
    const resetAcknowledgment = () => {
        localStorage.removeItem(`${STORAGE_KEY}_very_strict`);
        localStorage.removeItem(`${STORAGE_KEY}_strict_tooltip`);
        // Reset to normal mode
        setMode('normal');
        alert('Acknowledgment reset. Very Strict mode disclaimer will show again next time.');
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