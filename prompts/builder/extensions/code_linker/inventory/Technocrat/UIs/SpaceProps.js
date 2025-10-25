let container = null;
let publicContainer = null;
let protectedContainer = null;
let PaneEntity = null;
let doc = null;
let user = SM.myName();
let spaceStateListener = null;

// Helper to format values for display
let formatValue = (value) => {
    if (value === null || value === undefined) return "null";

    // Check for Vector3
    if (typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value) {
        return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`;
    }

    // Check for Color (has r, g, b properties)
    if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
        return `RGBA(${value.r.toFixed(2)}, ${value.g.toFixed(2)}, ${value.b.toFixed(2)}, ${value.a?.toFixed(2) || 1})`;
    }

    // Check for Quaternion (has x, y, z, w properties)
    if (typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value && 'w' in value) {
        // Convert to Euler angles for easier reading
        const euler = quaternionToEuler(value);
        return `Rot(${euler.x.toFixed(1)}°, ${euler.y.toFixed(1)}°, ${euler.z.toFixed(1)}°)`;
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
};

// Convert quaternion to euler angles (helper function)
let quaternionToEuler = (q) => {
    const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
    const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (q.w * q.y - q.z * q.x);
    const pitch = Math.abs(sinp) >= 1 ? Math.PI / 2 * Math.sign(sinp) : Math.asin(sinp);

    const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
    const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return {
        x: roll * 180 / Math.PI,
        y: pitch * 180 / Math.PI,
        z: yaw * 180 / Math.PI
    };
};

let generateUI = () => {
    if(container) {
        container.destroy();
    }

    container = doc.createElement();
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.height = "100%";
    container.style.width = "100%";

    // Windows-style title bar
    const titleBar = doc.createElement();
    titleBar.style.display = "flex";
    titleBar.style.flexDirection = "row";
    titleBar.style.justifyContent = "space-between";
    titleBar.style.alignItems = "center";
    titleBar.style.backgroundColor = "#1a1a2e";
    titleBar.style.padding = "8px 12px";
    titleBar.style.borderBottom = "2px solid #333";

    // Title
    const title = doc.createElement();
    title.text = "Space Properties";
    title.style.fontSize = "16px";
    title.style.fontWeight = "bold";
    title.style.color = "#ffffff";
    title.style.flex = "1";

    // Close button
    const closeButton = doc.CreateButton();
    closeButton.text = "✕";
    closeButton.style.backgroundColor = "transparent";
    closeButton.style.color = "#ffffff";
    closeButton.style.fontSize = "18px";
    closeButton.style.fontWeight = "bold";
    closeButton.style.padding = "4px 8px";
    closeButton.style.borderRadius = "4px";
    closeButton.style.border = "none";
    closeButton.style.cursor = "pointer";

    // Hover effect for close button
    closeButton.OnMouseEnter(() => {
        closeButton.style.backgroundColor = "#e74c3c";
    });

    closeButton.OnMouseLeave(() => {
        closeButton.style.backgroundColor = "transparent";
    });

    closeButton.OnClick(() => {
        DestroySelf();
    });

    titleBar.appendChild(title);
    titleBar.appendChild(closeButton);
    container.appendChild(titleBar);

    // Content area
    const contentArea = doc.createElement();
    contentArea.style.display = "flex";
    contentArea.style.flexDirection = "column";
    contentArea.style.flex = "1";
    contentArea.style.padding = "15px";
    contentArea.style.gap = "20px";
    contentArea.style.overflow = "auto";

    // Public Properties Section
    renderPropertiesSection("Public", net.state, "#4a9eff", contentArea);

    // // Protected Properties Section
    // renderPropertiesSection("Protected", spaceState.protected, "#ff9a4a", contentArea);

    // Update info at bottom
    const updateInfo = doc.createElement();
    updateInfo.text = "Updates on space state changes";
    updateInfo.style.fontSize = "10px";
    updateInfo.style.color = "#666666";
    updateInfo.style.marginTop = "10px";
    contentArea.appendChild(updateInfo);

    container.appendChild(contentArea);
};

let renderPropertiesSection = (type, props, color) => {
    // Section container
    const section = doc.createElement();
    section.style.display = "flex";
    section.style.flexDirection = "column";
    section.style.backgroundColor = "#1a1a1a";
    section.style.borderRadius = "8px";
    section.style.padding = "12px";
    section.style.marginBottom = "15px";

    // Section header
    const header = doc.createElement();
    header.style.display = "flex";
    header.style.flexDirection = "row";
    header.style.justifyContent = "space-between";
    header.style.marginBottom = "10px";
    header.style.borderBottom = `2px solid ${color}`;
    header.style.paddingBottom = "8px";

    const headerTitle = doc.createElement();
    headerTitle.text = `${type} Properties`;
    headerTitle.style.fontSize = "18px";
    headerTitle.style.fontWeight = "bold";
    headerTitle.style.color = color;

    const count = doc.createElement();
    count.text = `(${Object.keys(props).length})`;
    count.style.fontSize = "14px";
    count.style.color = "#888888";

    header.appendChild(headerTitle);
    header.appendChild(count);
    section.appendChild(header);

    // Properties list
    const propsList = doc.createElement();
    propsList.style.display = "flex";
    propsList.style.flexDirection = "column";
    propsList.style.gap = "8px";

    const propKeys = Object.keys(props).filter(key => {
        const value = props[key];
        return value !== "null" && value !== "undefined" && value !== null && value !== undefined;
    });

    if (propKeys.length === 0) {
        const emptyMessage = doc.createElement();
        emptyMessage.text = `No ${type.toLowerCase()} properties`;
        emptyMessage.style.color = "#666666";
        emptyMessage.style.fontStyle = "italic";
        emptyMessage.style.padding = "10px";
        propsList.appendChild(emptyMessage);
    } else {
        propKeys.forEach(key => {
            renderProperty(propsList, key, props[key], type);
        });
    }

    section.appendChild(propsList);
    container.appendChild(section);
};

let renderProperty = (parent, key, value, type) => {
    const propItem = doc.createElement();
    propItem.style.display = "flex";
    propItem.style.flexDirection = "row";
    propItem.style.backgroundColor = "#2a2a2a";
    propItem.style.borderRadius = "4px";
    propItem.style.padding = "8px";
    propItem.style.gap = "10px";
    propItem.style.alignItems = "center";

    // Property key
    const keyElement = doc.createElement();
    keyElement.text = key;
    keyElement.style.color = "#aaaaaa";
    keyElement.style.fontWeight = "bold";
    keyElement.style.minWidth = "120px";
    keyElement.style.fontSize = "14px";

    // Property value
    const valueElement = doc.createElement();
    const formattedValue = formatValue(value);
    valueElement.text = formattedValue;
    valueElement.style.color = "#ffffff";
    valueElement.style.fontSize = "14px";
    valueElement.style.flex = "1";

    // Add type indicator for complex values
    if (typeof value === 'object' && value !== null) {
        const typeIndicator = doc.createElement();
        typeIndicator.style.fontSize = "10px";
        typeIndicator.style.color = "#666666";
        typeIndicator.style.marginLeft = "auto";

        if ('x' in value && 'y' in value && 'z' in value && 'w' in value) {
            typeIndicator.text = "[Quaternion]";
        } else if ('x' in value && 'y' in value && 'z' in value) {
            typeIndicator.text = "[Vector3]";
        } else if ('r' in value && 'g' in value && 'b' in value) {
            typeIndicator.text = "[Color]";
        } else {
            typeIndicator.text = "[Object]";
        }

        propItem.appendChild(keyElement);
        propItem.appendChild(valueElement);
        propItem.appendChild(typeIndicator);
    } else {
        // Simple value type indicator
        const typeIndicator = doc.createElement();
        typeIndicator.style.fontSize = "10px";
        typeIndicator.style.color = "#666666";
        typeIndicator.style.marginLeft = "auto";
        typeIndicator.text = `[${typeof value}]`;

        propItem.appendChild(keyElement);
        propItem.appendChild(valueElement);
        propItem.appendChild(typeIndicator);
    }

    parent.appendChild(propItem);
};

this.onStart = async () => {
    log("SPACE PROPS UI", "Initializing Space Properties UI");

    let transform = this._entity.getTransform();
    let headTracker = await GetTracker("HEAD");
    let headTransform = headTracker.getTransform();
    let headPosition = headTransform._bs._localPosition;
    let headForward = TransformOps.Multiply(headTransform._bs.forward, 2.0);
    let startingPosition = TransformOps.Add(headPosition, headForward);
    let startingRotation = headTransform._bs._rotation;

    transform.Set("localPosition", {x: 0, y: 0, z: 0});
    PaneEntity = await AddEntity(this._entity.id, "UI");

    // Create UI document with larger size for more content
    doc = await PaneEntity._bs.AddComponent(new BS.BanterUI(new BS.Vector2(720, 1080), false));
    doc.SetBackgroundColor(new BS.Vector4(0.08, 0.08, 0.12, 0.95));

    // Position the UI in front of the player
    transform.Set("localPosition", startingPosition);
    transform.Set("localRotation", startingRotation);

    // Initial render
    generateUI();

    // Set up event listener for space state changes
    spaceStateListener = () => {
        if (doc) {
            generateUI();
        }
    };

    // Listen for space state changes (mimics the web inspector behavior)
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('spaceStateChanged', spaceStateListener);
    }

    // Handle click to toggle hold mode (similar to UndoStack)
    let held = false;
    let lastParent = "Scene";

    doc.gameObject.On("click", (e) => {
        if(held) {
            this._entity.SetParent(lastParent);
        } else {
            let tippyHolderPath = "People/" + user + "/Trackers/RIGHT_HAND/Holder";
            let tippyHolder = SM.getEntityById(tippyHolderPath);

            if(!tippyHolder) {
                log("SPACE PROPS UI", "RIGHT_HAND Holder not found");
                return;
            }

            tippyHolder.getTransform().Set("position", e.detail.point);
            lastParent = this._entity.parentId;
            this._entity.SetParent(tippyHolderPath);
        }
        held = !held;
    });

    log("SPACE PROPS UI", "Space Properties UI initialized successfully");
};

this.onDestroy = async () => {
    log("SPACE PROPS UI", "Destroying Space Properties UI");

    // Remove event listener
    if (spaceStateListener && typeof document !== 'undefined' && document.removeEventListener) {
        document.removeEventListener('spaceStateChanged', spaceStateListener);
        spaceStateListener = null;
    }

    // Destroy UI entity
    if(PaneEntity) {
        await RemoveEntity(PaneEntity.id);
    }
};

let DestroySelf = async ()=>{
    log("SPACE PROPS UI", "Destroying Space Properties UI");
    await RemoveEntity(this._entity.id);
}