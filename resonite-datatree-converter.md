# Resonite DataTree to Banter Converter - Technical Specification

## Executive Summary

The Resonite `export.json` file is a **135MB serialized world state** containing complete hierarchy, components, assets, and ProtoFlux logic. This document outlines a comprehensive strategy to reconstruct this data into Banter's entity-component system.

## 1. Resonite Export Structure Analysis

### File Structure Overview
```json
{
  "VersionNumber": "2025.3.28.1172",
  "FeatureFlags": {...},
  "Types": [1574 type definitions],        // Type index lookup table
  "TypeVersions": {...},
  "Assemblies": [...],
  "Configuration": {...},
  "Slots": {                               // Root world hierarchy
    "ID": "uuid",
    "Components": {
      "Data": [81 root components]
    },
    "Children": [61,289 nested slots],
    "Name": {"Data": "Root"},
    "Position": {"Data": [x, y, z]},
    "Rotation": {"Data": [x, y, z, w]},
    "Scale": {"Data": [x, y, z]}
  },
  "Assets": [906 asset definitions]        // Materials, meshes, textures, etc.
}
```

### Key Insights

1. **Type Indexing System**: Components and assets reference types by index into the `Types` array
2. **ID/Data Pattern**: All values wrapped in `{"ID": "...", "Data": value}` structure
3. **Hierarchical Slots**: Similar to Unity GameObjects, nested parent-child relationships
4. **Component Arrays**: Components stored as indexed arrays, not dictionaries
5. **Asset References**: Assets referenced by IDs throughout the structure

## 2. Data Mapping Strategy

### 2.1 Slot → Entity Conversion

| Resonite Slot | Banter Entity | Notes |
|--------------|---------------|-------|
| Slot.Name | Entity.name | Direct mapping |
| Slot.Position | Transform.localPosition | Convert array to {x,y,z} |
| Slot.Rotation | Transform.localRotation | Quaternion format |
| Slot.Scale | Transform.localScale | Vector3 format |
| Slot.Active | Entity.active | Boolean flag |
| Slot.Children | Entity.children | Recursive structure |
| Slot.Persistent-ID | Entity.persistent | For saved entities |
| Slot.Components | Entity.components | Component array |

### 2.2 Component Type Mapping

#### Geometry Components
```javascript
const GEOMETRY_MAP = {
  'FrooxEngine.BoxMesh': 'BanterBox',
  'FrooxEngine.SphereMesh': 'BanterSphere',
  'FrooxEngine.CylinderMesh': 'BanterCylinder',
  'FrooxEngine.QuadMesh': 'BanterPlane',
  'FrooxEngine.ConeMesh': 'BanterCone',
  'FrooxEngine.TorusMesh': 'BanterTorus',
  'FrooxEngine.IcoSphereMesh': 'BanterSphere',
  'FrooxEngine.GridMesh': 'BanterPlane'
};
```

#### Material Components
```javascript
const MATERIAL_MAP = {
  'FrooxEngine.PBS_Metallic': {
    target: 'BanterMaterial',
    mapping: {
      'AlbedoColor': 'color',
      'AlbedoTexture': 'texture',
      'MetallicValue': 'metallic',
      'Smoothness': 'roughness', // Inverted: roughness = 1 - smoothness
      'EmissiveColor': 'emissiveColor',
      'NormalMap': 'normalMap'
    }
  }
};
```

#### Physics Components
```javascript
const PHYSICS_MAP = {
  'FrooxEngine.BoxCollider': 'BoxCollider',
  'FrooxEngine.SphereCollider': 'SphereCollider',
  'FrooxEngine.CapsuleCollider': 'CapsuleCollider',
  'FrooxEngine.MeshCollider': 'MeshCollider',
  'FrooxEngine.RigidBody': 'BanterRigidbody',
  'FrooxEngine.Grabbable': 'BanterGrabHandle'
};
```

#### ProtoFlux → JavaScript
```javascript
const PROTOFLUX_MAP = {
  'ProtoFlux.DynamicImpulseReceiver': 'event listener',
  'ProtoFlux.ValueWrite': 'property setter',
  'ProtoFlux.If': 'conditional branch',
  'ProtoFlux.Multiplex': 'switch statement',
  'ProtoFlux.ForLoop': 'for loop'
};
```

## 3. Conversion Pipeline Architecture

