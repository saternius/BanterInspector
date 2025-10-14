//tests
this.default = {}
this.vars = {}


const mockTooltipContent = {
    'navigation': {
        title: 'Navigation Bar',
        description: 'The main navigation bar lets you switch between different sections of the inspector.',
        tips: ['Click on tabs to switch views', 'The active tab is highlighted']
    },
};

let tooltipContent = {
    "data-page": {
        "world-inspector": {
            "title": "World Inspector",
            "description": "Main view for editing GameObjects and components in your VR scene",
            "tips": ["Select objects in the hierarchy to edit properties", "Add components to customize behavior", "Use space properties for persistent data"]
        },
        "inventory": {
            "title": "Inventory",
            "description": "Personal storage for GameObjects, scripts, and assets",
            "tips": ["Drag items from scene to save them", "Organize with folders", "Double-click scripts to edit", "Items sync to Firebase cloud"]
        },
        "feedback": {
            "title": "Feedback System",
            "description": "Submit bug reports and feature requests to improve the inspector",
            "tips": ["Use voice recording for detailed feedback", "AI refines text into actionable statements", "Track ticket status and add comments"]
        },
        "script-editor-*": {
            "title": "Script Editor",
            "description": "Built-in code editor for JavaScript/BanterScript development",
            "tips": ["Ctrl+S to save changes", "View console output below", "Scripts auto-reload when saved"]
        }
    },
    "data-toggle": {
        "command": {
            "title": "Command Console",
            "description": "Toggle command line interface output in the console",
            "tips": ["Shows commands executed through the inspector", "Useful for debugging actions", "Type commands in the input below"]
        },
        "script": {
            "title": "Script Output",
            "description": "Toggle JavaScript console.log output from running scripts",
            "tips": ["Monitor script execution", "Debug MonoBehavior scripts", "See error messages and warnings"]
        },
        "oneShot": {
            "title": "OneShot Events",
            "description": "Toggle network sync messages between connected clients",
            "tips": ["Shows real-time multiplayer sync", "Useful for debugging networked objects", "Monitors state changes across users"]
        },
        "spaceProps": {
            "title": "Space Properties",
            "description": "Toggle space property change notifications",
            "tips": ["See when properties are updated", "Monitor public/protected values", "Track persistent data changes"]
        }
    },
    "data-component": {
        "Box": {
            "title": "Box Mesh",
            "description": "Creates a 3D cube/box primitive mesh",
            "tips": ["Adjust size with scale property", "Good for walls, floors, platforms", "Combine with colliders for physics"]
        },
        "Sphere": {
            "title": "Sphere Mesh",
            "description": "Creates a 3D sphere primitive mesh",
            "tips": ["Perfect for balls, planets, bubbles", "Use segments to control smoothness", "Works well with rigidbody physics"]
        },
        "Circle": {
            "title": "Circle Mesh",
            "description": "Creates a flat 2D circle mesh",
            "tips": ["Useful for discs, portals, platforms", "Segments control edge smoothness", "Single-sided by default"]
        },
        "Cone": {
            "title": "Cone Mesh",
            "description": "Creates a 3D cone primitive mesh",
            "tips": ["Good for markers, arrows, trees", "Adjust height and radius", "Bottom is open by default"]
        },
        "Cylinder": {
            "title": "Cylinder Mesh",
            "description": "Creates a 3D cylinder primitive mesh",
            "tips": ["Perfect for pillars, tubes, barrels", "Control segment count for smoothness", "Has caps on both ends"]
        },
        "Torus": {
            "title": "Torus Mesh",
            "description": "Creates a 3D donut-shaped mesh",
            "tips": ["Adjust tube and ring radius", "Good for rings, loops, decorative elements", "Control segments for detail"]
        },
        "Plane": {
            "title": "Plane Mesh",
            "description": "Creates a flat rectangular surface",
            "tips": ["Perfect for floors, walls, screens", "Single-sided rendering", "Use for UI backgrounds"]
        },
        "Ring": {
            "title": "Ring Mesh",
            "description": "Creates a flat ring/annulus shape",
            "tips": ["Adjust inner and outer radius", "Good for UI elements, targets", "Segments control smoothness"]
        },
        "Geometry": {
            "title": "Procedural Geometry",
            "description": "Advanced procedural mesh generation",
            "tips": ["Create complex shapes programmatically", "Supports various geometry types", "Highly customizable vertices"]
        },
        "InvertedMesh": {
            "title": "Inverted Mesh",
            "description": "Creates a mesh with inverted normals facing inward",
            "tips": ["Perfect for skyboxes and rooms", "View from inside the mesh", "Combine with textures for environments"]
        },
        "Text": {
            "title": "3D Text",
            "description": "Displays text as 3D geometry in the scene",
            "tips": ["Supports custom fonts and colors", "Adjust alignment and size", "Can be made interactive with colliders"]
        },
        "Material": {
            "title": "Material",
            "description": "Controls the visual appearance and rendering of meshes",
            "tips": ["Apply textures and colors", "Adjust transparency and emission", "Control metallic and roughness values"]
        },
        "PhysicMaterial": {
            "title": "Physics Material",
            "description": "Defines physical properties like friction and bounciness",
            "tips": ["Control how objects slide and bounce", "Apply to colliders for realistic physics", "Combine with rigidbodies"]
        },
        "Rigidbody": {
            "title": "Rigidbody",
            "description": "Enables physics simulation with gravity and forces",
            "tips": ["Required for moving physics objects", "Control mass and drag", "Use kinematic for animated objects"]
        },
        "BoxCollider": {
            "title": "Box Collider",
            "description": "Box-shaped collision boundary for physics interactions",
            "tips": ["Most efficient collider type", "Adjust size and center offset", "Use Is Trigger for detection zones"]
        },
        "SphereCollider": {
            "title": "Sphere Collider",
            "description": "Spherical collision boundary for round objects",
            "tips": ["Very efficient for physics", "Perfect for balls and projectiles", "Adjust radius to fit mesh"]
        },
        "CapsuleCollider": {
            "title": "Capsule Collider",
            "description": "Pill-shaped collider ideal for characters",
            "tips": ["Standard for player avatars", "Smooth movement over terrain", "Adjust height and radius"]
        },
        "MeshCollider": {
            "title": "Mesh Collider",
            "description": "Precise collision using actual mesh geometry",
            "tips": ["Most accurate but expensive", "Enable convex for rigidbodies", "Good for complex static geometry"]
        },
        "ConfigurableJoint": {
            "title": "Configurable Joint",
            "description": "Flexible physics constraint between objects",
            "tips": ["Create hinges, springs, chains", "Limit movement and rotation", "Combine multiple for complex rigs"]
        },
        "GLTF": {
            "title": "GLTF Model Loader",
            "description": "Loads 3D models from GLTF/GLB files",
            "tips": ["Supports animations and materials", "Use URLs or inventory paths", "Efficient format for web delivery"]
        },
        "AudioSource": {
            "title": "Audio Source",
            "description": "Plays sound effects and music in 3D space",
            "tips": ["Supports spatial audio", "Loop for background music", "Adjust volume and pitch"]
        },
        "VideoPlayer": {
            "title": "Video Player",
            "description": "Displays video content on surfaces",
            "tips": ["Supports streaming URLs", "Apply to planes or screens", "Control playback with scripts"]
        },
        "Billboard": {
            "title": "Billboard",
            "description": "Makes objects always face the camera",
            "tips": ["Perfect for UI elements in 3D", "Good for name tags and labels", "Can lock specific axes"]
        },
        "Mirror": {
            "title": "Mirror",
            "description": "Creates a real-time reflective surface",
            "tips": ["Shows player avatars", "Adjust reflection quality", "Performance intensive - use sparingly"]
        },
        "Browser": {
            "title": "Web Browser",
            "description": "Embeds interactive web content in the scene",
            "tips": ["Display websites and web apps", "Supports user interaction", "Useful for dashboards and info panels"]
        },
        "AssetBundle": {
            "title": "Asset Bundle",
            "description": "Loads Unity asset bundles with custom content",
            "tips": ["Import complex Unity assets", "Supports prefabs and materials", "Platform-specific bundles"]
        },
        "WorldObject": {
            "title": "World Object",
            "description": "Reference to persistent world objects",
            "tips": ["Links to pre-existing scene objects", "Survives scene reloads", "Used for world-level features"]
        },
        "StreetView": {
            "title": "Street View",
            "description": "Displays Google Street View panoramas",
            "tips": ["Explore real-world locations", "360-degree navigation", "Requires coordinates or address"]
        },
        "KitItem": {
            "title": "Kit Item",
            "description": "Marks objects as part of a reusable kit",
            "tips": ["Bundle related objects together", "Save as templates", "Share kits with other users"]
        },
        "Portal": {
            "title": "Portal",
            "description": "Creates a gateway to other spaces or locations",
            "tips": ["Teleport between spaces", "Set destination URL", "Add visual effects for immersion"]
        },
        "ColliderEvents": {
            "title": "Collider Events",
            "description": "Triggers custom events on collision or trigger entry",
            "tips": ["Detect player interactions", "Create trigger zones", "Use with scripts for game logic"]
        },
        "AttachedObject": {
            "title": "Attached Object",
            "description": "Attaches objects to player body parts",
            "tips": ["Create wearable items", "Attach to hands, head, body", "Follows player movement"]
        },
        "SyncedObject": {
            "title": "Synced Object",
            "description": "Synchronizes object state across all connected users",
            "tips": ["Essential for multiplayer", "Syncs position and rotation", "Owner can transfer control"]
        },
        "GrabHandle": {
            "title": "Grab Handle",
            "description": "Makes objects grabbable and moveable by players",
            "tips": ["Enable VR hand interaction", "Set grab points and offsets", "Combine with physics for realism"]
        },
        "HeldEvents": {
            "title": "Held Events",
            "description": "Detects input while object is being held",
            "tips": ["Trigger actions on button press", "Create interactive tools", "Works with grab handles"]
        },
        "MonoBehavior": {
            "title": "MonoBehavior Script",
            "description": "Runs custom JavaScript code with lifecycle methods",
            "tips": ["Write game logic in JavaScript", "Access onStart, onUpdate, onDestroy", "Load scripts from inventory"]
        }
    },
    "data-type": {
        "feature": {
            "title": "Feature Request",
            "description": "Suggest new functionality for the inspector",
            "tips": ["Describe the use case", "Explain expected behavior", "Include examples if possible"]
        },
        "bug": {
            "title": "Bug Report",
            "description": "Report issues or unexpected behavior",
            "tips": ["Include steps to reproduce", "Describe expected vs actual", "Note any error messages"]
        },
        "improvement": {
            "title": "Improvement Idea",
            "description": "Suggest enhancements to existing features",
            "tips": ["Explain current limitations", "Propose specific improvements", "Consider user experience"]
        }
    },
    "data-toolbar-btn": {
        "undoBtn": {
            "title": "Undo",
            "description": "Reverts the last action performed",
            "tips": ["Keyboard shortcut: Ctrl+Z", "Tracks all scene changes", "Multiple undo levels supported"]
        },
        "redoBtn": {
            "title": "Redo",
            "description": "Reapplies a previously undone action",
            "tips": ["Keyboard shortcut: Ctrl+Shift+Z", "Available after undo", "Maintains action history"]
        },
        "saveBtn": {
            "title": "Save Scene",
            "description": "Saves the current scene state",
            "tips": ["Saves all current changes to localStorage."]
        },
        "fileServer":{
            "title": "File Server Selection",
            "description": "Choose where inspector files are loaded from",
            "tips": ["Stable: Production CDN", "Ngrok: Development tunnel", "Local: Local network server"]
        },
        "hardResetBtn":{
            "title": "Hard Reset",
            "description": "Resets the scene to an empty state",
            "tips": ["Deletes all unsaved changes", "Returns to initial state", "Cannot be undone"]
        }
    },
    "data-panel": {
        "hierarchyPanel": {
            "title": "Scene Hierarchy",
            "description": "Tree view of all GameObjects in the scene",
            "tips": ["Click to select objects", "Drag to reparent", "Right-click for context menu"]
        },
        "propertiesPanel": {
            "title": "Properties Panel",
            "description": "Edit components and values of selected GameObject",
            "tips": ["Modify transform, materials, scripts", "Add/remove components", "Real-time updates"]
        },
        "propertyPanelComponent":{
            "title": "Component Section",
            "description": "Individual component with its properties",
            "tips": ["Click header to expand/collapse", "Use arrows to reorder", "X button to remove"]
        },
        "propertyPanelComponentProperty":{
            "title": "Component Property",
            "description": "Editable field for a component value",
            "tips": ["Click to edit inline", "Press Enter to confirm", "Esc to cancel changes"]
        },
        "propertyPanelCollapseAllBtn":{
            "title": "Collapse All",
            "description": "Collapses all expanded component sections",
            "tips": ["Simplify view when many components", "Quick overview mode", "Click headers to re-expand"]
        },
        "propertyPanelAddComponent":{
            "title": "Add Component",
            "description": "Opens menu to add new components to GameObject",
            "tips": ["Browse by category", "Search for specific components", "Click to add instantly"]
        },
        "spacePropsPanel": {
            "title": "Space Properties",
            "description": "Persistent key-value storage for the space",
            "tips": ["Data persists between sessions", "Accessible by scripts", "Syncs across all users"]
        },
        "spacePropsPanelRefreshBtn":{
            "title": "Refresh Properties",
            "description": "Reloads space properties from server",
            "tips": ["Updates to latest values", "Syncs with other users", "Clears local cache"]
        },
        "propertyPanelAddPublicProp":{
            "title": "Add Public Property",
            "description": "Creates a new public space property",
            "tips": ["Accessible by all users", "Enter key and value", "Used for shared game state"]
        },
        "propertyPanelAddProtectedProp":{
            "title": "Add Protected Property",
            "description": "Creates admin-only space property",
            "tips": ["Only admins can modify", "All users can read", "Good for configuration"]
        },
        "lifecyclePanelRefreshBtn":{
            "title": "Refresh Lifecycle",
            "description": "Updates the list of active scripts",
            "tips": ["Shows latest script status", "Refreshes ownership info", "Clears stale entries"]
        },
        "lifecyclePanelClearConsoleBtn":{
            "title": "Clear Console",
            "description": "Removes all messages from console output",
            "tips": ["Clean up cluttered logs", "Start fresh debugging", "Doesn't affect script execution"]
        },
        "componentMenuCloseBtn":{
            "title": "Close Menu",
            "description": "Closes the component selection menu",
            "tips": ["Press Escape key also works", "Click outside to close", "Returns to properties panel"]
        },
        "lifecyclePanel":{
            "title": "Lifecycle Panel",
            "description": "Manages running MonoBehavior scripts and console",
            "tips": ["View active scripts", "Monitor console output", "Control script ownership"]
        }
    },
    "data-section": {
        "hierarchyTree": {
            "title": "Hierarchy Tree",
            "description": "Interactive tree of scene GameObjects",
            "tips": ["Expand/collapse with arrows", "Multi-select with Ctrl", "Search filters the tree"]
        },
        "publicPropsSection": {
            "title": "Public Properties Section",
            "description": "Space properties accessible by all users",
            "tips": ["Anyone can read and write", "Good for game scores", "Persists between sessions"]
        },
        "protectedPropsSection": {
            "title": "Protected Properties Section",
            "description": "Admin-controlled space properties",
            "tips": ["Only admins can edit", "All users can read", "Use for game settings"]
        },
        "lifecycleList": {
            "title": "Active Scripts List",
            "description": "Shows all running MonoBehavior scripts",
            "tips": [
                "If you have the script saved to your inventory, you can edit it by clicking the script name", 
                "Owner is who is currently running the script. If you have the script saved to your inventory, you can take ownership by clicking the current owner", 
                "Log: Whether the script is logging to the console", 
                "Usage: Current entity that script is attached to",
                "Stop and Restart scripts with action buttons"
            ]
        },
        "cmdConsole": {
            "title": "Command Console",
            "description": "Output from scripts and system messages",
            "tips": ["Toggle message types", "Execute commands directly", "Debug script behavior"]
        }
    },
    "data-hierarchy-btn": {
        "addChildEntityBtn": {
            "title": "Add Child",
            "description": "Creates a new empty GameObject as child",
            "tips": ["Child inherits parent transform", "Good for organizing", "Starts with default transform"]
        },
        "cloneEntityBtn": {
            "title": "Clone Entity",
            "description": "Duplicates selected GameObject with all components",
            "tips": ["Copies all properties", "Includes child objects", "Useful for creating variations"]
        },
        "deleteEntityBtn": {
            "title": "Delete Entity",
            "description": "Removes GameObject and children from scene",
            "tips": ["Cannot be undone easily", "Deletes all children too", "Use Ctrl+Z to undo"]
        },
        "saveEntityBtn": {
            "title": "Save to Inventory",
            "description": "Stores GameObject in inventory for reuse",
            "tips": ["Creates reusable prefab", "Saves all components", "Access from inventory tab"]
        }
    },
    "data-feedback":{
        "feedbacMicButton": {
            "title": "Voice Recording",
            "description": "Record feedback using your microphone",
            "tips": ["Click to start/stop recording", "Uses Azure Speech to Text", "AI will refine your message"]
        },
        "feedbackClearDraftBtn": {
            "title": "Clear Draft",
            "description": "Removes AI-generated refinement draft",
            "tips": ["Start over with new text", "Keeps original input", "Resets statement blocks"]
        },
        "feedbackSubmitBtn": {
            "title": "Submit Feedback",
            "description": "Sends your feedback to the development team",
            "tips": ["Creates a tracked ticket", "Saves to Firebase", "You'll get a ticket ID"]
        },
        "feedbackSubmitOriginalBtn": {
            "title": "Submit Original",
            "description": "Submits your unmodified feedback text",
            "tips": ["Uses your exact words", "Skips AI refinement", "Good for technical details"]
        },
        "feedbackSubmitRefinementBtn": {
            "title": "Submit Refinement",
            "description": "Submits the AI-refined version",
            "tips": ["Uses structured statements", "Clearer for developers", "Preserves your intent"]
        },
        "feedbackFixWithVoiceBtn": {
            "title": "Fix with Voice",
            "description": "Re-record to improve the refinement",
            "tips": ["Add missing details", "Clarify ambiguous points", "Builds on existing draft"]
        },
        "feedbackRefreshTicketsBtn": {
            "title": "Refresh Tickets",
            "description": "Reloads the ticket list from server",
            "tips": ["See latest updates", "Check for responses", "Updates status changes"]
        },
        "feedbackTicketFilterType": {
            "title": "Filter by Type",
            "description": "Show only specific feedback types",
            "tips": ["Features, bugs, or ideas", "Helps find similar issues", "Reduces duplicate reports"]
        },
        "feedbackTicketFilterStatus": {
            "title": "Filter by Status",
            "description": "Show tickets in specific states",
            "tips": ["Open, QA, Resolved", "Track progress", "See what's being worked on"]
        },
        "feedbackTicketDetailModalCloseBtn": {
            "title": "Close Details",
            "description": "Closes the ticket detail view",
            "tips": ["Returns to ticket list", "Changes are saved", "Press Escape also works"]
        },
        "feedbackTicketEditModalCloseBtn": {
            "title": "Close Editor",
            "description": "Closes ticket edit modal",
            "tips": ["Discards unsaved changes", "Returns to detail view", "Save first if needed"]
        },
        "feedbackTicketEditModalSaveBtn": {
            "title": "Save Changes",
            "description": "Updates the ticket with your edits",
            "tips": ["Saves to database", "Updates timestamp", "Notifies watchers"]
        },
        "feedbackTicketEditModalCancelBtn": {
            "title": "Cancel Edit",
            "description": "Discards changes and closes editor",
            "tips": ["No changes saved", "Returns to previous view", "Keeps original content"]
        }
    },
    "data-input":{
        "entitySearchInput": {
            "title": "Entity Search",
            "description": "Filter GameObjects in the hierarchy",
            "tips": ["Type to filter by name", "Case-insensitive search", "Shows matching objects only"]
        },
        "propertyPanelAddPublicPropKey": {
            "title": "Public Property Key",
            "description": "Name for the new public property",
            "tips": ["Use descriptive names", "No spaces allowed", "Case-sensitive"]
        },
        "propertyPanelAddPublicPropValue": {
            "title": "Public Property Value",
            "description": "Initial value for the property",
            "tips": ["Supports strings, numbers, booleans", "Can be JSON objects", "Editable after creation"]
        },
        "propertyPanelAddProtectedPropKey": {
            "title": "Protected Property Key",
            "description": "Name for admin-only property",
            "tips": ["Only admins can modify", "Use for configuration", "Accessible in scripts"]
        },
        "propertyPanelAddProtectedPropValue": {
            "title": "Protected Property Value",
            "description": "Initial protected property value",
            "tips": ["Set secure defaults", "Can store sensitive config", "All users can read"]
        },
        "lifecyclePanelCommandConsoleInput": {
            "title": "Command Input",
            "description": "Execute actions directly",
            "tips": ["Unix like cli to run commands to modify the scene.", "run 'help' to see available commands"]
        },
        "componentMenuSearchInput": {
            "title": "Component Search",
            "description": "Find components quickly by name",
            "tips": ["Filters as you type", "Searches all categories", "Press Enter to add first match"]
        },
        "feedbackDetails": {
            "title": "Feedback Details",
            "description": "Describe your feedback in detail",
            "tips": ["Be specific and clear", "Include reproduction steps", "Can use voice input instead"]
        }
    }
}


