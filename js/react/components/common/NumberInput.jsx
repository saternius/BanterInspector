/**
 * React Number Input Component
 * Enhanced number input with validation, step controls, and keyboard shortcuts
 */

const { useState, useEffect, useCallback, useRef } = window.React;

export const NumberInput = ({ 
    value, 
    onChange, 
    onChangeComplete,
    label,
    min = -Infinity,
    max = Infinity,
    step = 1,
    precision = 3,
    disabled = false,
    showSteppers = true,
    unit = '',
    placeholder = '0'
}) => {
    const [localValue, setLocalValue] = useState(value ?? 0);
    const [isFocused, setIsFocused] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null);
    const timeoutRef = useRef(null);
    
    // Update local value when prop changes (only if not editing)
    useEffect(() => {
        if (!isEditing && value !== undefined) {
            setLocalValue(value);
        }
    }, [value, isEditing]);
    
    // Clamp value to min/max
    const clampValue = useCallback((val) => {
        return Math.max(min, Math.min(max, val));
    }, [min, max]);
    
    // Format number for display
    const formatValue = useCallback((val) => {
        if (val === undefined || val === null || val === '') return '';
        const num = parseFloat(val);
        if (isNaN(num)) return '0';
        
        // Use precision for decimals, but don't add unnecessary decimals for integers
        if (Number.isInteger(num) && step >= 1) {
            return num.toString();
        }
        return num.toFixed(precision);
    }, [precision, step]);
    
    // Handle input change
    const handleChange = useCallback((e) => {
        const inputValue = e.target.value;
        setIsEditing(true);
        
        // Allow empty string, negative sign, and decimal point while typing
        if (inputValue === '' || inputValue === '-' || inputValue === '.') {
            setLocalValue(inputValue);
            return;
        }
        
        const parsed = parseFloat(inputValue);
        if (!isNaN(parsed)) {
            const clamped = clampValue(parsed);
            setLocalValue(inputValue); // Keep raw input while typing
            onChange?.(clamped);
            
            // Debounce the change complete
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                onChangeComplete?.(clamped);
            }, 500);
        }
    }, [clampValue, onChange, onChangeComplete]);
    
    // Handle blur - finalize the value
    const handleBlur = useCallback(() => {
        setIsFocused(false);
        setIsEditing(false);
        
        let finalValue = parseFloat(localValue);
        if (isNaN(finalValue) || localValue === '' || localValue === '-') {
            finalValue = value ?? 0;
        }
        
        finalValue = clampValue(finalValue);
        setLocalValue(finalValue);
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onChangeComplete?.(finalValue);
    }, [localValue, value, clampValue, onChangeComplete]);
    
    // Handle focus
    const handleFocus = useCallback(() => {
        setIsFocused(true);
        inputRef.current?.select();
    }, []);
    
    // Handle step buttons
    const handleStep = useCallback((direction) => {
        const current = typeof localValue === 'string' ? parseFloat(localValue) || 0 : localValue;
        const newValue = clampValue(current + (direction * step));
        setLocalValue(newValue);
        setIsEditing(false);
        onChange?.(newValue);
        onChangeComplete?.(newValue);
    }, [localValue, step, clampValue, onChange, onChangeComplete]);
    
    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e) => {
        let increment = 0;
        
        if (e.key === 'ArrowUp') {
            increment = e.shiftKey ? step * 10 : (e.ctrlKey ? step * 0.1 : step);
        } else if (e.key === 'ArrowDown') {
            increment = e.shiftKey ? -step * 10 : (e.ctrlKey ? -step * 0.1 : -step);
        } else if (e.key === 'Enter') {
            handleBlur();
            return;
        } else {
            return;
        }
        
        e.preventDefault();
        const current = typeof localValue === 'string' ? parseFloat(localValue) || 0 : localValue;
        const newValue = clampValue(current + increment);
        setLocalValue(newValue);
        setIsEditing(false);
        onChange?.(newValue);
        onChangeComplete?.(newValue);
    }, [localValue, step, clampValue, onChange, onChangeComplete, handleBlur]);
    
    // Display value
    const displayValue = isEditing ? localValue : formatValue(localValue);
    
    return React.createElement('div', { className: 'number-input-container' },
        label && React.createElement('label', { className: 'property-label' }, label),
        React.createElement('div', { 
            className: 'number-input-wrapper',
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                position: 'relative'
            }
        },
            React.createElement('input', {
                ref: inputRef,
                type: 'text',
                value: displayValue,
                onChange: handleChange,
                onBlur: handleBlur,
                onFocus: handleFocus,
                onKeyDown: handleKeyDown,
                disabled: disabled,
                placeholder: placeholder,
                style: {
                    flex: 1,
                    padding: '4px 8px',
                    paddingRight: showSteppers ? '24px' : '8px',
                    background: '#1a1a1a',
                    border: `1px solid ${isFocused ? '#4a8af4' : '#3a3a3a'}`,
                    borderRadius: '4px',
                    color: '#e8e8e8',
                    fontSize: '12px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    textAlign: 'left'
                }
            }),
            
            // Step buttons
            showSteppers && !disabled && React.createElement('div', {
                style: {
                    position: 'absolute',
                    right: '2px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                }
            },
                React.createElement('button', {
                    onMouseDown: (e) => {
                        e.preventDefault();
                        handleStep(1);
                    },
                    style: {
                        padding: '0 4px',
                        background: '#2a2a2a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '2px',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '10px',
                        lineHeight: '10px',
                        height: '12px',
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        e.target.style.background = '#3a3a3a';
                        e.target.style.color = '#e8e8e8';
                    },
                    onMouseLeave: (e) => {
                        e.target.style.background = '#2a2a2a';
                        e.target.style.color = '#888';
                    }
                }, '▲'),
                React.createElement('button', {
                    onMouseDown: (e) => {
                        e.preventDefault();
                        handleStep(-1);
                    },
                    style: {
                        padding: '0 4px',
                        background: '#2a2a2a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '2px',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '10px',
                        lineHeight: '10px',
                        height: '12px',
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        e.target.style.background = '#3a3a3a';
                        e.target.style.color = '#e8e8e8';
                    },
                    onMouseLeave: (e) => {
                        e.target.style.background = '#2a2a2a';
                        e.target.style.color = '#888';
                    }
                }, '▼')
            ),
            
            // Unit label
            unit && React.createElement('span', {
                style: {
                    fontSize: '12px',
                    color: '#888',
                    marginLeft: '4px'
                }
            }, unit)
        )
    );
};