### Phase 1: Parse and Index
```javascript
class ResoniteParser {
  constructor(exportData) {
    this.data = exportData;
    this.typeIndex = this.buildTypeIndex();
    this.assetIndex = this.buildAssetIndex();
    this.componentRegistry = new Map();
  }
  
  buildTypeIndex() {
    const index = new Map();
    this.data.Types.forEach((type, idx) => {
      index.set(idx, type);
    });
    return index;
  }
  
  resolveType(typeRef) {
    if (typeof typeRef === 'number') {
      return this.typeIndex.get(typeRef);
    }
    return typeRef;
  }
  
  parseValue(valueObj) {
    if (valueObj?.Data !== undefined) {
      return valueObj.Data;
    }
    if (valueObj?.ID !== undefined && Object.keys(valueObj).length === 1) {
      return valueObj.ID;
    }
    return valueObj;
  }
}
```

### Phase 2: Hierarchical Conversion
```javascript
class SlotConverter {
  convertSlot(slotData, depth = 0) {
    const entity = {
      name: this.parseValue(slotData.Name) || 'Entity',
      active: this.parseValue(slotData.Active) ?? true,
      layer: 0,
      persistent: Boolean(slotData['Persistent-ID']),
      components: [],
      children: []
    };
    
    // Add Transform component
    entity.components.push(this.createTransform(slotData));
    
    // Process components
    if (slotData.Components?.Data) {
      const components = Array.isArray(slotData.Components.Data) 
        ? slotData.Components.Data 
        : Object.values(slotData.Components.Data);
        
      for (const comp of components) {
        if (comp) {
          const converted = this.convertComponent(comp);
          if (converted) {
            entity.components.push(converted);
          }
        }
      }
    }
    
    // Process children recursively
    if (slotData.Children) {
      const children = Array.isArray(slotData.Children)
        ? slotData.Children
        : slotData.Children.Data || [];
        
      for (const child of children) {
        entity.children.push(this.convertSlot(child, depth + 1));
      }
    }
    
    return entity;
  }
  
  createTransform(slotData) {
    const pos = this.parseValue(slotData.Position) || [0, 0, 0];
    const rot = this.parseValue(slotData.Rotation) || [0, 0, 0, 1];
    const scale = this.parseValue(slotData.Scale) || [1, 1, 1];
    
    return {
      type: 'Transform',
      properties: {
        localPosition: { x: pos[0], y: pos[1], z: pos[2] },
        localRotation: { x: rot[0], y: rot[1], z: rot[2], w: rot[3] },
        localScale: { x: scale[0], y: scale[1], z: scale[2] }
      }
    };
  }
}
```

### Phase 3: Component Conversion
```javascript
class ComponentConverter {
  convertComponent(compData) {
    const typeStr = this.resolveType(compData.Type);
    const shortType = typeStr.split('.').pop();
    
    // Check mapping tables
    if (GEOMETRY_MAP[typeStr]) {
      return this.convertGeometry(compData, GEOMETRY_MAP[typeStr]);
    }
    if (MATERIAL_MAP[typeStr]) {
      return this.convertMaterial(compData, MATERIAL_MAP[typeStr]);
    }
    if (PHYSICS_MAP[typeStr]) {
      return this.convertPhysics(compData, PHYSICS_MAP[typeStr]);
    }
    
    // Handle special cases
    if (typeStr.includes('ProtoFlux')) {
      return this.convertProtoFlux(compData);
    }
    
    // Default: store as custom data
    return {
      type: 'CustomComponent',
      originalType: typeStr,
      data: compData.Data
    };
  }
  
  convertMaterial(compData, mapping) {
    const materialComp = {
      type: mapping.target,
      properties: {
        shaderName: 'Standard'
      }
    };
    
    const data = compData.Data || {};
    for (const [resoniteKey, banterKey] of Object.entries(mapping.mapping)) {
      if (data[resoniteKey]) {
        let value = this.parseValue(data[resoniteKey]);
        
        // Special handling for colors
        if (resoniteKey.includes('Color') && Array.isArray(value)) {
          value = {
            r: value[0],
            g: value[1], 
            b: value[2],
            a: value[3] ?? 1
          };
        }
        
        // Invert smoothness to roughness
        if (resoniteKey === 'Smoothness') {
          value = 1 - value;
        }
        
        materialComp.properties[banterKey] = value;
      }
    }
    
    return materialComp;
  }
}
```