let eventListeners = []
let overlayElement = null;
let tooltipElement = null;
let onlyComponents = true;

function addEventListeners(element, event, callback){
    element.addEventListener(event, callback);
    eventListeners.push({element, event, callback});
}

function clearEventListeners(){
    eventListeners.forEach(listener => {
        listener.element.removeEventListener(listener.event, listener.callback);
    });
    eventListeners = []
}

function createOverlay() {
    if (!overlayElement) {
        overlayElement = document.createElement('div');
        overlayElement.style.position = 'fixed';
        overlayElement.style.backgroundColor = 'purple';
        overlayElement.style.opacity = '0.5';
        overlayElement.style.pointerEvents = 'none';
        overlayElement.style.zIndex = '999999';
        overlayElement.style.transition = 'all 0.3s ease';
        overlayElement.style.display = 'none';
        document.body.appendChild(overlayElement);
    }
    return overlayElement;
}

function createTooltip() {
    if (!tooltipElement) {
        tooltipElement = document.createElement('div');
        tooltipElement.style.position = 'fixed';
        tooltipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        tooltipElement.style.color = 'white';
        tooltipElement.style.padding = '15px';
        tooltipElement.style.borderRadius = '8px';
        tooltipElement.style.maxWidth = '350px';
        tooltipElement.style.zIndex = '1000000';
        tooltipElement.style.pointerEvents = 'none';
        tooltipElement.style.display = 'none';
        tooltipElement.style.fontFamily = 'monospace';
        tooltipElement.style.fontSize = '14px';
        tooltipElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
        document.body.appendChild(tooltipElement);
    }
    return tooltipElement;
}

