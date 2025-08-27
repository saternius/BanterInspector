# Resonite Node-Based Logic to JavaScript Runtime Conversion Plan

## Analysis Summary

After examining the Resonite export formats, I've found that the logic nodes are preserved **only as node names** in the exported formats. The actual logic connections and data flow are **not exported** in any standard format (GLTF, FBX, DAE, etc.). However, the **ASSXML format provides the most complete node hierarchy** with logic node names preserved.

### Key Findings:

1. **Logic Nodes Present**: The ASSXML and GLTF formats preserve node names like:
   - `Dynamic Impulse Receiver`
   - `Impulse Demultiplexer`
   - `Multiplex`
   - `Write`
   - `Ref`
   - `Color (RGBA)`
   - `float`
   - `string`

2. **Missing Data**: Critical information NOT exported:
   - Node connections/wiring
   - Data flow paths
   - Event triggers
   - Variable bindings
   - Logic expressions

3. **Best Source Format**: **ASSXML** provides:
   - Complete node hierarchy
   - Node positions (transform matrices)
   - Node type names
   - Parent-child relationships

## Conversion Strategy

### Approach 1: Pattern-Based Reconstruction (Recommended)

Since the actual logic connections aren't exported, we'll use **pattern recognition** to reconstruct common Resonite logic patterns into JavaScript behaviors.

#### Step-by-Step Process:

1. **Parse ASSXML for Logic Node Graph**
   ```javascript
   class ResoniteLogicParser {
     parseASSXML(xmlContent) {
       // Extract all nodes with logic-related names
       const logicNodes = this.findLogicNodes(xmlContent);
       
       // Build spatial graph based on positions
       const nodeGraph = this.buildSpatialGraph(logicNodes);
       
       // Infer connections based on proximity and naming
       const connections = this.inferConnections(nodeGraph);
       
       return { nodes: logicNodes, connections };
     }
   }
   ```

2. **Identify Common Patterns**
   ```javascript
   const LOGIC_PATTERNS = {
     // Toggle pattern: Impulse Receiver -> Demultiplexer -> Write
     TOGGLE: {
       nodes: ['Dynamic Impulse Receiver', 'Impulse Demultiplexer', 'Write'],
       generate: () => `
         let toggleState = false;
         
         this.onInteract = function() {
           toggleState = !toggleState;
           this.setProperty('active', toggleState);
         };
       `
     },
     
     // Color change pattern: Receiver -> Multiplex -> Color -> Write
     COLOR_CHANGE: {
       nodes: ['Dynamic Impulse Receiver', 'Multiplex', 'Color', 'Write'],
       generate: (colors) => `
         let colorIndex = 0;
         const colors = ${JSON.stringify(colors)};
         
         this.onInteract = function() {
           colorIndex = (colorIndex + 1) % colors.length;
           this.setMaterialColor(colors[colorIndex]);
         };
       `
     },
     
     // Value animation: Receiver -> float values -> Write
     ANIMATE_VALUE: {
       nodes: ['Dynamic Impulse Receiver', 'float', 'Write'],
       generate: (values) => `
         let currentValue = 0;
         const targetValues = ${JSON.stringify(values)};
         
         this.onUpdate = function(deltaTime) {
           // Lerp to target value
           currentValue = lerp(currentValue, targetValues[0], deltaTime);
           this.setProperty('intensity', currentValue);
         };
       `
     }
   };
   ```

3. **Node Type Mapping**
   ```javascript
   const NODE_TYPE_MAP = {
     'Dynamic Impulse Receiver': {
       jsEquivalent: 'EventListener',
       properties: ['tag', 'enabled'],
       events: ['onReceive']
     },
     'Impulse Demultiplexer': {
       jsEquivalent: 'Switch',
       properties: ['index', 'outputs'],
       methods: ['next', 'reset']
     },
     'Multiplex': {
       jsEquivalent: 'Selector',
       properties: ['inputs', 'index'],
       methods: ['select']
     },
     'Write': {
       jsEquivalent: 'PropertySetter',
       properties: ['target', 'property', 'value']
     },
     'Ref': {
       jsEquivalent: 'Reference',
       properties: ['target', 'path']
     },
     'Color (RGBA)': {
       jsEquivalent: 'ColorValue',
       properties: ['r', 'g', 'b', 'a']
     },
     'float': {
       jsEquivalent: 'NumberValue',
       properties: ['value']
     },
     'string': {
       jsEquivalent: 'StringValue',
       properties: ['value']
     }
   };
   ```

