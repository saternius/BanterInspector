/**
 * Component Menu
 * Handles the component selection menu overlay
 */
// (async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
    const { sceneManager } = await import( `${basePath}/scene-manager.js`);

    export class ComponentMenu {
        constructor() {
            this.overlay = document.getElementById('componentMenuOverlay');
            this.searchInput = document.getElementById('componentSearchInput');
            this.closeBtn = document.getElementById('closeComponentMenu');
            
            this.selectedSlotId = null;
            this.categoryStates = new Map(); // Track expanded/collapsed state
            this.setupEventListeners();
            this.initializeCategories();
        }

        /**
         * Initialize categories with default expanded state
         */
        initializeCategories() {
            const categories = document.querySelectorAll('.component-category');
            categories.forEach((category, index) => {
                const categoryName = category.querySelector('.category-name')?.textContent || `category-${index}`;
                this.categoryStates.set(categoryName, true); // All expanded by default
                
                // Add expand/collapse indicator
                const header = category.querySelector('.category-header');
                if (header && !header.querySelector('.category-toggle')) {
                    const toggleIcon = document.createElement('span');
                    toggleIcon.className = 'category-toggle';
                    toggleIcon.textContent = '▼';
                    header.insertBefore(toggleIcon, header.firstChild);
                }
            });
            categories.forEach((category, index) => {
                this.toggleCategory(category);
            });
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Listen for show component menu events
            document.addEventListener('showComponentMenu', (event) => {
                this.selectedSlotId = event.detail.slotId;
                this.show();
            });

            // Close button
            this.closeBtn?.addEventListener('click', () => {
                this.hide();
            });

            // Overlay click (close on background click)
            this.overlay?.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });

            // Search input
            this.searchInput?.addEventListener('input', (e) => {
                this.filterComponents(e.target.value);
            });

            // Category header clicks
            document.addEventListener('click', (e) => {
                const header = e.target.closest('.category-header');
                if (header && this.overlay?.contains(header)) {
                    e.stopPropagation();
                    this.toggleCategory(header.closest('.component-category'));
                }
            });

            // Component item clicks
            document.addEventListener('click', (e) => {
                const item = e.target.closest('.component-item');
                if (item && this.overlay?.contains(item)) {
                    const componentType = item.dataset.component;
                    if (componentType) {
                        this.addComponent(componentType);
                    }
                }
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay?.style.display !== 'none') {
                    this.hide();
                }
            });
        }

        /**
         * Toggle category expanded/collapsed state
         */
        toggleCategory(categoryElement) {
            const categoryName = categoryElement.querySelector('.category-name')?.textContent;
            if (!categoryName) return;
            
            const isExpanded = this.categoryStates.get(categoryName) ?? true;
            this.categoryStates.set(categoryName, !isExpanded);
            
            // Update UI
            const toggleIcon = categoryElement.querySelector('.category-toggle');
            const itemsContainer = categoryElement.querySelector('.category-items');
            
            if (toggleIcon) {
                toggleIcon.textContent = isExpanded ? '▶' : '▼';
            }
            
            if (itemsContainer) {
                itemsContainer.classList.toggle('collapsed', isExpanded);
            }
            
            categoryElement.classList.toggle('collapsed', isExpanded);
        }

        /**
         * Show the component menu
         */
        show() {
            if (!this.overlay || !this.selectedSlotId) return;
            
            this.overlay.style.display = 'flex';
            this.searchInput.value = '';
            this.filterComponents('');
            
            // Re-initialize categories in case DOM changed
            this.initializeCategories();
            
            // Focus search input
            setTimeout(() => {
                this.searchInput?.focus();
            }, 100);
        }

        /**
         * Hide the component menu
         */
        hide() {
            if (!this.overlay) return;
            
            this.overlay.style.display = 'none';
            this.selectedSlotId = null;
        }

        /**
         * Filter components based on search term
         */
        filterComponents(searchTerm) {
            const term = searchTerm.toLowerCase();
            const items = document.querySelectorAll('.component-item');
            const categories = document.querySelectorAll('.component-category');
            
            items.forEach(item => {
                const name = item.querySelector('.component-item-name')?.textContent.toLowerCase() || '';
                const desc = item.querySelector('.component-item-desc')?.textContent.toLowerCase() || '';
                const matches = name.includes(term) || desc.includes(term);
                
                item.classList.toggle('hidden', !matches);
            });
            
            // Handle categories
            categories.forEach(category => {
                const visibleItems = category.querySelectorAll('.component-item:not(.hidden)');
                const hasVisibleItems = visibleItems.length > 0;
                
                category.style.display = hasVisibleItems ? 'block' : 'none';
                
                // Auto-expand categories with matching items when searching
                if (term && hasVisibleItems) {
                    const categoryName = category.querySelector('.category-name')?.textContent;
                    if (categoryName && !this.categoryStates.get(categoryName)) {
                        this.categoryStates.set(categoryName, true);
                        category.classList.remove('collapsed');
                        
                        const toggleIcon = category.querySelector('.category-toggle');
                        if (toggleIcon) {
                            toggleIcon.textContent = '▼';
                        }
                        
                        const itemsContainer = category.querySelector('.category-items');
                        if (itemsContainer) {
                            itemsContainer.classList.remove('collapsed');
                        }
                    }
                }
            });
        }

        /**
         * Add component to selected slot
         */
        async addComponent(componentType) {
            if (!this.selectedSlotId) return;
            
            const slot = sceneManager.getSlotById(this.selectedSlotId);
            if (!slot) return;
            
            // Check if component already exists (some components should be unique)
            const uniqueComponents = ['Transform', 'BanterRigidbody', 'BanterSyncedObject'];
            if (uniqueComponents.includes(componentType)) {
                const exists = slot.components.some(c => c.type === componentType);
                if (exists) {
                    alert(`A ${componentType} component already exists on this slot.`);
                    return;
                }
            }
            
            const componentConfig = this.getDefaultComponentConfig(componentType);
            let slotComponent = null;
            if(componentType === 'MonoBehavior'){
                slotComponent = {
                    id: Math.floor(Math.random()*10000),
                    type: 'MonoBehavior',
                    properties: componentConfig.properties
                };
            }else{
                let unityComponent = await this.createUnityComponent(this.selectedSlotId, componentType);
                console.log("unityComponent", unityComponent)
                if(unityComponent){
                    slotComponent = {
                        id: unityComponent.id,
                        type: componentType,
                        properties: componentConfig.properties,
                        _bs: unityComponent
                    };
                   
                }
            }

            slot.components.push(slotComponent);
            sceneManager.sceneData.componentMap[slotComponent.id] = slotComponent
            console.log(this.selectedSlotId)
            let prevSel = this.selectedSlotId;
            this.hide();
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: prevSel }
            }));
            
        }

        /**
         * Get default component configuration
         */
        getDefaultComponentConfig(componentType) {
            const configs = {
                'MonoBehavior':{
                    properties: {
                        name: 'myScript',
                        file: null,
                        vars: {}
                    }
                },
                'BanterRigidbody': {
                    properties: {
                        mass: 1,
                        drag: 0,
                        angularDrag: 0.05,
                        useGravity: true,
                        isKinematic: false
                    }
                },
                'BoxCollider': {
                    properties: {
                        isTrigger: false,
                        center: { x: 0, y: 0, z: 0 },
                        size: { x: 1, y: 1, z: 1 }
                    }
                },
                'SphereCollider': {
                    properties: {
                        isTrigger: false,
                        radius: 0.5
                    }
                },
                'BanterMaterial': {
                    properties: {
                        shader: 'Standard',
                        color: { r: 1, g: 1, b: 1, a: 1 },
                        texture: ''
                    }
                },
                'BanterText': {
                    properties: {
                        text: 'New Text',
                        fontSize: 14,
                        color: { r: 1, g: 1, b: 1, a: 1 },
                        alignment: 'Center'
                    }
                },
                'BanterGeometry': {
                    properties: {
                        geometryType: 'BoxGeometry',
                        width: 1,
                        height: 1,
                        depth: 1
                    }
                },
                'BanterAudioSource': {
                    properties: {
                        volume: 0.8,
                        pitch: 1,
                        loop: false,
                        playOnAwake: false,
                        spatialBlend: 1
                    }
                },
                'BanterVideoPlayer': {
                    properties: {
                        url: '',
                        volume: 1,
                        loop: true,
                        playOnAwake: true
                    }
                },
                'BanterBrowser': {
                    properties: {
                        url: 'https://example.com',
                        pixelsPerUnit: 100,
                        pageWidth: 1920,
                        pageHeight: 1080
                    }
                },
                'BanterGrabHandle': {
                    properties: {
                        grabType: 'TRIGGER',
                        grabRadius: 0.1
                    }
                },
                'BanterSyncedObject': {
                    properties: {
                        syncPosition: true,
                        syncRotation: true,
                        takeOwnershipOnGrab: true
                    }
                }
            };
            
            return configs[componentType];
        }

        /**
         * Create Unity component
         */
        async createUnityComponent(slotId, componentType) {
            try {
                const gameObject = sceneManager.scene.objects?.[slotId];
                if (!gameObject) return;
                
                let component = null;
                
                switch (componentType) {
                    case 'BanterRigidbody':
                        component = new BS.BanterRigidbody();
                        break;
                        
                    case 'BoxCollider':
                        component = new BS.BoxCollider(false, new BS.Vector3(0, 0, 0), new BS.Vector3(1, 1, 1));
                        break;
                        
                    case 'SphereCollider':
                        component = new BS.SphereCollider(false, 0.5);
                        break;
                        
                    case 'CapsuleCollider':
                        component = new BS.CapsuleCollider(false, new BS.Vector3(0, 0, 0), 0.5, 2, 1);
                        break;
                        
                    case 'MeshCollider':
                        component = new BS.MeshCollider(true, false);
                        break;
                        
                    case 'BanterGeometry':
                        component = new BS.BanterGeometry(BS.GeometryType.BoxGeometry, null, 1, 1, 1, 1, 1, 1);
                        break;
                        
                    case 'BanterMaterial':
                        component = new BS.BanterMaterial(
                            "Standard",
                            null,
                            new BS.Vector4(1, 1, 1, 1),
                            BS.MaterialSide.Front,
                            true
                        );
                        break;
                        
                    case 'BanterText':
                        component = new BS.BanterText(
                            "New Text",
                            new BS.Vector4(1, 1, 1, 1),
                            BS.HorizontalAlignment.Center,
                            BS.VerticalAlignment.Middle,
                            14,
                            true,
                            true,
                            new BS.Vector2(100, 50)
                        );
                        break;
                        
                    case 'BanterAudioSource':
                        component = new BS.BanterAudioSource(0.8, 1, false, false, false, 1);
                        break;
                        
                    case 'BanterVideoPlayer':
                        component = new BS.BanterVideoPlayer("", 1, true, true);
                        break;
                        
                    case 'BanterBrowser':
                        component = new BS.BanterBrowser("https://example.com", 2, 100, 1920, 1080);
                        break;
                        
                    case 'BanterGLTF':
                        component = new BS.BanterGLTF("", true, true, false, false, false, false);
                        break;
                        
                    case 'BanterAssetBundle':
                        component = new BS.BanterAssetBundle("", null, null, "", null, null, true, false);
                        break;
                        
                    case 'BanterGrabHandle':
                        component = new BS.BanterGrabHandle(BS.BanterGrabType.TRIGGER, 0.1);
                        break;
                        
                    case 'BanterHeldEvents':
                        component = new BS.BanterHeldEvents(1, 10, false);
                        break;
                        
                    case 'BanterAttachedObject':
                        component = new BS.BanterAttachedObject(
                            "",
                            new BS.Vector3(0, 0, 0),
                            new BS.Quaternion(0, 0, 0, 1),
                            BS.AttachmentType.Physics,
                            BS.AvatarAttachmentType.Bone,
                            BS.AvatarBoneName.Head,
                            BS.PhysicsAttachmentPoint.Head
                        );
                        break;
                        
                    case 'BanterSyncedObject':
                        component = new BS.BanterSyncedObject(true, true, true, true, true);
                        break;
                        
                    case 'BanterBillboard':
                        component = new BS.BanterBillboard(0.1, false, true, false);
                        break;
                        
                    case 'BanterMirror':
                        component = new BS.BanterMirror(2048, new BS.Vector4(0, 0, 1, 1), 0);
                        break;
                        
                    case 'BanterPortal':
                        component = new BS.BanterPortal("", "Space", 1);
                        break;
                }
                
                if (component && gameObject.AddComponent) {
                    await gameObject.AddComponent(component);
                }
                return component;
            } catch (error) {
                console.error(`Failed to create Unity component ${componentType}:`, error);
            }

            return null;
        }
    }
// })()