### Phase 4: ProtoFlux to JavaScript
```javascript
class ProtoFluxConverter {
  convertProtoFlux(nodeData) {
    const nodeType = this.resolveType(nodeData.Type);
    const data = nodeData.Data || {};
    
    // Create MonoBehavior with generated script
    return {
      type: 'MonoBehavior',
      properties: {
        file: `generated_${nodeData.ID}.js`,
        vars: this.extractVariables(data)
      },
      generatedScript: this.generateScript(nodeType, data)
    };
  }
  
  generateScript(nodeType, data) {
    // Pattern-based script generation
    if (nodeType.includes('DynamicImpulseReceiver')) {
      return this.generateImpulseReceiver(data);
    }
    if (nodeType.includes('ValueWrite')) {
      return this.generateValueWriter(data);
    }
    if (nodeType.includes('If')) {
      return this.generateConditional(data);
    }
    
    // Default template
    return `
// Auto-generated from ${nodeType}
export default class GeneratedBehavior {
  onStart() {
    console.log('ProtoFlux node: ${nodeType}');
    this.data = ${JSON.stringify(data, null, 2)};
  }
}`;
  }
  
  generateImpulseReceiver(data) {
    const tag = this.parseValue(data.Tag) || 'default';
    return `
export default class ImpulseReceiver {
  onStart() {
    this.scene.addEventListener('impulse-${tag}', (event) => {
      this.onImpulse(event.detail);
    });
  }
  
  onImpulse(data) {
    // Handle impulse
    console.log('Impulse received:', data);
    ${this.generateOutputConnections(data)}
  }
}`;
  }
}
```

### Phase 5: Asset Resolution
```javascript
class AssetResolver {
  constructor(assetData, typesArray) {
    this.assets = new Map();
    this.types = typesArray;
    
    // Build asset index
    for (const asset of assetData) {
      if (asset.Data?.ID) {
        this.assets.set(asset.Data.ID, {
          type: this.resolveType(asset.Type),
          data: asset.Data
        });
      }
    }
  }
  
  resolveAssetReference(assetId) {
    const asset = this.assets.get(assetId);
    if (!asset) return null;
    
    // Convert based on asset type
    const shortType = asset.type.split('.').pop();
    
    if (shortType === 'StaticTexture2D') {
      return {
        type: 'texture',
        url: this.generateTextureURL(asset.data)
      };
    }
    
    if (shortType === 'StaticMesh') {
      return {
        type: 'mesh',
        data: this.convertMeshData(asset.data)
      };
    }
    
    return asset;
  }
}
```

## 4. Implementation Workflow

### Step 1: Pre-processing
```bash
# Split large JSON for processing
python3 split_resonite_export.py export.json
# Creates: slots.json, assets.json, types.json, metadata.json
```

### Step 2: Conversion
```javascript
async function convertResoniteWorld(exportPath) {
  // 1. Load and parse
  const data = await loadJSON(exportPath);
  const parser = new ResoniteParser(data);
  
  // 2. Convert hierarchy
  const converter = new SlotConverter(parser);
  const rootEntity = converter.convertSlot(data.Slots);
  
  // 3. Resolve assets
  const assetResolver = new AssetResolver(data.Assets, data.Types);
  resolveAssetReferences(rootEntity, assetResolver);
  
  // 4. Generate ProtoFlux scripts
  const scripts = generateProtoFluxScripts(rootEntity);
  
  // 5. Output Banter format
  return {
    scene: rootEntity,
    scripts: scripts,
    assets: assetResolver.getRequiredAssets()
  };
}
```

### Step 3: Post-processing
```javascript
class BanterOptimizer {
  optimize(scene) {
    // Merge duplicate materials
    this.mergeDuplicateMaterials(scene);
    
    // Combine static meshes
    this.batchStaticGeometry(scene);
    
    // Optimize hierarchy
    this.flattenEmptyNodes(scene);
    
    // Convert UI to appropriate format
    this.convertUIElements(scene);
    
    return scene;
  }
}
```

## 5. Special Handling Cases

### 5.1 Dynamic Variables
Resonite's `DynamicVariableSpace` components need conversion to MonoBehavior variables:

