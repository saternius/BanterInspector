/**
 * React Color Picker Component
 * Replaces the repeated inline color picker implementations
 */

const { useState, useEffect, useCallback, useRef } = window.React;

export const ColorPicker = ({ value, onChange, onChangeComplete, label, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localColor, setLocalColor] = useState(value || { r: 1, g: 1, b: 1, a: 1 });
    const pickerRef = useRef(null);
    
    // Convert Unity color (0-1) to hex
    const toHex = useCallback((color) => {
        const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }, []);
    
    // Convert hex to Unity color (0-1)
    const fromHex = useCallback((hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255,
                a: localColor.a // Preserve alpha
            };
        }
        return localColor;
    }, [localColor.a]);
    
    // Update local color when value prop changes
    useEffect(() => {
        if (value) {
            setLocalColor(value);
        }
    }, [value]);
    
    // Handle color input change
    const handleColorChange = useCallback((e) => {
        const newColor = fromHex(e.target.value);
        setLocalColor(newColor);
        onChange?.(newColor);
    }, [fromHex, onChange]);
    
    // Handle alpha change
    const handleAlphaChange = useCallback((e) => {
        const alpha = parseFloat(e.target.value);
        const newColor = { ...localColor, a: alpha };
        setLocalColor(newColor);
        onChange?.(newColor);
    }, [localColor, onChange]);
    
    // Handle picker close
    const handleClose = useCallback(() => {
        setIsOpen(false);
        onChangeComplete?.(localColor);
    }, [localColor, onChangeComplete]);
    
    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                handleClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, handleClose]);
    
    // Render color preview style
    const previewStyle = {
        backgroundColor: `rgba(${Math.round(localColor.r * 255)}, ${Math.round(localColor.g * 255)}, ${Math.round(localColor.b * 255)}, ${localColor.a})`,
        border: '1px solid #3a3a3a',
        borderRadius: '4px',
        width: '40px',
        height: '24px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden'
    };
    
    // Checkered background for alpha
    const checkerStyle = {
        position: 'absolute',
        inset: 0,
        backgroundImage: 'repeating-conic-gradient(#666 0% 25%, #444 0% 50%)',
        backgroundSize: '8px 8px',
        zIndex: 0
    };
    
    return React.createElement('div', { className: 'color-picker-container', ref: pickerRef },
        label && React.createElement('label', { className: 'property-label' }, label),
        React.createElement('div', { className: 'color-picker-wrapper', style: { position: 'relative' } },
            // Color preview
            React.createElement('div', {
                style: previewStyle,
                onClick: () => !disabled && setIsOpen(!isOpen),
                title: `R: ${Math.round(localColor.r * 255)}, G: ${Math.round(localColor.g * 255)}, B: ${Math.round(localColor.b * 255)}, A: ${localColor.a.toFixed(2)}`
            },
                React.createElement('div', { style: checkerStyle }),
                React.createElement('div', { style: { ...previewStyle, position: 'absolute', inset: 0, border: 'none' } })
            ),
            
            // Picker dropdown
            isOpen && React.createElement('div', {
                className: 'color-picker-dropdown',
                style: {
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: '#2a2a2a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '4px',
                    padding: '12px',
                    zIndex: 1000,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }
            },
                // Color input
                React.createElement('div', { style: { marginBottom: '8px' } },
                    React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontSize: '12px' } }, 'Color'),
                    React.createElement('input', {
                        type: 'color',
                        value: toHex(localColor),
                        onChange: handleColorChange,
                        style: { width: '100%', height: '32px', cursor: 'pointer' }
                    })
                ),
                
                // Alpha slider
                React.createElement('div', null,
                    React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontSize: '12px' } }, `Alpha: ${localColor.a.toFixed(2)}`),
                    React.createElement('input', {
                        type: 'range',
                        min: '0',
                        max: '1',
                        step: '0.01',
                        value: localColor.a,
                        onChange: handleAlphaChange,
                        style: { width: '100%' }
                    })
                ),
                
                // RGB values display
                React.createElement('div', { style: { marginTop: '8px', fontSize: '11px', color: '#888' } },
                    `RGB: ${Math.round(localColor.r * 255)}, ${Math.round(localColor.g * 255)}, ${Math.round(localColor.b * 255)}`
                )
            )
        )
    );
};