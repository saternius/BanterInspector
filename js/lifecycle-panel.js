/**
 * Lifecycle Panel
 * Displays and manages active MonoBehavior scripts like a task manager
 */

// (async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : `${window.repoUrl}/js`;
    const { isVector3Object, isQuaternion, quaternionToEuler, formatNumber } = await import(`${basePath}/utils.js`);

    export class LifecyclePanel {
        constructor() {
            this.monobehaviors = new Map(); // Map of componentId -> monobehavior info
            this.selectedLogs = new Set(); // Set of componentIds that have logging enabled
            this.consoleBuffer = [];
            this.maxConsoleLines = 1000;
            this.setupEventListeners();
            this.refreshMonobehaviors();
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Listen for scene state changes
            document.addEventListener('sceneStateChanged', () => {
                this.refreshMonobehaviors();
            });

            // Listen for component changes
            document.addEventListener('componentChanged', (e) => {
                if (e.detail?.componentType === 'MonoBehavior') {
                    this.refreshMonobehaviors();
                }
            });

            // Listen for console output from MonoBehavior scripts
            document.addEventListener('monobehaviorConsoleOutput', (e) => {
                const { componentId, scriptName, output } = e.detail;
                if (this.selectedLogs.has(componentId)) {
                    this.addConsoleOutput(scriptName, output);
                }
            });
        }

        /**
         * Refresh the list of monobehaviors from the scene
         */
        async refreshMonobehaviors() {
            this.monobehaviors.clear();
            
            // Find all MonoBehavior components in the scene
            const allSlots = this.getAllSlots(SM.scene.root);
            
            for (const slot of allSlots) {
                if (slot.components) {
                    for (const component of slot.components) {
                        if (component.componentType === 'MonoBehavior' || component.componentType === 'monobehavior') {
                            const scriptName = component.properties?.scriptPath || 'Unknown Script';
                            const componentId = component.id || component.componentId;
                            
                            // Get existing info or create new
                            let info = this.monobehaviors.get(componentId) || {
                                id: componentId,
                                scriptName: scriptName.split('/').pop().replace('.js', ''),
                                fullScriptPath: scriptName,
                                slots: [],
                                component: component,
                                isRunning: true // Assume running by default
                            };
                            
                            // Add slot to the list
                            info.slots.push(slot.name || 'Unnamed Slot');
                            
                            this.monobehaviors.set(componentId, info);
                        }
                    }
                }
            }
            
            this.render();
        }

        /**
         * Get all slots recursively
         */
        getAllSlots(slot, result = []) {
            if (!slot) return result;
            
            result.push(slot);
            
            if (slot.children) {
                for (const child of slot.children) {
                    this.getAllSlots(child, result);
                }
            }
            
            return result;
        }

        /**
         * Render the lifecycle panel
         */
        render() {
            const listElement = document.getElementById('lifecycleList');
            if (!listElement) return;
            
            listElement.innerHTML = '';
            
            if (this.monobehaviors.size === 0) {
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
                    <th>Usage</th>
                    <th>Log</th>
                    <th>Actions</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Create body
            const tbody = document.createElement('tbody');
            
            for (const [componentId, info] of this.monobehaviors) {
                const row = this.createMonobehaviorRow(componentId, info);
                tbody.appendChild(row);
            }
            
            table.appendChild(tbody);
            listElement.appendChild(table);
        }

        /**
         * Create a row for a monobehavior
         */
        createMonobehaviorRow(componentId, info) {
            const row = document.createElement('tr');
            row.className = 'lifecycle-row';
            
            // Name column
            const nameCell = document.createElement('td');
            nameCell.className = 'lifecycle-name';
            nameCell.textContent = info.scriptName;
            nameCell.title = info.fullScriptPath;
            
            // Usage column
            const usageCell = document.createElement('td');
            usageCell.className = 'lifecycle-usage';
            const slotsText = info.slots.join(', ');
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
            logCheckbox.checked = this.selectedLogs.has(componentId);
            logCheckbox.onchange = () => this.toggleLogging(componentId, logCheckbox.checked);
            logCell.appendChild(logCheckbox);
            
            // Actions column
            const actionsCell = document.createElement('td');
            actionsCell.className = 'lifecycle-actions';
            
            // Stop button
            const stopBtn = document.createElement('button');
            stopBtn.className = 'lifecycle-button stop';
            stopBtn.innerHTML = '⏹';
            stopBtn.title = 'Stop';
            stopBtn.onclick = () => this.stopMonobehavior(componentId, info);
            
            // Refresh button
            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'lifecycle-button refresh';
            refreshBtn.innerHTML = '🔄';
            refreshBtn.title = 'Refresh';
            refreshBtn.onclick = () => this.refreshMonobehavior(componentId, info);
            
            actionsCell.appendChild(stopBtn);
            actionsCell.appendChild(refreshBtn);
            
            row.appendChild(nameCell);
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
            } else {
                this.selectedLogs.delete(componentId);
            }
        }

        /**
         * Stop a monobehavior
         */
        async stopMonobehavior(componentId, info) {
            try {
                // Call stop on the component
                if (info.component && info.component.stop) {
                    await info.component.stop();
                }
                
                // Update UI
                info.isRunning = false;
                this.addConsoleOutput(info.scriptName, '[Stopped]');
                this.render();
            } catch (error) {
                console.error('Failed to stop monobehavior:', error);
                this.addConsoleOutput(info.scriptName, `[Error stopping: ${error.message}]`);
            }
        }

        /**
         * Refresh a monobehavior
         */
        async refreshMonobehavior(componentId, info) {
            try {
                // Call refresh on the component
                if (info.component && info.component.refresh) {
                    await info.component.refresh();
                }
                
                // Update UI
                info.isRunning = true;
                this.addConsoleOutput(info.scriptName, '[Refreshed]');
                this.render();
            } catch (error) {
                console.error('Failed to refresh monobehavior:', error);
                this.addConsoleOutput(info.scriptName, `[Error refreshing: ${error.message}]`);
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