/**
 * React Select Dropdown Component
 * Replaces repeated dropdown implementations for enums and options
 */

const { useState, useEffect, useCallback, useRef } = window.React;

export const SelectDropdown = ({ 
    value, 
    options, 
    onChange, 
    onChangeComplete,
    label,
    disabled = false,
    placeholder = 'Select...',
    searchable = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    
    // Normalize options to array of {value, label} objects
    const normalizedOptions = Array.isArray(options) 
        ? options.map(opt => 
            typeof opt === 'object' ? opt : { value: opt, label: opt }
        )
        : Object.entries(options).map(([key, val]) => ({ value: key, label: val }));
    
    // Filter options based on search
    const filteredOptions = searchable && searchTerm
        ? normalizedOptions.filter(opt => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : normalizedOptions;
    
    // Get current label
    const currentOption = normalizedOptions.find(opt => opt.value === value);
    const currentLabel = currentOption?.label || placeholder;
    
    // Handle selection
    const handleSelect = useCallback((optionValue) => {
        onChange?.(optionValue);
        onChangeComplete?.(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    }, [onChange, onChangeComplete]);
    
    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);
    
    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchable && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen, searchable]);
    
    return React.createElement('div', { className: 'select-dropdown-container', ref: dropdownRef },
        label && React.createElement('label', { className: 'property-label' }, label),
        React.createElement('div', { className: 'select-dropdown-wrapper', style: { position: 'relative' } },
            // Dropdown button
            React.createElement('button', {
                onClick: () => !disabled && setIsOpen(!isOpen),
                disabled: disabled,
                style: {
                    width: '100%',
                    padding: '4px 8px',
                    paddingRight: '24px',
                    background: '#1a1a1a',
                    border: `1px solid ${isOpen ? '#4a8af4' : '#3a3a3a'}`,
                    borderRadius: '4px',
                    color: value ? '#e8e8e8' : '#888',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }
            }, currentLabel),
            
            // Dropdown arrow
            React.createElement('span', {
                style: {
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0'})`,
                    transition: 'transform 0.2s',
                    pointerEvents: 'none',
                    color: '#888',
                    fontSize: '10px'
                }
            }, '▼'),
            
            // Dropdown menu
            isOpen && React.createElement('div', {
                style: {
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#2a2a2a',
                    border: '1px solid #3a3a3a',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }
            },
                // Search input
                searchable && React.createElement('div', {
                    style: {
                        padding: '4px',
                        borderBottom: '1px solid #3a3a3a'
                    }
                },
                    React.createElement('input', {
                        ref: searchRef,
                        type: 'text',
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        placeholder: 'Search...',
                        style: {
                            width: '100%',
                            padding: '4px 8px',
                            background: '#1a1a1a',
                            border: '1px solid #3a3a3a',
                            borderRadius: '4px',
                            color: '#e8e8e8',
                            fontSize: '12px',
                            outline: 'none'
                        }
                    })
                ),
                
                // Options list
                filteredOptions.length > 0 ? filteredOptions.map(option => 
                    React.createElement('div', {
                        key: option.value,
                        onClick: () => handleSelect(option.value),
                        style: {
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: option.value === value ? '#4a8af4' : '#e8e8e8',
                            background: option.value === value ? 'rgba(74, 138, 244, 0.1)' : 'transparent',
                            transition: 'all 0.2s'
                        },
                        onMouseEnter: (e) => {
                            if (option.value !== value) {
                                e.target.style.background = '#3a3a3a';
                            }
                        },
                        onMouseLeave: (e) => {
                            if (option.value !== value) {
                                e.target.style.background = 'transparent';
                            }
                        }
                    }, option.label)
                ) : React.createElement('div', {
                    style: {
                        padding: '12px',
                        textAlign: 'center',
                        color: '#888',
                        fontSize: '12px'
                    }
                }, 'No options found')
            )
        )
    );
};