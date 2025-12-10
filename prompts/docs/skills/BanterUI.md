# Banter UI Elements System

The Banter UI Elements system provides a powerful bridge between Unity's UI Toolkit and JavaScript/TypeScript, enabling dynamic UI creation and interaction in VR environments. This system allows developers to create interactive UIs both from Unity C# code and from JavaScript/TypeScript scripts at runtime.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [BanterUI](#banteruipanel)
- [UXML Integration](#uxml-integration)
- [Visual Scripting Support](#visual-scripting-support)
- [Available UI Elements](#available-ui-elements)
- [JavaScript/TypeScript Usage](#javascripttypescript-usage)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

The Banter UI Elements system allows you to create and manage UI elements in VR environments using:

- **JavaScript/TypeScript Scripting**: Create and manipulate UI elements from JavaScript/TypeScript code
- **Visual Scripting**: Use Unity's Visual Scripting nodes for UI creation without coding
- **Unity UI Builder Integration**: Design UIs visually in Unity and control them programmatically
- **Multiple UI Approaches**: Choose between code-based creation or UXML visual design
- **Event System**: Handle user interactions like clicks, hovers, and input changes
- **Dynamic Styling**: Apply CSS-like styles and properties to elements at runtime

## Getting Started

### Basic Setup

**Create a BanterUI GameObject**:


```javascript
// Create a GameObject with BanterUI
const uiObject = new BS.GameObject("UI Panel");
const doc = uiObject.AddComponent(new BS.BanterUI());

// Create a button
const button = doc.CreateButton();
button.text = "Click Me!";
button.tooltipText = "This is a button";
```

## BanterUI

The `BanterUI` is the root container for all UI elements. It represents a Unity UIDocument that can be rendered in world space or screen space.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `resolution` | `Vector2` | Resolution of the UI panel in pixels |
| `screenSpace` | `boolean` | Whether the UI is rendered in screen space (true) or world space (false) |

### Example Usage

```javascript
// Create a GameObject with BanterUI
const uiObject = new BS.GameObject("UI Panel");
const doc = uiObject.AddComponent(new BS.BanterUI());

// Configure the panel
doc.resolution = new BS.Vector2(1920, 1080);
doc.screenSpace = false;  // World space VR UI
```

## UXML Integration

The Banter UI system now supports Unity UI Builder UXML files with automatic element registration, allowing you to design UIs visually while maintaining full programmatic control.

### UXML Approach (Recommended)

**1. Create UXML in Unity UI Builder**
- Design your UI layout in Unity's UI Builder
- Configure panel settings directly in the UIDocument
- Give meaningful names to elements you want to access from code

**2. Automatic Element Registration**
```javascript
// In Visual Scripting or C#: Run ProcessUXMLTree node
// - Automatically detects existing UIDocument with panel settings
// - Bypasses pool system (uses existing panel configuration)  
// - Registers all elements with auto-generated or preserved IDs
// - No manual setup required!
```

**3. Access Elements Immediately**
```javascript
// Elements are automatically available by ID using querySelector
const saveButton = doc.QuerySelector("#SaveButton");
if (saveButton) {
    saveButton.text = "Save Game";
}

const statusLabel = doc.QuerySelector("#StatusLabel");
if (statusLabel) {
    statusLabel.style.color = "#ff0000";
}

const menuButton = doc.QuerySelector("#MenuButton");
if (menuButton) {
    menuButton.OnClick((event) => {
        console.log("Menu button clicked!");
    });
}
```

### Key Benefits

- **Visual Design**: Use Unity UI Builder for layout and styling
- **Zero Configuration**: Automatic detection of panel settings and elements
- **No Pool Conflicts**: UXML panels bypass the ID pool system entirely
- **Named Elements**: Elements keep their UI Builder names when unique
- **Auto-Generated IDs**: Unnamed elements get consistent auto-generated IDs
- **Immediate Access**: All elements available for scripting immediately

### Element ID Convention

- **Named Elements**: `"SaveButton"`, `"PlayerHealth"`, `"MainMenu"` (from UI Builder)
- **Auto-Generated**: `"uxml_Button_1"`, `"uxml_Label_2"`, `"uxml_ScrollView_1"`
- **Custom Prefix**: `"menu_Button_1"` (using custom prefix)

### Visual Scripting Nodes for UXML

- **ProcessUXMLTree**: Main node to process UXML and register all elements
- **QueryUXMLElement**: Get information about processed elements  
- **LoadUXMLAsset**: Load UXML from resources or direct references

### Workflow Examples

**UXML Approach (Recommended)**
1. Create UIDocument in scene with UXML asset and panel settings
2. Process tree with `ProcessUXMLTree` (auto-detects configuration)
3. Query elements using `doc.QuerySelector("#elementName")` or `doc.QuerySelectorAll(".className")`
4. Interact with elements directly using their properties and methods

**Traditional Approach**
1. Create panel with `CreateUIPanel`
2. Load UXML with `LoadUXMLAsset`
3. Process tree with `ProcessUXMLTree`
4. Query elements using `doc.QuerySelector()` methods
5. Interact with elements directly using their properties and methods

### Mixed Approach
- **Detection**: Existing pool panel + new UIDocument
- **Behavior**: Automatically chooses best approach based on available resources
- **Benefits**: Seamless integration with existing projects

### Querying UXML Elements

After processing UXML with `ProcessUXMLTree`, elements can be queried using standard DOM-like selectors:

```javascript
// Query by ID (element name from UI Builder)
const saveButton = doc.QuerySelector("#SaveButton");
const playerHealth = doc.QuerySelector("#PlayerHealth");

// Query by type/tag name
const firstButton = doc.QuerySelector("UIButton");
const allLabels = doc.QuerySelectorAll("UILabel");

// Query by class (if supported)
const menuItems = doc.QuerySelectorAll(".menu-item");

// Example usage
const button = doc.QuerySelector("#SaveButton");
if (button) {
    button.text = "Save Game";
    button.OnClick(() => console.log("Save clicked!"));
}
```

**Available Query Methods:**
- `QuerySelector(selector)`: Returns first matching element or null
- `QuerySelectorAll(selector)`: Returns array of all matching elements

**Supported Selectors:**
- `#id` - Query by element ID/name
- `UIButton`, `UILabel` - Query by element type
- `.className` - Query by CSS class (basic support)

## Built-in UIElement Methods

All UI elements inherit these core methods from the base UIElement class:

### Property Management
- `SetProperty(name, value)`: Set element property by name
- `GetProperty(name)`: Get element property value by name
- `SetStyle(name, value)`: Set individual CSS style property
- `GetStyle(name)`: Get individual CSS style value
- `SetStyles(styleObject)`: Set multiple CSS properties at once

### Element Hierarchy
- `AppendChild(childElement)`: Add child element to this element
- `RemoveChild(childElement)`: Remove child element from this element
- `InsertBefore(childElement, referenceElement)`: Insert child before reference element
- `Destroy()`: Remove element and clean up all resources

### Event Handling
- `AddEventListener(type, handler, options?)`: Add event listener
- `RemoveEventListener(type, handler)`: Remove event listener
- `On(type, handler, options?)`: Alias for AddEventListener
- `Off(type, handler)`: Alias for RemoveEventListener
- `DispatchEvent(event)`: Manually dispatch event

### Typed Event Listeners
- `OnClick(handler)`: Handle click events
- `OnMouseDown(handler)`: Handle mouse down events
- `OnMouseUp(handler)`: Handle mouse up events
- `OnMouseEnter(handler)`: Handle mouse enter events
- `OnMouseLeave(handler)`: Handle mouse leave events
- `OnMouseMove(handler)`: Handle mouse move events
- `OnKeyDown(handler)`: Handle key down events
- `OnKeyUp(handler)`: Handle key up events
- `OnFocus(handler)`: Handle focus events
- `OnBlur(handler)`: Handle blur events
- `OnChange(handler)`: Handle change events
- `OnWheel(handler)`: Handle wheel events

### Element Querying
- `QuerySelector(selector)`: Find first matching descendant element
- `QuerySelectorAll(selector)`: Find all matching descendant elements

### Lifecycle Management
- `Async()`: Ensure element is fully initialized (returns Promise)
- `GetPanelId()`: Get the panel ID this element belongs to

### Utility Methods
- `serialize()`: Serialize element state to string
- `deserialize(data)`: Restore element state from string

### Style Helper
Access the `style` property for type-safe CSS styling:

```javascript
element.style.backgroundColor = "#ff0000";
element.style.width = "100px";
element.style.margin = "10px";
element.style.flexDirection = "column";
```

**Available Style Properties:**
- Layout: `width`, `height`, `minWidth`, `maxWidth`, `position`, `left`, `top`, `right`, `bottom`
- Flexbox: `flexDirection`, `justifyContent`, `alignItems`, `flexGrow`, `flexShrink`, `flexWrap`
- Spacing: `margin`, `marginTop`, `marginLeft`, `padding`, `paddingTop`, `paddingLeft`
- Appearance: `backgroundColor`, `color`, `opacity`, `borderWidth`, `borderRadius`, `borderColor`
- Typography: `fontSize`, `fontWeight`, `textAlign`, `fontStyle`

### Usage Examples

**Property Management:**
```javascript
const button = doc.CreateButton();

// Set properties directly
button.SetProperty("text", "Click Me");
button.SetProperty("enabled", true);

// Get property values
const buttonText = button.GetProperty("text");
console.log("Button text:", buttonText);
```

**Style Management:**
```javascript
// Individual styles
button.SetStyle("background-color", "#3498db");
button.SetStyle("border-radius", "5px");

// Multiple styles at once
button.SetStyles({
    width: "120px",
    height: "40px",
    backgroundColor: "#e74c3c",
    color: "#ffffff",
    fontSize: "16px"
});

// Type-safe styling
button.style.backgroundColor = "#2ecc71";
button.style.margin = "10px";
```

**Event Handling:**
```javascript
// Generic event listener
button.AddEventListener("click", (event) => {
    console.log("Button clicked!", event);
});

// Typed event listeners (recommended)
button.OnClick((event) => {
    console.log("Click at:", event.clientX, event.clientY);
});

button.OnMouseEnter(() => {
    button.style.backgroundColor = "#34495e";
});

button.OnMouseLeave(() => {
    button.style.backgroundColor = "#3498db";
});
```

**Element Hierarchy:**
```javascript
const container = doc.CreateVisualElement();
const leftPanel = doc.CreateVisualElement();
const rightPanel = doc.CreateVisualElement();

// Build hierarchy
container.AppendChild(leftPanel);
container.AppendChild(rightPanel);

// Add content to panels
const button1 = doc.CreateButton();
const button2 = doc.CreateButton();

leftPanel.AppendChild(button1);
rightPanel.AppendChild(button2);

// Query elements
const foundButton = container.QuerySelector("UIButton");
const allButtons = container.QuerySelectorAll("UIButton");
```

### Complete UXML Workflow Example

```javascript
// 1. Create BanterUI panel (or use existing UIDocument with panel settings)
const uiObject = new BS.GameObject("Settings Panel");
const doc = uiObject.AddComponent(new BS.BanterUI());

// 2. UXML is processed automatically if UIDocument exists
// Or manually process: ProcessUXMLTree node in Visual Scripting

// 3. Query and interact with elements
const volumeSlider = doc.QuerySelector("#VolumeSlider");
const muteToggle = doc.QuerySelector("#MuteToggle");
const saveButton = doc.QuerySelector("#SaveButton");
const statusLabel = doc.QuerySelector("#StatusLabel");

// 4. Set up interactions
if (volumeSlider) {
    volumeSlider.value = 50;
    volumeSlider.OnChange((event) => {
        if (statusLabel) {
            statusLabel.text = `Volume: ${event.value}%`;
        }
    });
}

if (muteToggle) {
    muteToggle.OnChange((event) => {
        if (volumeSlider) {
            volumeSlider.enabled = !event.value;
        }
    });
}

if (saveButton) {
    saveButton.OnClick(() => {
        // Save settings logic
        if (statusLabel) {
            statusLabel.text = "Settings saved!";
            statusLabel.style.color = "#00ff00";
        }
    });
}
```


## Visual Scripting Support

The Banter UI system includes comprehensive Visual Scripting support for non-programmers and rapid prototyping.

### Panel Management Nodes

**CreateUIPanel**
- Category: `Banter\UI\Panel`
- Automatically acquires panel ID from pool
- Configures panel settings and resolution
- Returns panel reference for other nodes

**ProcessUXMLTree**  
- Category: `Banter\UI\UXML`
- Processes UXML files and registers all elements
- Automatic detection of existing panel settings
- Works with both UXML and traditional approaches

### Element Creation Nodes

**CreateUIElement**
- Category: `Banter\UI\Elements`
- Creates any UI element type (Button, Label, Toggle, etc.)
- Automatic parent-child relationships
- Auto-generated element IDs

**Specific Element Creation Nodes**
- **CreateUIButton** - `Banter\UI\Elements\Controls` - Quick button creation with text
- **CreateUILabel** - `Banter\UI\Elements\Controls` - Quick label creation with text
- **CreateUISlider** - `Banter\UI\Elements\Controls` - Quick slider with min/max range
- **CreateUIToggle** - `Banter\UI\Elements\Controls` - Quick toggle with initial state
- **CreateUIScrollView** - `Banter\UI\Elements\Containers` - Creates scrollable container

### Property and Style Nodes

**SetUIProperty**
- Category: `Banter\UI\Properties`
- Set element properties (text, enabled, value, etc.)
- Auto-resolves panel from element ID
- Type-safe property setting

**GetUIProperty**
- Category: `Banter\UI\Properties`
- Retrieve element property values
- Auto-resolves panel from element ID
- Event-based value return

**Specific Property Nodes**
- **SetUIText** / **GetUIText** - `Banter\UI\Properties\Text` - Text content management
- **SetUIEnabled** - `Banter\UI\Properties\State` - Enable/disable elements
- **SetUIVisible** - `Banter\UI\Properties\State` - Show/hide elements
- **SetUIValue** / **GetUIValue** - `Banter\UI\Properties\Value` - Numeric values (sliders, etc.)

**SetUIStyle** 
- Category: `Banter\UI\Styles`
- Set any CSS style property
- Full styling system access
- Comprehensive style nodes for specific categories

### Style Category Nodes

**Layout and Positioning**
- **SetUISize** - `Banter\UI\Styles\Layout` - Element dimensions (width/height)
- **SetUIMargin** - `Banter\UI\Styles\Layout` - Margin spacing
- **SetUIPadding** - `Banter\UI\Styles\Layout` - Inner padding
- **SetUIPosition** - `Banter\UI\Styles\Layout` - Position properties
- **SetUIFlexbox** - Layout and flexbox properties

**Appearance and Styling**
- **SetUIBackgroundColor** - `Banter\UI\Styles\Appearance` - Background color
- **SetUITextColor** - `Banter\UI\Styles\Appearance` - Text color
- **SetUIBorder** - `Banter\UI\Styles\Appearance` - Border width, color, radius
- **SetUIBackgroundImage** - `Banter\UI\Styles\Appearance` - Background image from URL

**Typography**
- **SetUIFont** - `Banter\UI\Styles\Text` - Font size, weight, style
- **SetUITextAlign** - `Banter\UI\Styles\Text` - Text alignment (left/center/right)

### Event System Nodes

**RegisterUIEvent** / **UnregisterUIEvent**
- Category: `Banter\UI\Events` 
- Register/unregister for UI event listening
- Supports all UI events (click, change, focus, etc.)
- Auto-resolves panel from element ID

**Mouse Event Nodes**
- **OnUIClick** - `Events\Banter\UI\Mouse` - Element click events
- **OnUIMouseDown** / **OnUIMouseUp** - Mouse button press/release
- **OnUIMouseEnter** / **OnUIMouseLeave** - Mouse hover events
- **OnUIWheel** - Mouse wheel events

**Input Event Nodes**
- **OnUIChange** - `Events\Banter\UI\Input` - Value change events
- **OnUISubmit** - `Events\Banter\UI\Input` - Form submission events
- **OnUIFocus** / **OnUIBlur** - Focus gain/loss events

**Keyboard Event Nodes**
- **OnUIKeyDown** / **OnUIKeyUp** - `Events\Banter\UI\Keyboard` - Key press/release events

### Hierarchy Management Nodes

**Parent-Child Relationships**
- **SetUIParent** - `Banter\UI\Hierarchy` - Change element's parent
- **GetUIParent** - `Banter\UI\Hierarchy` - Get element's parent
- **GetUIChildren** - `Banter\UI\Hierarchy` - Get all child elements
- **AppendUIChild** - `Banter\UI\Hierarchy` - Add child to end
- **InsertUIChild** - `Banter\UI\Hierarchy` - Insert child at position
- **RemoveUIChild** - `Banter\UI\Hierarchy` - Remove child from parent

**Element Querying**
- **FindUIElement** - `Banter\UI\Query` - Find element by ID in hierarchy
- **QueryUISelector** - `Banter\UI\Query` - CSS-like selector querying
- **QueryUIElements** - `Banter\UI\Query` - Find all matching elements

### Advanced Control Nodes

**Method Invocation**
- **CallUIMethod** - `Banter\UI\Methods` - Generic method calling
- **FocusUIElement** / **BlurUIElement** - `Banter\UI\Methods` - Focus management

**Layout Control**
- **ForceUILayout** - `Banter\UI\Layout` - Force layout recalculation
- **MeasureUIElement** - `Banter\UI\Layout` - Get computed size and position

### Query and Information Nodes

**QueryUXMLElement**
- Category: `Banter\UI\UXML`
- Get information about processed elements
- Element type, visibility, child count
- Debugging and validation

### Auto-Resolution System

All nodes automatically resolve the correct panel for element operations:
- No need to manually connect panel references
- Element ID automatically finds its panel
- Works with both pool-based and UXML panels
- Supports mixed panel types in same scene

## Available UI Elements

### UIButton

Interactive button element with text, tooltip, and click events.

**Properties:**
- `text`: Button text
- `tooltipText`: Hover tooltip
- `elementName`: Element name/ID
- `isEnabled`: Whether the button is enabled

**Methods:**
- `HasClass(className: string)`: Check if button has CSS class
- `AddClass(className: string)`: Add CSS class to button
- `RemoveClass(className: string)`: Remove CSS class from button
- `Focus()`: Focus the button
- `Blur()`: Remove focus

```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

const button = doc.CreateButton();
button.text = "Click Me!";
button.tooltipText = "This button does something";
button.isEnabled = true;
```

### UILabel

Text display element for showing static text.

**Properties:**
- `text`: Display text
- `tooltipText`: Hover tooltip
- `elementName`: Element name/ID
- `isEnabled`: Whether the label is enabled

<details>
<summary><b>JavaScript (Global BS namespace)</b></summary>

```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

const label = doc.CreateLabel();
label.text = "Score: 1000";
label.tooltipText = "Current player score";
```
</details>

<details>
<summary><b>TypeScript (With imports)</b></summary>

```typescript
import { UILabel } from './src/ui/components/UILabel';

// const uiObject = new GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

const label = doc.CreateLabel();
label.text = "Score: 1000";
label.tooltipText = "Current player score";
```
</details>

### UIToggle

Toggle/checkbox element for boolean values.

**Properties:**
- `value`: Whether the toggle is checked
- `tooltipText`: Hover tooltip
- `elementName`: Element name/ID
- `isEnabled`: Whether the toggle is enabled

**Methods:**
- `Toggle()`: Toggle the state
- `SetValue(value: boolean)`: Set checked state

```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

const toggle = doc.CreateToggle();
toggle.value = true;
toggle.tooltipText = "Enable sound effects";
```

### UISlider

Slider element for numeric input within a range.

**Properties:**
- `value`: Current slider value
- `lowValue`: Minimum value
- `highValue`: Maximum value
- `tooltipText`: Hover tooltip
- `elementName`: Element name/ID
- `isEnabled`: Whether the slider is enabled

**Methods:**
- `SetValue(value: number)`: Set the value
- `SetRange(min: number, max: number)`: Set the range

```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

const slider = doc.CreateSlider();
slider.lowValue = 0;
slider.highValue = 100;
slider.value = 50;
slider.tooltipText = "Volume level";
```

### UIScrollView

Scrollable container for large amounts of content.

**Properties:**
- `scrollPosition`: Current scroll position (Vector2)
- `horizontalScrolling`: Enable horizontal scrolling
- `verticalScrolling`: Enable vertical scrolling
- `scrollDecelerationRate`: Scroll deceleration rate
- `elasticity`: Scroll elasticity
- `tooltipText`: Hover tooltip
- `elementName`: Element name/ID
- `isEnabled`: Whether the scroll view is enabled

```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

const scrollView = doc.CreateScrollView();
scrollView.horizontalScrolling = false;
scrollView.verticalScrolling = true;
scrollView.scrollDecelerationRate = 0.135;
```

```typescript
import { UIScrollView } from './src/ui/components/UIScrollView';

// const uiObject = new GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

const scrollView = doc.CreateScrollView();
scrollView.horizontalScrolling = false;
scrollView.verticalScrolling = true;
scrollView.scrollDecelerationRate = 0.135;
```
</details>

### UIVisualElement

Generic visual element for custom styling and layout.

**Properties:**
- `tooltipText`: Hover tooltip
- `elementName`: Element name/ID
- `isEnabled`: Whether the element is enabled

**Methods:**
- `HasClass(className: string)`: Check if element has CSS class
- `AddClass(className: string)`: Add CSS class to element
- `RemoveClass(className: string)`: Remove CSS class from element
- `Focus()`: Focus the element
- `Blur()`: Remove focus


```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

const container = doc.CreateVisualElement();
container.elementName = "main-container";
```


## JavaScript/TypeScript Usage

The UI Elements system uses the global `BS` namespace where all UI types and functions are available without imports.

### Creating Elements

```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

// All types available in global BS namespace
const button = doc.CreateButton();
const label = doc.CreateLabel();
const toggle = doc.CreateToggle();
```

### Setting Properties

```javascript
// Direct property assignment
button.text = "New Button Text";
button.isEnabled = false;

// Vector2 properties (like scroll position)
scrollView.scrollPosition = new BS.Vector2(0, 100);
```

### Method Calls

```javascript
// Call methods on elements
button.Focus();
toggle.Toggle();
slider.SetValue(75);

// CSS class management
button.AddClass("primary");
button.AddClass("large");
if (button.HasClass("primary")) {
    console.log("Button has primary class");
}
button.RemoveClass("large");
```

### Element Hierarchy

```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

// Create parent-child relationships
const container = doc.CreateVisualElement();
const button = doc.CreateButton(container);
```

### Serialization

Elements can serialize/deserialize their state:

<details>
<summary><b>JavaScript (Global BS namespace)</b></summary>

```javascript
// Serialize element state
const serializedState = button.serialize();

// Deserialize element state
button.deserialize(serializedState);
```
</details>

<details>
<summary><b>TypeScript (With imports)</b></summary>

```typescript
// Serialize element state
const serializedState = button.serialize();

// Deserialize element state
button.deserialize(serializedState);
```
</details>

## Examples

### Complete VR Menu System


```javascript
class VRMenuSystem {
    constructor() {
        this.setupPanel();
        this.createMainMenu();
    }
    
    setupPanel() {
        // Create a GameObject with BanterUI
        const uiObject = new BS.GameObject("VR Menu Panel");
        this.doc = uiObject.AddComponent(new BS.BanterUI());
        
                this.doc.resolution = new BS.Vector2(800, 600);
        this.doc.screenSpace = false; // World space VR UI
    }
    
    createMainMenu() {
        // Main container
        this.mainMenu = this.doc.CreateVisualElement();
        this.mainMenu.elementName = "main-menu";
        
        // Title
        const title = this.doc.CreateLabel("", this.mainMenu);
        title.text = "VR Game Menu";
        title.elementName = "title";
        
        // Play button
        const playButton = this.doc.CreateButton(this.mainMenu);
        playButton.text = "Play Game";
        playButton.tooltipText = "Start a new game";
        
        // Settings button
        const settingsButton = this.doc.CreateButton(this.mainMenu);
        settingsButton.text = "Settings";
        settingsButton.tooltipText = "Open settings menu";
        
        // Volume slider
        const volumeSlider = this.doc.CreateSlider(0, 100, this.mainMenu);
        volumeSlider.minValue = 0;
        volumeSlider.maxValue = 100;
        volumeSlider.value = 50;
        volumeSlider.tooltipText = "Master volume";
        
        // Audio toggle
        const audioToggle = this.doc.CreateToggle(this.mainMenu);
        audioToggle.checked = true;
        audioToggle.tooltipText = "Enable audio";
    }
    
    updateScore(score) {
        const scoreLabel = this.doc.CreateLabel();
        scoreLabel.text = `Score: ${score}`;
    }
}

// Usage
const menuSystem = new VRMenuSystem();
```

### Dynamic Inventory System

```javascript
// Create a GameObject with BanterUI
// const uiObject = new BS.GameObject("Inventory Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

class InventoryUI {
    constructor() {
        // Create a GameObject with BanterUI
        const uiObject = new BS.GameObject("Inventory Panel");
        this.doc = uiObject.AddComponent(new BS.BanterUI());
        
                this.doc.resolution = new BS.Vector2(400, 600);
        this.items = [];
        
        // Create scrollable inventory
        this.scrollView = this.doc.CreateScrollView();
        this.scrollView.verticalScrolling = true;
        this.scrollView.horizontalScrolling = false;
    }
    
    addItem(name, count = 1) {
        const existingItem = this.items.find(item => item.name === name);
        
        if (existingItem) {
            existingItem.count += count;
        } else {
            this.items.push({name, count});
        }
        
        this.refreshInventory();
    }
    
    refreshInventory() {
        // In a real implementation, you'd manage child elements
        // For brevity, this example shows the concept
        
        this.items.forEach((item, index) => {
            const itemContainer = this.doc.CreateVisualElement();
            itemContainer.elementName = `item-${index}`;
            
            const itemLabel = this.doc.CreateLabel("", itemContainer);
            itemLabel.text = `${item.name} x${item.count}`;
        });
    }
}
```

### Settings Panel with Persistence

```javascript
// Create a GameObject with BanterUI
// const uiObject = new BS.GameObject("Settings Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());

class SettingsPanel {
    constructor() {
        this.loadSettings();
        this.createPanel();
    }
    
    createPanel() {
        // Create a GameObject with BanterUI
        const uiObject = new BS.GameObject("Settings Panel");
        this.doc = uiObject.AddComponent(new BS.BanterUI());
        
                this.doc.resolution = new BS.Vector2(600, 400);
        
        // Volume slider
        const volumeSlider = this.doc.CreateSlider();
        volumeSlider.MinValue = 0;
        volumeSlider.MaxValue = 100;
        volumeSlider.value = this.settings.volume;
        volumeSlider.tooltipText = "Master Volume";
        
        // Audio toggle
        const audioToggle = this.doc.CreateToggle();
        audioToggle.value = this.settings.enableAudio;
        audioToggle.tooltipText = "Enable Audio";
        
        // Save button
        const saveButton = this.doc.CreateButton();
        saveButton.text = "Save Settings";
        saveButton.tooltipText = "Save current settings";
    }
    
    loadSettings() {
        // Load from storage or use defaults
        this.settings = {
            volume: 50,
            enableAudio: true,
            difficulty: "normal"
        };
    }
    
    saveSettings() {
        // Save to storage
        console.log("Settings saved:", this.settings);
    }
}
```

## Troubleshooting

### Common Issues

1. **UI Elements not appearing**:
   - Check that the panel resolution is appropriate
   - Verify the panel GameObject is active
   - For UXML: Ensure UIDocument has panel settings configured
   - Ensure BanterUI component is properly attached

2. **Properties not updating**:
   - Verify the property name spelling and case sensitivity (use camelCase)
   - For Visual Scripting: Check element ID spelling and case sensitivity
   - Ensure the element exists and is properly created

3. **JavaScript runtime errors**:
   - Check that the global BS namespace is available
   - Ensure all required UI classes are imported correctly
   - Verify element creation follows the correct pattern

4. **Element interaction not working**:
   - Check Unity console for error messages
   - Verify the panel is properly created and active
   - Ensure element IDs are unique and correctly referenced

5. **UXML Integration Issues**:
   - **Elements not found**: Run `ProcessUXMLTree` after loading UXML
   - **Missing elements**: Check that UXML file loaded correctly
   - **ID conflicts**: Use unique element names in UI Builder
   - **Panel setup issues**: Ensure UIDocument has panel settings configured

6. **Visual Scripting Issues**:
   - **Node errors**: Check that target GameObject has required components
   - **Auto-resolution failing**: Ensure `ProcessUXMLTree` ran successfully
   - **Missing panel reference**: Ensure panel is properly created
   - **Element not found**: Use `QueryUXMLElement` to verify element registration


### Debug Tips

1. **Check Unity Console**:
   - Look for error messages related to UI elements
   - Check for missing component warnings
   - Verify panel initialization messages

2. **Test Property Setting**:

```javascript
// const uiObject = new BS.GameObject("UI Panel");
// const doc = uiObject.AddComponent(new BS.BanterUI());
// const button = doc.CreateButton();

// Test property setting in isolation
try {
    button.text = "Test";
    console.log("Property set successfully");
} catch (error) {
    console.error("Failed to set property:", error);
}
```

3. **UXML Debug Tips**:
   - Use `QueryUXMLElement` node to verify element existence
   - Check `ProcessUXMLTree` output for element count and summary
   - Ensure UXML file loaded correctly in UIDocument

4. **Visual Scripting Debug**:
   - Use `QueryUXMLElement` node to verify element existence
   - Check `ProcessUXMLTree` output for element count and summary
   - Enable console logging to see auto-resolution messages

### Performance Considerations

- Minimize property updates per frame
- Batch UI updates when possible
- Use efficient element hierarchies
- Consider UI pooling for dynamic content

## CSS/USS Styling Limitations

The Banter UI system uses Unity's UI Toolkit USS (Unity Style Sheets) which has important limitations compared to standard web CSS:

### Supported CSS Properties

**Layout System**
- **Flexbox Only**: Unity UI Toolkit uses flexbox as its primary layout system
  - Supported: `flex-direction`, `justify-content`, `align-items`, `flex-grow`, `flex-shrink`, `flex-wrap`
  - **NOT Supported**: CSS Grid, float layouts, table layouts
  - **NOT Supported**: `display` property (all elements are flex containers by default)

**Box Model**
- Supported: `width`, `height`, `min-width`, `max-width`, `min-height`, `max-height`
- Supported: `margin`, `padding` (and their directional variants)
- Supported: `position` (absolute, relative), `top`, `left`, `right`, `bottom`
- **Limited**: Border properties only support solid borders (no dashed, dotted styles)

**Visual Styling**
- Supported: `background-color`, `background-image`, `opacity`
- Supported: `border-width`, `border-color`, `border-radius`
- **NOT Supported**: `box-shadow`, `text-shadow`
- **NOT Supported**: Gradients (linear-gradient, radial-gradient)
- **NOT Supported**: Multiple backgrounds

**Typography**
- Supported: `color`, `font-size`, `letter-spacing`, `word-spacing`
- **Limited**: Font properties require Unity-specific formats (`-unity-font`, `-unity-font-style`)
- **Limited**: `text-align` requires Unity prefix (`-unity-text-align`)
- **NOT Supported**: Web fonts (@font-face), variable fonts

**Transforms**
- Supported: `rotate`, `scale`, `transform-origin`
- **NOT Supported**: `translate`, `skew`, `matrix` transforms
- **NOT Supported**: 3D transforms (`rotateX`, `rotateY`, `perspective`)

**Animations & Transitions**
- **NOT Supported**: CSS animations (@keyframes)
- **NOT Supported**: CSS transitions
- Animation must be handled through code

### Unity-Specific Properties

Unity adds vendor-prefixed properties for platform-specific features:

```css
/* Unity-specific background properties */
-unity-background-scale-mode: scale-to-fit; /* or stretch-to-fill, scale-and-crop */
-unity-background-image-tint-color: #ffffff;

/* Unity text properties */
-unity-text-align: middle-center; /* combines horizontal and vertical alignment */
-unity-text-outline-width: 1px;
-unity-text-outline-color: #000000;

/* Unity 9-slice properties for scalable borders */
-unity-slice-left: 10;
-unity-slice-right: 10;
-unity-slice-top: 10;
-unity-slice-bottom: 10;
```

### Important Differences from Web CSS

1. **No Cascading**: Styles don't cascade the same way as web CSS
2. **No Pseudo-classes**: Limited support (`:hover`, `:active`, `:focus` only)
3. **No Pseudo-elements**: `::before`, `::after` not supported
4. **No Media Queries**: No responsive breakpoints
5. **No CSS Variables**: Custom properties not supported
6. **Pixel Units Only**: Most properties only accept pixel values, not percentages or other units
7. **No !important**: Priority override not available

### Workarounds and Best Practices

1. **For Responsive Design**: Use flexbox properties and handle window resizing in code
2. **For Animations**: Use Unity's animation system or script property changes over time
3. **For Complex Layouts**: Combine multiple VisualElements with flexbox
4. **For Dynamic Styles**: Use inline styles or class toggling through JavaScript
5. **For Gradients/Shadows**: Use background images or Unity shader effects

### Example: Web CSS vs Unity USS

**Web CSS (Not Supported)**
```css
.button {
    display: inline-block;
    background: linear-gradient(#e66465, #9198e5);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}
.button:hover {
    transform: translateY(-2px);
}
```

**Unity USS Equivalent**
```css
.button {
    background-color: #e66465; /* No gradient support */
    /* No box-shadow - use border or image */
    border-width: 2px;
    border-color: rgba(0,0,0,0.1);
}
.button:hover {
    /* Limited hover support */
    background-color: #9198e5;
    /* Animation via code, not CSS */
}
```