let displayTooltip = (tip, element) => {
    const overlay = createOverlay();
    const tooltip = createTooltip();
    
    // Get element's bounding box
    const rect = element.getBoundingClientRect();
    
    // Position and size the overlay to highlight the element
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'block';
    
    // Build tooltip content
    let tooltipHTML = `<div style="margin-bottom: 10px;"><strong style="color: #a78bfa; font-size: 16px;">${tip.title}</strong></div>`;
    tooltipHTML += `<div style="margin-bottom: 10px; color: #e0e0e0;">${tip.description}</div>`;
    if (tip.tips && tip.tips.length > 0) {
        tooltipHTML += '<div style="border-top: 1px solid #444; padding-top: 10px; margin-top: 10px;">';
        tooltipHTML += '<div style="color: #a78bfa; margin-bottom: 5px;">Tips:</div>';
        tooltipHTML += '<ul style="margin: 0; padding-left: 20px;">';
        tip.tips.forEach(tipText => {
            tooltipHTML += `<li style="margin-bottom: 3px; color: #d0d0d0;">${tipText}</li>`;
        });
        tooltipHTML += '</ul></div>';
    }
    tooltip.innerHTML = tooltipHTML;
    tooltip.style.display = 'block';
    
    // Position tooltip next to the element (prefer right side, fallback to left)
    const tooltipWidth = 350;
    const tooltipHeight = tooltip.offsetHeight;
    const padding = 10;
    
    let tooltipLeft = rect.right + padding;
    let tooltipTop = rect.top;
    
    // Check if tooltip would go off screen right
    if (tooltipLeft + tooltipWidth > window.innerWidth) {
        tooltipLeft = rect.left - tooltipWidth - padding;
    }
    
    // Check if tooltip would go off screen left
    if (tooltipLeft < 0) {
        tooltipLeft = padding;
    }
    
    // Check if tooltip would go off screen bottom
    if (tooltipTop + tooltipHeight > window.innerHeight) {
        tooltipTop = window.innerHeight - tooltipHeight - padding;
    }
    
    // Check if tooltip would go off screen top
    if (tooltipTop < 0) {
        tooltipTop = padding;
    }
    
    tooltip.style.left = tooltipLeft + 'px';
    tooltip.style.top = tooltipTop + 'px';
}