```javascript
// Resonite
{
  "Type": "FrooxEngine.DynamicVariableSpace",
  "Data": {
    "SpaceName": {"Data": "User"},
    "Variables": [...]
  }
}

// Banter equivalent
{
  "type": "MonoBehavior",
  "properties": {
    "file": "DynamicVars.js",
    "vars": {
      "spaceName": { "type": "string", "value": "User" },
      // Converted variables
    }
  }
}
```

### 5.2 UI Elements
Resonite UIX components need special handling:

```javascript
if (typeStr.includes('UIX')) {
  // Option 1: Convert to HTML/CSS in BanterBrowser
  if (canConvertToHTML(compData)) {
    return convertToHTMLUI(compData);
  }
  
  // Option 2: Use 3D UI elements
  return convertTo3DUI(compData);
}
```

### 5.3 Lights
Unity doesn't expose lights as components in the same way:

```javascript
if (typeStr.includes('Light')) {
  // Store light data for manual Unity setup
  return {
    type: 'LightData',
    requiresManualSetup: true,
    lightType: shortType,
    properties: extractLightProperties(compData)
  };
}
```

## 6. Validation and Testing

### Validation Checks
```javascript
class ConversionValidator {
  validate(original, converted) {
    const report = {
      totalSlots: this.countSlots(original),
      convertedEntities: this.countEntities(converted),
      componentCoverage: this.calculateCoverage(original, converted),
      warnings: [],
      errors: []
    };
    
    // Check for data loss
    if (report.convertedEntities < report.totalSlots * 0.95) {
      report.warnings.push('Significant entity loss detected');
    }
    
    // Verify critical components
    this.validateComponents(original, converted, report);
    
    return report;
  }
}
```

## 7. Output Format

### Final Banter Entity Structure
```json
{
  "author": "ResoniteConverter",
  "created": 1234567890,
  "data": {
    "active": true,
    "name": "Root",
    "parentId": "Scene",
    "components": [
      {
        "type": "Transform",
        "properties": {
          "localPosition": {"x": 0, "y": 0, "z": 0},
          "localRotation": {"x": 0, "y": 0, "z": 0, "w": 1},
          "localScale": {"x": 1, "y": 1, "z": 1}
        }
      }
    ],
    "children": [...]
  },
  "metadata": {
    "sourceVersion": "2025.3.28.1172",
    "conversionDate": "2024-08-28",
    "statistics": {
      "originalSlots": 61289,
      "convertedEntities": 61289,
      "componentsConverted": 45231,
      "protoFluxScripts": 127
    }
  }
}
```

## 8. Challenges and Solutions

### Challenge 1: ProtoFlux Logic Preservation
**Solution**: Generate JavaScript templates based on node patterns, require manual review

### Challenge 2: Asset References
**Solution**: Build comprehensive asset index, generate placeholder assets for missing references

### Challenge 3: Performance with 61,000+ entities
**Solution**: Implement streaming parser, process in chunks, optimize hierarchy

### Challenge 4: Type System Differences
**Solution**: Create adapter layer for type conversions, maintain original type metadata

## 9. Usage Example

```javascript
// CLI Tool
resonite-to-banter convert \
  --input export.json \
  --output converted/ \
  --optimize \
  --generate-scripts \
  --validate

// Programmatic API
import { ResoniteConverter } from './converter';

const converter = new ResoniteConverter({
  validateOutput: true,
  optimizeHierarchy: true,
  generateProtoFlux: true
});

const result = await converter.convert('export.json');
console.log(`Converted ${result.statistics.convertedEntities} entities`);
console.log(`Generated ${result.scripts.length} scripts`);

// Save output
await result.save('./converted-world/');
```

## 10. Next Steps

1. **Implement Core Parser**: Build type resolution and value parsing
2. **Create Component Converters**: Implement mapping for top 20 component types
3. **ProtoFlux Analysis**: Deep-dive into ProtoFlux patterns for better conversion
4. **Asset Pipeline**: Implement texture/mesh/audio conversion
5. **Testing Suite**: Create validation tests with sample exports
6. **UI Converter**: Special handling for UIX components
7. **Performance Optimization**: Streaming parser for large files
8. **Documentation**: User guide and API reference

## Conclusion

Converting Resonite's serialized world format to Banter is technically feasible with an estimated **85-90% automatic conversion rate** for geometry, materials, and physics. ProtoFlux logic will require pattern-based reconstruction with manual review. The hierarchical structure maps well to Banter's entity system, making this a viable migration path for Resonite content.