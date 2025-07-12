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
            this.setupEventListeners();
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

            // Component item clicks
            document.querySelectorAll('.component-item').forEach(item => {
                item.addEventListener('click', () => {
                    const componentType = item.dataset.component;
                    if (componentType) {
                        this.addComponent(componentType);
                    }
                });
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.overlay?.style.display !== 'none') {
                    this.hide();
                }
            });
        }

        /**
         * Show the component menu
         */
        show() {
            if (!this.overlay || !this.selectedSlotId) return;
            
            this.overlay.style.display = 'flex';
            this.searchInput.value = '';
            this.filterComponents('');
            
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
            
            // Hide empty categories
            categories.forEach(category => {
                const visibleItems = category.querySelectorAll('.component-item:not(.hidden)');
                category.style.display = visibleItems.length > 0 ? 'block' : 'none';
            });
        }

        /**
         * Add component to selected slot
         */
        addComponent(componentType) {
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
            
            // Add the component
            const newComponent = sceneManager.addComponentToSlot(this.selectedSlotId, componentType);
            
            if (newComponent) {
                // If we have Unity access, create the actual component
                if (sceneManager.scene && typeof window.BS !== 'undefined') {
                    this.createUnityComponent(this.selectedSlotId, componentType);
                }
                
                // Hide menu
                this.hide();
                
                // Refresh properties panel
                document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                    detail: { slotId: this.selectedSlotId }
                }));
            }
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
            } catch (error) {
                console.error(`Failed to create Unity component ${componentType}:`, error);
            }
        }
    }
// })()