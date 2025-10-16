class TerminalWindowUI {
    constructor(ctx, windowName){
        log("TerminalUI", "constructor")
        this.ctx = ctx;
        this.windowName = windowName;
        this.held = false;
        this.lastParent = "Scene";
        this.user = SM.myName();
        this.container = null;
        this.contentArea = null;
        this.PaneEntity = null;
        this.doc = null;
        this.streamRef = null;
        this.streamListener = null;
        this.messageElements = [];
        this.scrollView = null;
        this.infoLabel = null;

        this.ctx.onLoaded = async ()=>{
            let {startingPosition, startingRotation} = await this.getStartingSpot();
            this.ctx._entity.Set("localPosition", {x: 0, y: 0, z: 0});
            this.PaneEntity = await AddEntity(this.ctx._entity.id, "UI")
            this.doc = await this.PaneEntity._bs.AddComponent(new BS.BanterUI(new BS.Vector2(512,512), false));
            this.doc.SetBackgroundColor(new BS.Vector4(0.00, 0.31, 0.89, 1));
            window.blankUI = this.doc;
            this.ctx._entity.Set("localPosition", startingPosition);
            this.ctx._entity.Set("localRotation", startingRotation);
            this.generateUI();
            this.setupFirebaseListener();

            log(`${this.windowName} UI`, "onLoaded")
        }

        this.ctx.onDestroy = async()=>{
            log(`${this.windowName} UI`, "onDestroy")
            this.cleanupFirebaseListener();
            if(this.PaneEntity){
                await RemoveEntity(this.PaneEntity.id)
            }
        }
    }

    generateUI(){
        if(this.container){
            this.container.Destroy();
        }
        log(`${this.windowName} UI`, "generating UI")
        this.container = this.doc.CreateVisualElement();
        this.container.style.display = "flex";
        this.container.style.flexDirection = "column";
        this.container.style.height = "100%";
        this.container.style.width = "100%";
        //container.style.backgroundColor = "red";

        // Create Windows-style header
        const header = this.doc.CreateVisualElement();
        header.style.display = "flex";
        header.style.flexDirection = "row";
        header.style.justifyContent = "space-between";
        header.style.backgroundColor = "#0051e5";
        header.style.paddingLeft = "8px";
        header.style.borderBottom = "1px solid #333";

        header.OnClick((e) => this.grabHandler(e))


        const title = this.doc.CreateLabel();
        title.text = this.windowName + " - Stream Chat";
        title.style.color = "#ffffff";
        title.style.fontSize = "14px";
        title.style.fontWeight = "bold";

        // Create a container for buttons
        const buttonContainer = this.doc.CreateVisualElement();
        buttonContainer.style.display = "flex";
        buttonContainer.style.flexDirection = "row";
        buttonContainer.style.gap = "4px";

        // Clear button
        const clearButton = this.doc.CreateLabel();
        clearButton.text = "Clear";
        clearButton.style.backgroundColor = "#ff9800";
        clearButton.style.color = "#ffffff";
        clearButton.style.border = "none";
        clearButton.style.borderRadius = "2px";
        clearButton.style.fontSize = "12px";
        clearButton.style.padding = "4px";
        clearButton.style.paddingRight = "8px";
        clearButton.style.paddingLeft = "8px";
        clearButton.style.cursor = "pointer";
        clearButton.OnClick(async () => {
            await this.clearAllMessages();
        });
        clearButton.OnMouseEnter(() => {
            clearButton.style.backgroundColor = "#f57c00";
        });
        clearButton.OnMouseLeave(() => {
            clearButton.style.backgroundColor = "#ff9800";
        });

        const closeButton = this.doc.CreateLabel();
        closeButton.text = "✕";
        closeButton.style.backgroundColor = "transparent";
        closeButton.style.color = "#ffffff";
        closeButton.style.border = "none";
        closeButton.style.borderRadius = "2px";
        closeButton.style.fontSize = "14px";
        closeButton.style.padding = "4px";
        closeButton.style.paddingRight = "8px";
        closeButton.style.paddingLeft = "8px";
        closeButton.style.cursor = "pointer";
        closeButton.OnClick(() => {
            this.DestroySelf();
        });
        closeButton.OnMouseEnter(() => {
            closeButton.style.backgroundColor = "#e81123";
        });
        closeButton.OnMouseLeave(() => {
            closeButton.style.backgroundColor = "transparent";
        });

        // Add buttons to button container
        buttonContainer.AppendChild(clearButton);
        buttonContainer.AppendChild(closeButton);

        header.AppendChild(title);
        header.AppendChild(buttonContainer);
        this.container.AppendChild(header);

        // Create scrollable content area for chat messages
        this.scrollView = this.doc.CreateScrollView();
        this.scrollView.style.flexGrow = "1";
        this.scrollView.style.margin = "4px";
        this.scrollView.style.backgroundColor = "#1e1e1e";
        this.scrollView.style.borderRadius = "4px";
        this.scrollView.style.padding = "8px";
        this.scrollView.verticalScrolling = true;
        this.scrollView.horizontalScrolling = false;

        // Create content area inside scroll view
        this.contentArea = this.doc.CreateVisualElement();
        this.contentArea.style.display = "flex";
        this.contentArea.style.flexDirection = "column";
        this.contentArea.style.gap = "8px";

        // Add a label indicating newest messages appear first
        this.infoLabel = this.doc.CreateLabel();
        this.infoLabel.text = "↓ Newest messages appear first ↓";
        this.infoLabel.style.color = "#888888";
        this.infoLabel.style.fontSize = "10px";
        this.infoLabel.style.textAlign = "center";
        this.infoLabel.style.marginBottom = "8px";
        this.infoLabel.style.paddingBottom = "4px";
        this.infoLabel.style.borderBottom = "1px solid #444444";
        this.contentArea.AppendChild(this.infoLabel);

        this.scrollView.AppendChild(this.contentArea);
        this.container.AppendChild(this.scrollView);
    }

    grabHandler(e){
        console.log("grabHandler", e.detail)
        if(this.held){
            this.ctx._entity.SetParent(this.lastParent)
        }else{
            console.log("click", e.detail)
            let rightHandHolderPath = "People/"+this.user+"/Trackers/RIGHT_HAND/Holder";
            let rightHandHolder = SM.getEntityById(rightHandHolderPath)
            console.log(`RIGHT_HAND HOLDER => ${rightHandHolderPath}`, rightHandHolder)
            if(!rightHandHolder){
                showNotification("Error: RIGHT_HAND Holder not found")
                return;
            }
            rightHandHolder.Set("position", e.detail.point)
            this.lastParent = this.ctx._entity.parentId;
            this.ctx._entity.SetParent(rightHandHolderPath)
        }
        this.held = !this.held;
    }

    async fetchTracker(name){
        try{
            // Use SM.getTracker or BS.GetTracker if available, or fallback to global
            let tracker = null;
            if (typeof SM !== 'undefined' && SM.getTracker) {
                tracker = await SM.getTracker(name);
            } else if (typeof BS !== 'undefined' && BS.GetTracker) {
                tracker = await BS.GetTracker(name);
            } else if (typeof GetTracker !== 'undefined') {
                tracker = await GetTracker(name);
            } else {
                throw new Error("GetTracker function not found");
            }
            return tracker;
        }catch(e){
            await new Promise(resolve => setTimeout(resolve, 500));
            return await this.fetchTracker(name);
        }
    }

    async getStartingSpot(){
        let headTracker = await this.fetchTracker("HEAD");
        let headPosition = headTracker.Get("localPosition");
        let headForward = TransformOps.Multiply(headTracker.Get("forward"), 1.75);
        let startingPosition = TransformOps.Add(headPosition, headForward);
        startingPosition.y -= 0.5;
        let startingRotation = lockQuaternionAxes(headTracker.Get("rotation"), true, false, true);
        return {startingPosition, startingRotation};
    }

    setupFirebaseListener() {
        try {
            // Check if networking and Firebase are available
            if (!window.networking || !window.networking.getDatabase) {
                console.warn("Firebase not available yet, retrying in 1 second...");
                setTimeout(() => this.setupFirebaseListener(), 1000);
                return;
            }

            const db = window.networking.getDatabase();
            if (!db) {
                console.warn("Firebase database not initialized yet, retrying...");
                setTimeout(() => this.setupFirebaseListener(), 1000);
                return;
            }

            // Set up the Firebase reference to the 'stream' path
            this.streamRef = db.ref('stream');

            // Clear existing messages first
            this.clearMessages();

            // Listen for child_added events (new messages)
            this.streamListener = this.streamRef.on('child_added', (snapshot) => {
                const messageData = snapshot.val();
                const messageId = snapshot.key;
                this.addMessage(messageId, messageData, true); // true = prepend for new messages
            });

            // Also get existing messages
            this.streamRef.once('value', (snapshot) => {
                const data = snapshot.val();
                log("STREAM DATA", data)
                if (data) {
                    // Convert to array and sort by timestamp if available
                    const messages = Object.entries(data).map(([key, value]) => ({
                        id: key,
                        ...value
                    }));

                    // Sort by timestamp in REVERSE order (most recent first)
                    messages.sort((a, b) => {
                        if (a.timestamp && b.timestamp) {
                            // Parse timestamp format: "timestamp-{number}-{number}"
                            const getTimestampValue = (ts) => {
                                const parts = ts.split('-');
                                return parts.length >= 2 ? parseInt(parts[1]) : 0;
                            };
                            return getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp); // Reversed
                        }
                        return b.id.localeCompare(a.id); // Reversed
                    });

                    // Clear and re-add all messages in reverse order
                    this.clearMessages();
                    messages.forEach(msg => {
                        this.addMessage(msg.id, msg);
                    });
                }
            });

            console.log(`${this.windowName} UI: Firebase listener setup for 'stream' reference`);
        } catch (error) {
            console.error("Error setting up Firebase listener:", error);
            // Retry in case of error
            setTimeout(() => this.setupFirebaseListener(), 2000);
        }
    }

    cleanupFirebaseListener() {
        if (this.streamRef && this.streamListener) {
            this.streamRef.off('child_added', this.streamListener);
            this.streamListener = null;
            this.streamRef = null;
            console.log(`${this.windowName} UI: Firebase listener cleaned up`);
        }
    }

    addMessage(messageId, messageData, prepend = false) {
        if (!this.contentArea || !this.doc) return;

        // Create message container
        const messageContainer = this.doc.CreateVisualElement();
        messageContainer.style.display = "flex";
        messageContainer.style.flexDirection = "column";
        messageContainer.style.padding = "8px";

        // Different styling for user vs assistant messages
        const isAssistant = messageData.role === "assistant";
        messageContainer.style.backgroundColor = isAssistant ? "#1a3a52" : "#2a2a2a";
        messageContainer.style.borderRadius = "4px";
        messageContainer.style.marginBottom = "4px";
        messageContainer.style.borderLeft = isAssistant ? "3px solid #4fc3f7" : "3px solid #4caf50";

        // Create header with role and timestamp
        const header = this.doc.CreateVisualElement();
        header.style.display = "flex";
        header.style.flexDirection = "row";
        header.style.justifyContent = "space-between";
        header.style.marginBottom = "4px";

        // Role label
        const roleLabel = this.doc.CreateLabel();
        roleLabel.text = messageData.role === "assistant" ? "Assistant" : "User";
        roleLabel.style.color = messageData.role === "assistant" ? "#4fc3f7" : "#4caf50";
        roleLabel.style.fontSize = "12px";
        roleLabel.style.fontWeight = "bold";

        // Timestamp label
        const timestampLabel = this.doc.CreateLabel();
        if (messageData.timestamp) {
            // Parse timestamp format: "timestamp-{number}-{number}"
            const timestampParts = messageData.timestamp.split('-');
            if (timestampParts.length >= 2) {
                const timestampValue = parseInt(timestampParts[1]) * 1000; // Convert to milliseconds
                const date = new Date(timestampValue);
                timestampLabel.text = date.toLocaleTimeString();
            } else {
                timestampLabel.text = messageData.timestamp;
            }
        } else {
            timestampLabel.text = "";
        }
        timestampLabel.style.color = "#888888";
        timestampLabel.style.fontSize = "10px";

        header.AppendChild(roleLabel);
        header.AppendChild(timestampLabel);

        // Parse and display content
        let contentText = "";
        if (messageData.content) {
            if (Array.isArray(messageData.content)) {
                // Process each content item
                contentText = messageData.content.map(item => {
                    if (typeof item === 'string') {
                        return item;
                    } else if (item && typeof item === 'object' && item.text) {
                        return item.text;
                    } else {
                        return JSON.stringify(item);
                    }
                }).join('\n');
            } else if (typeof messageData.content === 'string') {
                contentText = messageData.content;
            } else {
                contentText = JSON.stringify(messageData.content);
            }
        } else {
            contentText = JSON.stringify(messageData);
        }

        // Message content
        const contentLabel = this.doc.CreateLabel();
        contentLabel.text = contentText;
        contentLabel.style.color = "#ffffff";
        contentLabel.style.fontSize = "12px";
        contentLabel.style.wordWrap = "true";
        contentLabel.style.whiteSpace = "pre-wrap"; // Preserve line breaks

        messageContainer.AppendChild(header);
        messageContainer.AppendChild(contentLabel);

        // Add session ID if available
        if (messageData.session_id) {
            const sessionLabel = this.doc.CreateLabel();
            sessionLabel.text = `Session: ${messageData.session_id}`;
            sessionLabel.style.color = "#666666";
            sessionLabel.style.fontSize = "10px";
            sessionLabel.style.marginTop = "4px";
            messageContainer.AppendChild(sessionLabel);
        }

        // Add to content area - prepend for new messages, append for initial load
        if (prepend && this.messageElements.length > 0) {
            // Insert at the beginning if there are existing messages
            // Find the first message element (skip the info label)
            const firstMessage = this.messageElements[0]?.element;
            if (firstMessage) {
                this.contentArea.InsertBefore(messageContainer, firstMessage);
                this.messageElements.unshift({ id: messageId, element: messageContainer });
            } else {
                // Fallback to append
                this.contentArea.AppendChild(messageContainer);
                this.messageElements.push({ id: messageId, element: messageContainer });
            }
        } else {
            // Otherwise append normally
            this.contentArea.AppendChild(messageContainer);
            this.messageElements.push({ id: messageId, element: messageContainer });
        }

        // No auto-scroll needed since newest messages are at the top
    }

    clearMessages() {
        if (!this.contentArea || !this.doc) return;

        // Destroy all message elements
        this.messageElements.forEach(msg => {
            if (msg.element && msg.element.Destroy) {
                msg.element.Destroy();
            }
        });
        this.messageElements = [];

        // Re-create and re-add the info label if it was destroyed
        if (!this.infoLabel || !this.contentArea.children || this.contentArea.children.length === 0) {
            this.infoLabel = this.doc.CreateLabel();
            this.infoLabel.text = "↓ Newest messages appear first ↓";
            this.infoLabel.style.color = "#888888";
            this.infoLabel.style.fontSize = "10px";
            this.infoLabel.style.textAlign = "center";
            this.infoLabel.style.marginBottom = "8px";
            this.infoLabel.style.paddingBottom = "4px";
            this.infoLabel.style.borderBottom = "1px solid #444444";
            this.contentArea.AppendChild(this.infoLabel);
        }
    }

    async clearAllMessages() {
        try {
            // Clear the UI
            this.clearMessages();

            // Clear Firebase data using remove() which is the proper way to delete data
            if (this.streamRef) {
                console.log(`${this.windowName} UI: Clearing all messages from Firebase`);
                await this.streamRef.remove();
                console.log(`${this.windowName} UI: Firebase stream cleared`);
            }
        } catch (error) {
            console.error("Error clearing messages:", error);
        }
    }

    async DestroySelf(){
        log(`${this.windowName} UI`, "Destroying Terminal UI");
        await RemoveEntity(this.ctx._entity.id);
    }
}

this.UI = new TerminalWindowUI(this, "Terminal");