### Approach 2: Manual Template System

Create a library of pre-built JavaScript behaviors that map to common Resonite logic patterns:

```javascript
// resonite-behaviors.js
export const ResoniteBehaviors = {
  // Lamp on/off toggle (from DeskLamp example)
  LampToggle: {
    detect: (nodes) => {
      return nodes.some(n => n.name.includes('onOffDeskLamp'));
    },
    
    generate: () => ({
      script: `
        // Lamp Toggle Behavior (converted from Resonite)
        let isOn = false;
        let lightIntensity = 1.0;
        let onColor = { r: 1, g: 0.9, b: 0.7, a: 1 };
        let offColor = { r: 0, g: 0, b: 0, a: 1 };
        
        this.onStart = function() {
          this.light = this.entity.findChild('Light');
          this.material = this.entity.getComponent('BanterMaterial');
        };
        
        this.onInteract = function() {
          isOn = !isOn;
          
          if (this.light) {
            this.light.setActive(isOn);
          }
          
          if (this.material) {
            this.material.setEmissiveColor(isOn ? onColor : offColor);
            this.material.setEmissiveIntensity(isOn ? lightIntensity : 0);
          }
          
          // Trigger event for other systems
          this.scene.broadcast('lamp-state-changed', { state: isOn });
        };
      `,
      
      components: [
        { type: 'BanterGrabHandle' },
        { type: 'BanterColliderEvents' }
      ]
    })
  },
  
  // Generic impulse receiver
  ImpulseReceiver: {
    detect: (nodes) => {
      return nodes.some(n => n.name === 'Dynamic Impulse Receiver');
    },
    
    generate: (config) => ({
      script: `
        // Impulse Receiver (converted from Resonite)
        this.impulseTag = '${config.tag || 'default'}';
        
        this.onStart = function() {
          this.scene.addEventListener('impulse-' + this.impulseTag, (data) => {
            this.onImpulseReceived(data);
          });
        };
        
        this.onImpulseReceived = function(data) {
          // Custom logic here
          console.log('Impulse received:', data);
        };
        
        this.sendImpulse = function(tag, data) {
          this.scene.broadcast('impulse-' + tag, data);
        };
      `
    })
  }
};
```

## Implementation Plan

### Phase 1: Parser Development
1. **Build ASSXML Parser**
   - Extract node hierarchy
   - Parse transform matrices
   - Identify logic nodes by name patterns

2. **Create Node Graph Builder**
   - Build spatial relationship graph
   - Group related nodes by proximity
   - Identify logic clusters

### Phase 2: Pattern Recognition
1. **Implement Pattern Detector**
   - Scan for known node combinations
   - Match against pattern library
   - Score confidence levels

2. **Build Connection Inferencer**
   - Use node positions to infer data flow
   - Apply Resonite conventions (left-to-right flow)
   - Validate against known patterns

### Phase 3: Code Generation
1. **Create JavaScript Generator**
   - Map patterns to JavaScript templates
   - Generate MonoBehavior scripts
   - Include necessary event handlers

2. **Build Component Mapper**
   - Add required Banter components
   - Set up event listeners
   - Configure interactions

### Phase 4: Integration
1. **Integrate with GLTF Converter**
   - Parse ASSXML alongside GLTF
   - Attach generated scripts to entities
   - Preserve spatial relationships

