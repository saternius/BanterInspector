---
sidebar_position: 1
title: Quick Start Guide
description: Get started with Wraptor Inspector in 5 minutes
---

# Quick Start Guide

Get up and running with the Wraptor Inspector in just 5 minutes! This guide will walk you through creating your first interactive VR object.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>⏱️ Time to First Object: ~5 minutes</h3>
  <p>By the end of this guide, you'll have created a spinning, interactive cube that responds to clicks!</p>
</div>

## Prerequisites

Before you begin, make sure you have:

- ✅ **Banter VR** installed and running
- ✅ **Modern web browser** (Chrome, Firefox, Safari, or Edge)
- ✅ **Basic JavaScript knowledge** (optional, but helpful for scripting)

<div style={{
  backgroundColor: '#fff5f5',
  border: '1px solid #feb2b2',
  borderRadius: '4px',
  padding: '15px',
  marginTop: '1rem'
}}>
  <strong>⚠️ Important:</strong> The Wraptor Inspector requires the BanterScript (BS) library to be loaded. This happens automatically when you open the inspector from within Banter VR.
</div>

## Step 1: Opening the Inspector

### From Banter VR

1. Launch Banter VR and enter any space
2. Open the **Tools Menu** (usually accessed via controller menu button)
3. Select **Scene Inspector**
4. The inspector will open in your browser automatically

### Direct Browser Access

If you're developing locally:

```bash
# Navigate to the inspector directory
cd /path/to/inspector

# Start the local server
npm run dev

# Open in browser
# http://localhost:3000
```

<div style={{
  backgroundColor: '#f0f0f0',
  border: '2px dashed #999',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '2rem',
  marginBottom: '2rem'
}}>
  <div style={{textAlign: 'center', color: '#666'}}>
    <p><strong>📸 Screenshot Placeholder</strong></p>
    <p>Image showing the Wraptor Inspector interface with labeled sections:</p>
    <ul style={{textAlign: 'left', maxWidth: '500px', margin: '0 auto'}}>
      <li>Hierarchy Panel (left)</li>
      <li>Scene View (center)</li>
      <li>Properties Panel (right)</li>
      <li>Toolbar (top)</li>
    </ul>
  </div>
</div>

## Step 2: Your First Object

Let's create a simple cube in your scene:

### Creating the Cube

1. **Right-click** in the Hierarchy Panel (or click the **+** button)
2. Select **3D Object** → **Box**
3. Your cube appears in the scene!

### Positioning Your Cube

In the Properties Panel, find the **Transform** component:

```javascript
Position: { x: 0, y: 1, z: 0 }  // Raises cube 1 meter
Rotation: { x: 0, y: 0, z: 0 }  // No rotation
Scale:    { x: 1, y: 1, z: 1 }  // Normal size
```

💡 **Tip:** Click and drag the number values to adjust them smoothly!

### Adding Color

1. In the Properties Panel, click **Add Component**
2. Select **Rendering** → **Material**
3. Click the **Color** property
4. Choose your favorite color from the color picker

<div style={{
  backgroundColor: '#f0f0f0',
  border: '2px dashed #999',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '2rem',
  marginBottom: '2rem'
}}>
  <div style={{textAlign: 'center', color: '#666'}}>
    <p><strong>🎥 Video Placeholder</strong></p>
    <p>30-second video showing:</p>
    <ol style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
      <li>Creating a cube</li>
      <li>Adjusting position with transform</li>
      <li>Adding and changing material color</li>
      <li>Live preview in VR headset</li>
    </ol>
  </div>
</div>

## Step 3: Your First Script

Now let's make the cube spin!

### Adding a MonoBehavior

1. Select your cube in the Hierarchy
2. Click **Add Component** in Properties Panel
3. Choose **Scripting** → **MonoBehavior**

### Writing the Rotation Script

Click **Edit Script** and add this code:

```javascript
// Define a variable for rotation speed
this.vars = {
    "rotationSpeed": {
        "type": "number",
        "value": 1
    }
}

// Called when the script starts
this.onStart = () => {
    // Get reference to the transform
    this.transform = this._entity.getTransform();
    console.log("Spinning cube started!");
}

// Called every frame
this.onUpdate = () => {
    // Rotate the cube
    let speed = this.vars.rotationSpeed.value;
    this.transform.Add("localRotation", {
        x: speed,
        y: speed * 2,  // Spin faster on Y axis
        z: speed * 0.5
    });
}
```

