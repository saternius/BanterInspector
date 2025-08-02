/**
 * React Vector3 Input Component
 * Replaces repeated Vector3 input implementations
 */

const { useState, useEffect, useCallback } = window.React;

export const Vector3Input = ({ 
    value, 
    onChange, 
    onChangeComplete, 
    label, 
    labels = ['X', 'Y', 'Z'],
    step = 0.01,
    disabled = false,
    precision = 3
}) => {
    const [localValue, setLocalValue] = useState(value || { x: 0, y: 0, z: 0 });
    const [focusedAxis, setFocusedAxis] = useState(null);
    
    // Update local value when prop changes
    useEffect(() => {
        if (value && !focusedAxis) {
            setLocalValue(value);
        }
    }, [value, focusedAxis]);
    
    // Handle individual axis change
    const handleAxisChange = useCallback((axis, newValue) => {
        const parsed = parseFloat(newValue);
        if (isNaN(parsed)) return;
        
        const updated = { ...localValue, [axis]: parsed };
        setLocalValue(updated);
        onChange?.(updated);
    }, [localValue, onChange]);
    
    // Handle input blur (change complete)
    const handleBlur = useCallback((axis) => {
        setFocusedAxis(null);
        onChangeComplete?.(localValue);
    }, [localValue, onChangeComplete]);
    
    // Handle input focus
    const handleFocus = useCallback((axis) => {
        setFocusedAxis(axis);
    }, []);
    
    // Format number for display
    const formatNumber = useCallback((num) => {
        return Number(num).toFixed(precision);
    }, [precision]);
    
    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e, axis) => {
        let increment = 0;
        
        if (e.key === 'ArrowUp') {
            increment = e.shiftKey ? 10 : (e.ctrlKey ? 0.1 : 1);
        } else if (e.key === 'ArrowDown') {
            increment = e.shiftKey ? -10 : (e.ctrlKey ? -0.1 : -1);
        } else {
            return;
        }
        
        e.preventDefault();
        const current = localValue[axis];
        const newValue = current + increment;
        handleAxisChange(axis, newValue);
    }, [localValue, handleAxisChange]);
    
    const axes = ['x', 'y', 'z'];
    
    return React.createElement('div', { className: 'vector3-input-container' },
        label && React.createElement('label', { className: 'property-label' }, label),
        React.createElement('div', { 
            className: 'vector3-inputs',
            style: {
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
            }
        },
            axes.map((axis, index) => 
                React.createElement('div', { 
                    key: axis,
                    className: 'vector3-axis',
                    style: { flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }
                },
                    React.createElement('label', { 
                        style: { 
                            fontSize: '12px', 
                            color: axis === 'x' ? '#ff6b6b' : (axis === 'y' ? '#51cf66' : '#339af0'),
                            fontWeight: '600',
                            minWidth: '14px'
                        } 
                    }, labels[index]),
                    React.createElement('input', {
                        type: 'number',
                        value: focusedAxis === axis ? localValue[axis] : formatNumber(localValue[axis]),
                        onChange: (e) => handleAxisChange(axis, e.target.value),
                        onBlur: () => handleBlur(axis),
                        onFocus: () => handleFocus(axis),
                        onKeyDown: (e) => handleKeyDown(e, axis),
                        step: step,
                        disabled: disabled,
                        style: {
                            width: '100%',
                            padding: '4px 8px',
                            background: '#1a1a1a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '4px',
                            color: '#e8e8e8',
                            fontSize: '12px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        },
                        onMouseEnter: (e) => {
                            if (!disabled) e.target.style.borderColor = '#4a4a4a';
                        },
                        onMouseLeave: (e) => {
                            if (!disabled && !focusedAxis) e.target.style.borderColor = '#3a3a3a';
                        }
                    })
                )
            ),
            // Copy button
            React.createElement('button', {
                onClick: () => {
                    const text = `${formatNumber(localValue.x)}, ${formatNumber(localValue.y)}, ${formatNumber(localValue.z)}`;
                    navigator.clipboard.writeText(text);
                },
                title: 'Copy values',
                style: {
                    padding: '4px 8px',
                    background: '#2a2a2a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '4px',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                },
                onMouseEnter: (e) => {
                    e.target.style.borderColor = '#4a4a4a';
                    e.target.style.color = '#e8e8e8';
                },
                onMouseLeave: (e) => {
                    e.target.style.borderColor = '#3a3a3a';
                    e.target.style.color = '#888';
                }
            }, '📋')
        )
    );
};