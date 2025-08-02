/**
 * React Asset Picker Component
 * For selecting Unity assets (Textures, Materials, Audio, etc.)
 */

const { useState, useEffect, useCallback } = window.React;

export const AssetPicker = ({ 
    value, 
    onChange, 
    onChangeComplete,
    label,
    assetType = 'Texture', // Texture, Material, Audio, etc.
    disabled = false,
    placeholder = 'None'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [assets, setAssets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Load available assets
    useEffect(() => {
        if (isOpen && assets.length === 0) {
            loadAssets();
        }
    }, [isOpen]);
    
    // Load assets from Unity
    const loadAssets = async () => {
        setLoading(true);
        try {
            // Get assets from Unity scene
            if (window.SM?.scene) {
                let assetList = [];
                
                switch (assetType) {
                    case 'Texture':
                        assetList = window.SM.scene.textures || [];
                        break;
                    case 'Material':
                        assetList = window.SM.scene.materials || [];
                        break;
                    case 'Audio':
                        assetList = window.SM.scene.audioClips || [];
                        break;
                    default:
                        console.warn(`Unknown asset type: ${assetType}`);
                }
                
                setAssets(assetList);
            }
        } catch (error) {
            console.error('Failed to load assets:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Filter assets based on search
    const filteredAssets = searchTerm
        ? assets.filter(asset => 
            asset.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : assets;
    
    // Get current asset name
    const currentAsset = assets.find(asset => asset.id === value || asset.url === value);
    const displayName = currentAsset?.name || value || placeholder;
    
    // Handle selection
    const handleSelect = useCallback((asset) => {
        const assetValue = asset?.url || asset?.id || null;
        onChange?.(assetValue);
        onChangeComplete?.(assetValue);
        setIsOpen(false);
        setSearchTerm('');
    }, [onChange, onChangeComplete]);
    
    // Handle clear
    const handleClear = useCallback((e) => {
        e.stopPropagation();
        onChange?.(null);
        onChangeComplete?.(null);
    }, [onChange, onChangeComplete]);
    
    return React.createElement('div', { className: 'asset-picker-container' },
        label && React.createElement('label', { className: 'property-label' }, label),
        React.createElement('div', { className: 'asset-picker-wrapper', style: { position: 'relative' } },
            // Asset button
            React.createElement('button', {
                onClick: () => !disabled && setIsOpen(!isOpen),
                disabled: disabled,
                style: {
                    width: '100%',
                    padding: '4px 8px',
                    paddingRight: value ? '48px' : '24px',
                    background: '#1a1a1a',
                    border: `1px solid ${isOpen ? '#4a8af4' : '#3a3a3a'}`,
                    borderRadius: '4px',
                    color: value ? '#e8e8e8' : '#888',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }
            },
                // Asset type icon
                React.createElement('span', {
                    style: {
                        fontSize: '14px',
                        opacity: 0.7
                    }
                }, assetType === 'Texture' ? '🌆' : (assetType === 'Material' ? '🎨' : '🎧')),
                React.createElement('span', {
                    style: {
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }
                }, displayName)
            ),
            
            // Clear button
            value && !disabled && React.createElement('button', {
                onClick: handleClear,
                style: {
                    position: 'absolute',
                    right: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '2px 4px',
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '12px'
                },
                onMouseEnter: (e) => e.target.style.color = '#e8e8e8',
                onMouseLeave: (e) => e.target.style.color = '#888'
            }, '×'),
            
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
            
            // Asset picker dropdown
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
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }
            },
                // Search input
                React.createElement('div', {
                    style: {
                        padding: '4px',
                        borderBottom: '1px solid #3a3a3a',
                        position: 'sticky',
                        top: 0,
                        background: '#2a2a2a'
                    }
                },
                    React.createElement('input', {
                        type: 'text',
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        placeholder: `Search ${assetType}s...`,
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
                
                // Loading state
                loading ? React.createElement('div', {
                    style: {
                        padding: '20px',
                        textAlign: 'center',
                        color: '#888',
                        fontSize: '12px'
                    }
                }, 'Loading assets...') :
                
                // None option
                React.createElement('div', null,
                    React.createElement('div', {
                        onClick: () => handleSelect(null),
                        style: {
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: !value ? '#4a8af4' : '#888',
                            background: !value ? 'rgba(74, 138, 244, 0.1)' : 'transparent',
                            borderBottom: '1px solid #3a3a3a',
                            fontStyle: 'italic',
                            transition: 'all 0.2s'
                        },
                        onMouseEnter: (e) => {
                            if (value) e.target.style.background = '#3a3a3a';
                        },
                        onMouseLeave: (e) => {
                            if (value) e.target.style.background = 'transparent';
                        }
                    }, 'None'),
                    
                    // Asset list
                    filteredAssets.length > 0 ? filteredAssets.map(asset => 
                        React.createElement('div', {
                            key: asset.id || asset.url,
                            onClick: () => handleSelect(asset),
                            style: {
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: (asset.id === value || asset.url === value) ? '#4a8af4' : '#e8e8e8',
                                background: (asset.id === value || asset.url === value) ? 'rgba(74, 138, 244, 0.1)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            },
                            onMouseEnter: (e) => {
                                if (asset.id !== value && asset.url !== value) {
                                    e.target.style.background = '#3a3a3a';
                                }
                            },
                            onMouseLeave: (e) => {
                                if (asset.id !== value && asset.url !== value) {
                                    e.target.style.background = 'transparent';
                                }
                            }
                        },
                            // Asset preview
                            asset.thumbnailUrl && React.createElement('img', {
                                src: asset.thumbnailUrl,
                                style: {
                                    width: '24px',
                                    height: '24px',
                                    objectFit: 'cover',
                                    borderRadius: '2px',
                                    border: '1px solid #3a3a3a'
                                },
                                onError: (e) => e.target.style.display = 'none'
                            }),
                            React.createElement('span', null, asset.name || 'Unnamed')
                        )
                    ) : React.createElement('div', {
                        style: {
                            padding: '12px',
                            textAlign: 'center',
                            color: '#888',
                            fontSize: '12px'
                        }
                    }, searchTerm ? 'No matching assets found' : `No ${assetType}s available`)
                )
            )
        )
    );
};