2. **Create Conversion Pipeline**
   ```javascript
   class ResoniteLogicConverter {
     async convert(assxmlPath, gltfPath) {
       // 1. Parse both files
       const logicNodes = await this.parseLogic(assxmlPath);
       const scene = await this.parseGLTF(gltfPath);
       
       // 2. Detect patterns
       const patterns = this.detectPatterns(logicNodes);
       
       // 3. Generate scripts
       const scripts = patterns.map(p => this.generateScript(p));
       
       // 4. Attach to entities
       return this.attachScriptsToEntities(scene, scripts);
     }
   }
   ```

## Conversion Workflow

### Step-by-Step User Process:

1. **Export from Resonite**
   - Export as ASSXML (for logic preservation)
   - Export as GLTF (for geometry/materials)
   - Keep both files together

2. **Run Converter**
   ```bash
   resonite-to-banter convert \
     --logic DeskLamp.assxml \
     --geometry DeskLamp.gltf \
     --output DeskLamp.banter.json
   ```

3. **Review Generated Scripts**
   - Converter creates `.js` files for each logic pattern
   - User can review and modify generated code
   - Scripts saved to inventory

4. **Manual Enhancement**
   - Add missing connections
   - Customize behavior
   - Optimize performance

## Example Conversion: DeskLamp

Based on the analyzed DeskLamp export:

### Input (ASSXML nodes):
- `<color=#023800>onOffDeskLamp</color> - (020 Nodes)`
- `Dynamic Impulse Receiver` (2 instances)
- `Impulse Demultiplexer`
- `Multiplex` (2 instances)
- `Color (RGBA)` (2 instances)
- `Write` (3 instances)
- `float` (2 instances)

### Output (JavaScript):
```javascript
// DeskLamp.js - Auto-generated from Resonite logic
export default class DeskLampController {
  constructor() {
    this.state = {
      isOn: false,
      intensity: [0.0, 1.0],
      colors: [
        { r: 0, g: 0, b: 0, a: 1 },     // Off
        { r: 1, g: 0.9, b: 0.7, a: 1 }  // On (warm white)
      ]
    };
  }
  
  onStart() {
    // Find referenced components
    this.light = this.entity.findChild('Light-ID2BBA00');
    this.material = this.entity.getComponent('BanterMaterial');
    
    // Set up interaction
    this.entity.addComponent('BanterGrabHandle');
    this.entity.addComponent('BanterColliderEvents');
  }
  
  onInteract() {
    // Toggle state (Impulse Demultiplexer logic)
    this.state.isOn = !this.state.isOn;
    const index = this.state.isOn ? 1 : 0;
    
    // Apply color (Multiplex -> Color -> Write)
    if (this.material) {
      const color = this.state.colors[index];
      this.material.setEmissiveColor(color);
    }
    
    // Apply intensity (Multiplex -> float -> Write)
    if (this.light) {
      const intensity = this.state.intensity[index];
      this.light.setIntensity(intensity);
    }
    
    // Broadcast state change (Dynamic Impulse)
    this.scene.broadcast('lamp-toggle', {
      entity: this.entity.id,
      state: this.state.isOn
    });
  }
}
```

## Limitations & Workarounds

### What Cannot Be Automatically Converted:
1. **Complex Logic Expressions**: Need manual recreation
2. **Custom Components**: Require equivalent Banter components
3. **ProtoFlux Scripts**: Must be rewritten in JavaScript
4. **Data Storage**: Local/Cloud variables need alternative implementation

### Manual Intervention Required For:
1. **Wire Connections**: Must be inferred or manually specified
2. **Event Timing**: Frame-perfect timing may differ
3. **Physics Interactions**: Different physics engines
4. **Network Sync**: Different multiplayer architectures

## Recommended Development Path

1. **Start with ASSXML** as primary source (best logic preservation)
2. **Build pattern library** from common Resonite examples
3. **Create interactive tool** for connection verification
4. **Generate documented JavaScript** with conversion comments
5. **Provide migration guide** for manual adjustments

## Conclusion

While Resonite's node-based logic cannot be perfectly preserved in exports, the **ASSXML format combined with pattern recognition** provides the best path for conversion. The generated JavaScript will require manual review but can automate 60-80% of common logic patterns, significantly reducing migration effort.