function hideTooltip() {
    if (overlayElement) {
        overlayElement.style.display = 'none';
    }
    if (tooltipElement) {
        tooltipElement.style.display = 'none';
    }
}

function setupHoverListeners() {
    Object.keys(tooltipContent).forEach(dataTag => {
        if(onlyComponents && dataTag !== "data-component"){
            return;
        }

        const elements = document.querySelectorAll(`[${dataTag}]`);
        elements.forEach(element=>{
            let tag = element.getAttribute(dataTag)
            let content = tooltipContent[dataTag][tag]
            if (content && content.title) {  // Only add listeners if content exists
                addEventListeners(element, 'mouseenter', (e)=>{
                    displayTooltip(content, element)
                })
                addEventListeners(element, 'mouseleave', (e)=>{
                    hideTooltip()
                })
            }
        })
    });
}


let Reset = ()=>{
    clearEventListeners();
    hideTooltip();
    setupHoverListeners();
    //console.log("Tutorial reset due to UI re-render");
}

// UI re-render event handler
let uiRenderedHandler = (event) => {
    if (event.detail && event.detail.id === "propertiesPanel") {
        //console.log("Properties panel re-rendered, resetting tutorial");
        Reset();
    }
}

this.onStart = ()=>{
    setupHoverListeners();
    // Add listener for UI re-render events
    window.addEventListener('ui-rendered', uiRenderedHandler);
    console.log("onStart")
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    clearEventListeners();
    hideTooltip();
    // Remove UI re-render event listener
    window.removeEventListener('ui-rendered', uiRenderedHandler);
    // Remove overlay and tooltip elements from DOM
    if (overlayElement && overlayElement.parentNode) {
        overlayElement.parentNode.removeChild(overlayElement);
        overlayElement = null;
    }
    if (tooltipElement && tooltipElement.parentNode) {
        tooltipElement.parentNode.removeChild(tooltipElement);
        tooltipElement = null;
    }
    console.log("onDestroy")
}

this.keyDown = (key)=>{
    console.log("keyDown", key)
}

this.keyUp = (key)=>{
    console.log("keyUp", key)
}


//toolbar control btn
let navControls = document.querySelector(".nav-controls")
let tooltipBtn = document.createElement("button")
tooltipBtn.classList.add("nav-control-btn")
tooltipBtn.innerHTML = "<span>🛈</span>"
navControls.appendChild(tooltipBtn)

tooltipBtn.addEventListener("click", ()=>{
    onlyComponents = !onlyComponents;
    Reset();
    if(onlyComponents){
        tooltipBtn.style.background = "rgba(255, 255, 255, 0.12)";
    }else{
        tooltipBtn.style.background = "#0c4551";
    }
})