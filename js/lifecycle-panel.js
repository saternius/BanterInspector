/**
 * Lifecycle Panel
 * UI for displaying and managing MonoBehavior scripts from lifecycle-manager
 */

// (async () => {
    const { isVector3Object, isQuaternion, quaternionToEuler, formatNumber } = await import(`${window.repoUrl}/js/utils.js`);
    const { lifecycle } = await import(`${window.repoUrl}/js/lifecycle-manager.js`);

    export class LifecyclePanel {
        constructor() {
            this.selectedLogs = new Set(); // Set of componentIds that have logging enabled
            this.consoleBuffer = [];
            this.maxConsoleLines = 1000;
            this.setupEventListeners();
            this.render();
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Listen for lifecycle manager changes
            document.addEventListener('monobehaviorRegistered', () => {
                this.render();
            });

            document.addEventListener('monobehaviorUnregistered', () => {
                this.render();
            });

            // Listen for scene state changes
            document.addEventListener('sceneStateChanged', () => {
                this.render();
            });

            // Listen for component changes
            document.addEventListener('componentChanged', (e) => {
                if (e.detail?.componentType === 'MonoBehavior') {
                    this.render();
                }
            });

            // Override console.log to capture MonoBehavior output
            // const originalLog = console.log;
            // console.log = (...args) => {
            //     // Call original console.log
            //     originalLog.apply(console, args);
                
            //     // Check if this is from a MonoBehavior context
            //     const stack = new Error().stack;
            //     if (stack && stack.includes('MonoBehavior')) {
            //         // Try to extract component ID from the log
            //         lifecycle.monoBehaviors.forEach((monoBehavior, componentId) => {
            //             if (this.selectedLogs.has(componentId)) {
            //                 const scriptName = monoBehavior.properties?.file || monoBehavior.properties?.name || 'Unknown';
            //                 this.addConsoleOutput(scriptName, args.join(' '));
            //             }
            //         });
            //     }
            // };
        }

        /**
         * Get slot information for a MonoBehavior
         */
        getSlotInfo(monoBehavior) {
            // MonoBehavior component has a direct reference to its slot
            if (monoBehavior._slot) {
                return [monoBehavior._slot.name || 'Unnamed Slot'];
            }
            return ['No slot'];
        }

        /**
         * Render the lifecycle panel
         */
        render() {
            const listElement = document.getElementById('lifecycleList');
            if (!listElement) return;
            
            listElement.innerHTML = '';
            let monoBehaviors = SM.getAllMonoBehaviors();
            if (monoBehaviors.length === 0) {
                listElement.innerHTML = '<div class="empty-lifecycle">No active MonoBehavior scripts</div>';
                return;
            }
            
            // Create table
            const table = document.createElement('table');
            table.className = 'lifecycle-table';
            
            // Create header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>Usage</th>
                    <th>Log</th>
                    <th>Actions</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Create body
            const tbody = document.createElement('tbody');
            
            monoBehaviors.forEach((monoBehavior) => {
                const row = this.createMonobehaviorRow(monoBehavior);
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            listElement.appendChild(table);
        }

        /**
         * Create a row for a monobehavior
         */
        createMonobehaviorRow(monoBehavior) {
            const row = document.createElement('tr');
            row.className = 'lifecycle-row';
            
            // Name column
            const nameCell = document.createElement('td');
            nameCell.className = 'lifecycle-name';
            const scriptName = monoBehavior.properties?.file || monoBehavior.properties?.name || 'Unknown Script';
            nameCell.textContent = scriptName;
            nameCell.title = `Script: ${monoBehavior.properties?.file || 'No script'}`;
            nameCell.style.cursor = 'pointer';
            nameCell.onclick = () => {
                console.log("editButton clicked =>", monoBehavior.properties.file)
                    const scriptItem = window.inventory.items[monoBehavior.properties.file];
                    if (scriptItem && scriptItem.itemType === 'script') {
                        const event = new CustomEvent('open-script-editor', {
                            detail: {
                                name: monoBehavior.properties.file,
                                content: scriptItem.data,
                                author: scriptItem.author,
                                created: scriptItem.created
                            }
                        });
                        window.dispatchEvent(event);
                    }
            }


            // Owner column
            const ownerCell = document.createElement('td');
            ownerCell.className = 'lifecycle-owner';
            ownerCell.textContent = monoBehavior.properties?._owner || 'Unknown Owner';
            ownerCell.title = `Owner: ${monoBehavior.properties?._owner || 'No owner'}`;
            ownerCell.style.cursor = 'pointer';
            ownerCell.onclick = () => {
                SetComponentProp(monoBehavior.id, "_owner", SM.myName());
                setTimeout(()=>{
                    this.render();
                }, 150)
            }
            
            // Usage column
            const usageCell = document.createElement('td');
            usageCell.className = 'lifecycle-usage';
            const slots = this.getSlotInfo(monoBehavior);
            const slotsText = slots.join(', ') || 'No slots';
            if (slotsText.length > 32) {
                usageCell.textContent = slotsText.substring(0, 32) + '...';
                usageCell.title = slotsText;
            } else {
                usageCell.textContent = slotsText;
            }
            
            // Log checkbox column
            const logCell = document.createElement('td');
            logCell.className = 'lifecycle-log';
            const logCheckbox = document.createElement('input');
            logCheckbox.type = 'checkbox';
            logCheckbox.checked = this.selectedLogs.has(monoBehavior.id);
            logCheckbox.onchange = () => this.toggleLogging(monoBehavior.id, logCheckbox.checked);
            logCell.appendChild(logCheckbox);
            
            // Actions column
            const actionsCell = document.createElement('td');
            actionsCell.className = 'lifecycle-actions';
            
            // Stop button
            const stopBtn = document.createElement('button');
            stopBtn.className = 'lifecycle-button stop';
            stopBtn.innerHTML = '⏹';
            stopBtn.title = 'Stop';
            if(monoBehavior.ctx._running){
                stopBtn.onclick = () => {
                    monoBehavior.Stop();
                    this.addConsoleOutput(scriptName, '[Stopped]');
                    this.render();
                }
            }else{
                stopBtn.disabled = true;
                stopBtn.title = 'Not running';
                stopBtn.style.opacity = 0.25;
                stopBtn.style.pointerEvents = 'none';
            }
            
            // Refresh button
            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'lifecycle-button refresh';
            refreshBtn.innerHTML = '🔄';
            refreshBtn.title = 'Refresh';
            refreshBtn.onclick = () => {
                monoBehavior.Refresh();
                this.addConsoleOutput(scriptName, '[Refreshed]');
                this.render();
            }
            
            actionsCell.appendChild(stopBtn);
            actionsCell.appendChild(refreshBtn);
            
            row.appendChild(nameCell);
            row.appendChild(ownerCell);
            row.appendChild(usageCell);
            row.appendChild(logCell);
            row.appendChild(actionsCell);
            
            return row;
        }

        /**
         * Toggle logging for a monobehavior
         */
        toggleLogging(componentId, enabled) {
            if (enabled) {
                this.selectedLogs.add(componentId);
                // Add initial message
                const monoBehavior = lifecycle.monoBehaviors.get(componentId);
                if (monoBehavior) {
                    const scriptName = monoBehavior.properties?.file || monoBehavior.properties?.name || 'Unknown';
                    this.addConsoleOutput(scriptName, '[Logging enabled]');
                }
            } else {
                this.selectedLogs.delete(componentId);
            }
        }


        /**
         * Add output to the console
         */
        addConsoleOutput(scriptName, output) {
            const timestamp = new Date().toLocaleTimeString();
            const entry = {
                timestamp,
                scriptName,
                output,
                formatted: `[${scriptName}]: ${output}`
            };
            
            this.consoleBuffer.push(entry);
            
            // Limit buffer size
            if (this.consoleBuffer.length > this.maxConsoleLines) {
                this.consoleBuffer.shift();
            }
            
            this.renderConsole();
        }

        /**
         * Render the console output
         */
        renderConsole() {
            const consoleElement = document.getElementById('lifecycleConsole');
            if (!consoleElement) return;
            
            // Clear and rebuild console
            consoleElement.innerHTML = '';
            
            for (const entry of this.consoleBuffer) {
                const line = document.createElement('div');
                line.className = 'console-line';
                
                const time = document.createElement('span');
                time.className = 'console-time';
                time.textContent = entry.timestamp;
                
                const content = document.createElement('span');
                content.className = 'console-content';
                content.textContent = entry.formatted;
                
                line.appendChild(time);
                line.appendChild(content);
                consoleElement.appendChild(line);
            }
            
            // Auto-scroll to bottom
            consoleElement.scrollTop = consoleElement.scrollHeight;
        }

        /**
         * Clear the console
         */
        clearConsole() {
            this.consoleBuffer = [];
            this.renderConsole();
        }
    }

    // Export for global access
    window.LifecyclePanel = LifecyclePanel;
//})()