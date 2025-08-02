/**
 * React Slider Input Component
 * Range slider with numeric display
 */

const { useState, useEffect, useCallback } = window.React;

export const SliderInput = ({ 
    value, 
    onChange, 
    onChangeComplete,
    label,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    showValue = true,
    unit = '',
    precision = 2
}) => {
    const [localValue, setLocalValue] = useState(value ?? min);
    const [isDragging, setIsDragging] = useState(false);
    
    // Update local value when prop changes (only if not dragging)
    useEffect(() => {
        if (!isDragging && value !== undefined) {
            setLocalValue(value);
        }
    }, [value, isDragging]);
    
    // Calculate percentage for slider position
    const percentage = ((localValue - min) / (max - min)) * 100;
    
    // Format display value
    const formatValue = useCallback((val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return min.toString();
        
        // Use precision for decimals
        if (Number.isInteger(num) && step >= 1) {
            return num.toString();
        }
        return num.toFixed(precision);
    }, [min, step, precision]);
    
    // Handle slider change
    const handleChange = useCallback((e) => {
        const newValue = parseFloat(e.target.value);
        setLocalValue(newValue);
        onChange?.(newValue);
    }, [onChange]);
    
    // Handle drag start
    const handleMouseDown = useCallback(() => {
        setIsDragging(true);
    }, []);
    
    // Handle drag end
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        onChangeComplete?.(localValue);
    }, [localValue, onChangeComplete]);
    
    // Handle direct value input
    const handleValueInput = useCallback((e) => {
        const parsed = parseFloat(e.target.value);
        if (!isNaN(parsed)) {
            const clamped = Math.max(min, Math.min(max, parsed));
            setLocalValue(clamped);
            onChange?.(clamped);
        }
    }, [min, max, onChange]);
    
    const handleValueBlur = useCallback(() => {
        onChangeComplete?.(localValue);
    }, [localValue, onChangeComplete]);
    
    return React.createElement('div', { className: 'slider-input-container' },
        label && React.createElement('label', { className: 'property-label' }, label),
        React.createElement('div', { 
            className: 'slider-input-wrapper',
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }
        },
            // Slider
            React.createElement('div', {
                style: {
                    flex: 1,
                    position: 'relative',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center'
                }
            },
                // Track background
                React.createElement('div', {
                    style: {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: '#1a1a1a',
                        borderRadius: '2px',
                        border: '1px solid #3a3a3a'
                    }
                }),
                
                // Filled track
                React.createElement('div', {
                    style: {
                        position: 'absolute',
                        left: 0,
                        width: `${percentage}%`,
                        height: '4px',
                        background: disabled ? '#666' : '#4a8af4',
                        borderRadius: '2px',
                        transition: isDragging ? 'none' : 'width 0.2s'
                    }
                }),
                
                // Slider input (invisible)
                React.createElement('input', {
                    type: 'range',
                    min: min,
                    max: max,
                    step: step,
                    value: localValue,
                    onChange: handleChange,
                    onMouseDown: handleMouseDown,
                    onMouseUp: handleMouseUp,
                    onTouchStart: handleMouseDown,
                    onTouchEnd: handleMouseUp,
                    disabled: disabled,
                    style: {
                        position: 'absolute',
                        width: '100%',
                        height: '20px',
                        opacity: 0,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        zIndex: 2
                    }
                }),
                
                // Thumb
                React.createElement('div', {
                    style: {
                        position: 'absolute',
                        left: `${percentage}%`,
                        transform: 'translateX(-50%)',
                        width: '16px',
                        height: '16px',
                        background: disabled ? '#666' : (isDragging ? '#5a9aff' : '#4a8af4'),
                        border: '2px solid #2a2a2a',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        transition: isDragging ? 'none' : 'all 0.2s',
                        pointerEvents: 'none'
                    }
                })
            ),
            
            // Value display
            showValue && React.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }
            },
                React.createElement('input', {
                    type: 'number',
                    value: formatValue(localValue),
                    onChange: handleValueInput,
                    onBlur: handleValueBlur,
                    step: step,
                    disabled: disabled,
                    style: {
                        width: '60px',
                        padding: '4px 8px',
                        background: '#1a1a1a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '4px',
                        color: '#e8e8e8',
                        fontSize: '12px',
                        textAlign: 'center',
                        outline: 'none'
                    }
                }),
                unit && React.createElement('span', {
                    style: {
                        fontSize: '12px',
                        color: '#888'
                    }
                }, unit)
            )
        )
    );
};