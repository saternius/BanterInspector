---
sidebar_position: 1
title: Hello VR World
---

# Tutorial: Hello VR World

Create your first welcome sign in VR! This beginner-friendly tutorial will teach you the basics of creating and styling objects.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>🎯 What You'll Learn</h3>
  <ul>
    <li>Creating 3D text objects</li>
    <li>Styling with materials and colors</li>
    <li>Positioning objects in 3D space</li>
    <li>Adding background panels</li>
  </ul>
</div>

## Step 1: Create the Text Object

1. Open the Hierarchy Panel
2. Click **+ Add** → **UI** → **Text**
3. Name it "WelcomeText"

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
    <p>Step-by-step video (1 minute) showing:</p>
    <ul style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
      <li>Creating text object</li>
      <li>Typing welcome message</li>
      <li>Adjusting font size</li>
      <li>Centering text</li>
    </ul>
  </div>
</div>

## Step 2: Style Your Text

In the Properties Panel, find the **Text** component:

```javascript
text: "Welcome to VR!"
fontSize: 72
alignment: "Center"
color: { r: 1, g: 1, b: 1, a: 1 }  // White
```

### Adding a Glow Effect

1. Add Component → **Effects** → **Outline**
2. Set outline color to complement your text
3. Adjust outline width for visibility

## Step 3: Create a Background Panel

1. Create a new **Box** object
2. Name it "BackgroundPanel"
3. Set Transform:
   ```javascript
   Position: { x: 0, y: 0, z: 0.1 }  // Behind text
   Scale: { x: 4, y: 2, z: 0.1 }     // Wide and thin
   ```

## Step 4: Position in Space

Arrange your sign for optimal viewing:

```javascript
// Sign group position
Position: { x: 0, y: 2, z: -3 }  // Eye level, 3 meters away
Rotation: { x: 0, y: 0, z: 0 }   // Facing forward
```

## Step 5: Make It Interactive

Add a simple hover effect:

```javascript
this.onStart = () => {
    this.originalScale = {x: 1, y: 1, z: 1};
    this.transform = this._entity.getTransform();
    
    // Hover enter - grow
    this._entity._bs.On("hover-enter", () => {
        this.transform.Set("localScale", {
            x: 1.1, y: 1.1, z: 1.1
        });
    });
    
    // Hover exit - shrink back
    this._entity._bs.On("hover-exit", () => {
        this.transform.Set("localScale", this.originalScale);
    });
}
```

## Challenge: Personalize Your Sign

Try these enhancements:
- 🎨 Add gradient background
- ✨ Animate text appearance
- 🔊 Play sound on hover
- 🌈 Cycle through colors

## Next Steps

Ready for more? Check out:
- [More Examples](/docs/examples/) - Complete project examples
- [Scripting Guide](/docs/scripting/) - Deep dive into scripting
- [Component Reference](/docs/entity-components/) - All available components