### Testing Your Script

1. Click **Save** in the script editor
2. Watch your cube start spinning!
3. Adjust the `rotationSpeed` variable in the Properties Panel
4. See the rotation speed change in real-time

## Step 4: Making It Interactive

Let's add click interaction to change the cube's color:

### Extend Your Script

Add this to your existing script:

```javascript
// Add a color-changing click handler
this.onStart = () => {
    this.transform = this._entity.getTransform();
    
    // Get the material component
    this.material = this._entity.getComponent("BanterMaterial");
    
    // Listen for clicks
    this._entity._bs.On("click", () => {
        // Generate random color
        let r = Math.random();
        let g = Math.random();
        let b = Math.random();
        
        // Apply the new color
        if (this.material) {
            this.material.Set("shaderColor", {r, g, b, a: 1});
            console.log(`Changed color to RGB(${r}, ${g}, ${b})`);
        }
    });
}

// Clean up when script is destroyed
this.onDestroy = () => {
    // Remove click listener
    this._entity._bs.Off("click");
}
```

## Step 5: Saving Your Creation

### Save to Inventory

1. **Drag** your cube from the Hierarchy Panel
2. **Drop** it into the Inventory Panel
3. Give it a name like "SpinningCube"
4. It's now saved for future use!

### Using Your Saved Object

1. Open the Inventory Panel
2. Find your "SpinningCube"
3. Drag it into any scene
4. It comes complete with script and settings!

<div style={{
  backgroundColor: '#f0f0f0',
  border: '2px dashed #999',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '2rem',
  marginBottom: '2rem'
}}>
  <div style={{textAlign: 'center', color: '#666'}}>
    <p><strong>📸 Screenshot Placeholder</strong></p>
    <p>Image showing the Inventory panel with:</p>
    <ul style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
      <li>Saved SpinningCube object</li>
      <li>Folder organization</li>
      <li>Import/Export buttons</li>
    </ul>
  </div>
</div>

## What's Next?

Congratulations! 🎉 You've just created your first interactive VR object. Here's where to go next:

### Beginner Tutorials
- [**Hello VR World**](/docs/tutorials/hello-vr-world) - Create a welcome sign with text
- [**Component Reference**](/docs/entity-components/) - Explore all available components
- [**Example Projects**](/docs/examples/) - Learn from complete examples

### Learn More
- [**Core Concepts**](/docs/core-concepts/) - Understand the fundamentals
- [**Component Reference**](/docs/entity-components/) - Explore all available components
- [**Scripting Guide**](/docs/scripting/) - Deep dive into MonoBehavior scripting

### Get Help
- 💬 [Discord Community](https://discord.gg/bantervr) - Ask questions and share creations
- 📺 [YouTube Tutorials](https://youtube.com/@bantervr) - Video walkthroughs
- 🐛 [Report Issues](https://github.com/saternius/BanterInspector/issues) - Help us improve

## Tips for Success

### Performance Best Practices
- 🎯 Keep object count under 1000 for smooth performance
- ⚡ Avoid expensive operations in `onUpdate()`
- 🔄 Always clean up event listeners in `onDestroy()`

### Common Gotchas
- ❌ **Forgetting to save scripts** - Always click Save after editing
- ❌ **Missing component references** - Check if components exist before using
- ❌ **Infinite loops** - Be careful with while loops in scripts

### Keyboard Shortcuts
- `Ctrl/Cmd + Z` - Undo last action
- `Ctrl/Cmd + Shift + Z` - Redo action
- `Ctrl/Cmd + S` - Save current script
- `Delete` - Remove selected object

---

<div style={{
  backgroundColor: '#f0fff4',
  border: '2px solid #48bb78',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '3rem',
  textAlign: 'center'
}}>
  <h3>🚀 Ready for More?</h3>
  <p>You've mastered the basics! Continue with our interactive tutorials to build games, puzzles, and immersive environments.</p>
  <a href="/docs/tutorials/hello-vr-world" style={{
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    marginTop: '1rem'
  }}>
    Start Tutorial Series →
  </a>
</div>