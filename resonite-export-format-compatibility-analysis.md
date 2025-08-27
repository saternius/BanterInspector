# Resonite to Banter Export Format Compatibility Analysis

## Executive Summary

After thorough analysis of both Banter's entity storage format and Resonite's export capabilities, **GLTF (GL Transmission Format) emerges as the optimal format** for converting Resonite assets to Banter while preserving maximum functionality. This recommendation is based on GLTF's comprehensive scene graph support, human-readable structure, material preservation capabilities, and Banter's existing GLTF component support.

## 1. Banter Entity Storage Format

### Structure Overview
Banter stores entities as JSON files with the following structure:

```json
{
  "author": "username",
  "created": timestamp,
  "data": {
    "active": boolean,
    "components": [...],
    "children": [...],  // Nested entity structures
    "name": "EntityName",
    "parentId": "Scene",
    "layer": number,
    "persistent": boolean
  },
  "itemType": "entity",
  "folder": "CategoryFolder",
  "history": [...]
}
```

### Key Components
- **Transform**: Position, rotation, scale (Unity quaternion format)
- **BanterGeometry**: Procedural mesh generation parameters
- **BanterMaterial**: Shader, color, texture references
- **Physics Components**: BoxCollider, SphereCollider, Rigidbody
- **Interactive Components**: MonoBehavior, BanterGrabHandle, BanterColliderEvents
- **Media Components**: BanterGLTF, BanterAudioSource, BanterVideoPlayer

### Hierarchical Support
Banter fully supports nested entity hierarchies through the `children` array, allowing complex scene graphs with parent-child transform relationships.

## 2. Resonite Export Formats Analysis

### Available Formats

| Format | Extension | Type | Structure | Material Support | Hierarchy | Texture Support |
|--------|-----------|------|-----------|-----------------|-----------|-----------------|
| **GLTF** | .gltf + .bin | JSON + Binary | Excellent | Full PBR | Yes | External files |
| **FBX** | .fbx | Binary | Good | Full | Yes | Embedded/External |
| **COLLADA** | .dae | XML | Good | Full | Yes | External files |
| **OBJ** | .obj + .mtl | Text | Simple | Basic | No | External files |
| **Assimp XML** | .assxml | XML | Good | Full | Yes | External |
| **Assimp Binary** | .assbin | Binary | Good | Full | Yes | External |
| **DirectX** | .x | Text/Binary | Limited | Basic | Yes | Limited |
| **ResonitePackage** | .resonitepackage | ZIP/Custom | Proprietary | Full | Yes | Embedded |

### Format Characteristics

#### GLTF (Recommended) ✅
**Pros:**
- JSON-based scene description (human-readable)
- Industry standard for web 3D content
- Comprehensive PBR material support
- Preserves full scene hierarchy
- Texture files organized in subdirectory
- Banter already has BanterGLTF component
- Supports animations (future compatibility)

**Structure Example:**
```json
{
  "nodes": [...],      // Scene hierarchy
  "meshes": [...],     // Geometry data
  "materials": [...],  // PBR materials
  "textures": [...],   // Texture references
  "images": [...]      // Image file paths
}
```

#### FBX
**Pros:**
- Comprehensive format with full feature support
- Preserves complex hierarchies and relationships
- Industry standard in game development

**Cons:**
- Binary format requires specialized parser
- More complex conversion process
- Larger file sizes

#### COLLADA (DAE)
**Pros:**
- XML-based (human-readable)
- Good hierarchy preservation
- Full material support

**Cons:**
- Verbose XML structure
- Less efficient than GLTF
- Declining industry support

#### OBJ
**Pros:**
- Simple text format
- Easy to parse

**Cons:**
- **No hierarchy support** (critical limitation)
- Basic material support only
- No animation or advanced features

#### ResonitePackage
**Pros:**
- Preserves all Resonite-specific data
- Complete fidelity to original

**Cons:**
- Proprietary format requiring reverse engineering
- Contains Resonite-specific components not mappable to Banter
- Binary asset data in custom format

## 3. Conversion Mapping Strategy

### GLTF to Banter Component Mapping

| GLTF Element | Banter Component | Conversion Notes |
|--------------|------------------|------------------|
| Node Transform | Transform | Direct matrix decomposition to position/rotation/scale |
| Mesh Primitive | BanterGLTF | Reference GLTF file directly |
| PBR Material | BanterMaterial | Map baseColor, metallic, roughness |
| Texture | BanterMaterial.texture | Copy texture files, update paths |
| Node Hierarchy | Entity.children | Recursive entity creation |
| Mesh Geometry | BanterGeometry | For simple primitives, detect type |

### Alternative Approaches

#### Direct Mesh Import
Instead of converting geometry, use Banter's existing **BanterGLTF component** to load the entire GLTF file:

```json
{
  "type": "BanterGLTF",
  "properties": {
    "src": "path/to/imported.gltf",
    "animations": [],
    "loop": false,
    "static": true
  }
}
```

#### Hybrid Approach
1. Import complex meshes via BanterGLTF
2. Convert simple primitives to native Banter geometry
3. Preserve interactivity through component mapping

## 4. Implementation Architecture

### Proposed Converter Pipeline

```
1. Parse GLTF JSON
   ├── Extract scene hierarchy
   ├── Identify materials and textures
   └── Map node relationships

2. Generate Banter Entities
   ├── Create root entity
   ├── Add Transform component from node matrix
   ├── Add BanterGLTF component referencing source
   └── Recursively process children

3. Handle Resources
   ├── Copy texture files to inventory
   ├── Update texture paths in materials
   └── Generate unique names avoiding conflicts

4. Add Interactivity
   ├── Detect Resonite interactive components
   ├── Map to equivalent Banter components
   └── Add default grab/collision as needed

5. Output Inventory Item
   └── Generate JSON with proper metadata
```

### Code Structure Example

```javascript
class ResoniteGLTFConverter {
  constructor(gltfPath) {
    this.gltf = JSON.parse(readFile(gltfPath));
    this.banterEntity = this.createBaseEntity();
  }

  convertNode(nodeIndex, parentId = "Scene") {
    const node = this.gltf.nodes[nodeIndex];
    const entity = {
      name: node.name || `Node_${nodeIndex}`,
      parentId: parentId,
      components: [
        this.extractTransform(node),
        this.createGLTFComponent()
      ],
      children: []
    };
    
    // Process children recursively
    if (node.children) {
      for (const childIndex of node.children) {
        entity.children.push(
          this.convertNode(childIndex, entity.name)
        );
      }
    }
    
    return entity;
  }
}
```

## 5. Preservation of Functionality

### What Can Be Preserved

| Resonite Feature | Banter Equivalent | Preservation Level |
|-----------------|-------------------|-------------------|
| Static Meshes | BanterGLTF | 100% |
| Materials/Textures | BanterMaterial | 90% (PBR subset) |
| Transform Hierarchy | Transform + children | 100% |
| Colliders | Box/Sphere/MeshCollider | 80% (shape approximation) |
| Grabbable Objects | BanterGrabHandle | 100% |
| Lights | Point lights in GLTF | Partial (via GLTF extensions) |
| Scripts/Logic | MonoBehavior | Manual recreation required |
| Animations | GLTF animations | Future support possible |

### Limitations and Workarounds

1. **Resonite-specific Components**: Components like Dynamic Impulse Receivers have no direct equivalent and would need custom MonoBehavior scripts

2. **Complex Materials**: Advanced Resonite shaders must be approximated with standard PBR materials

3. **Interactive Logic**: Resonite's node-based logic must be rewritten as JavaScript for MonoBehavior components

4. **Physics Joints**: Complex constraints may need ConfigurableJoint setup

## 6. Recommended Conversion Workflow

### Automated Process
1. **Export from Resonite**: Use GLTF export with textures
2. **Run Converter**: Process GLTF to generate Banter JSON
3. **Import to Inventory**: Load into Banter inspector
4. **Test and Adjust**: Verify functionality in-world

### Manual Enhancements
1. **Add Interactivity**: Apply grab handles, collision events
2. **Optimize Performance**: Adjust LODs, combine meshes
3. **Script Behaviors**: Create MonoBehavior scripts for logic
4. **Fine-tune Physics**: Adjust colliders and rigidbodies

## 7. Alternative Approach: Multi-Format Hybrid

For maximum fidelity, consider a hybrid approach:

1. **Geometry**: Import via GLTF for mesh data
2. **Materials**: Parse from COLLADA for complete material data
3. **Hierarchy**: Extract from FBX for complex relationships
4. **Metadata**: Parse ResonitePackage for component hints

This would require more complex parsing but could preserve more functionality.

## Conclusion

**GLTF is the recommended format** for Resonite to Banter conversion due to:

1. **Existing Support**: Banter's BanterGLTF component handles GLTF natively
2. **Industry Standard**: Well-documented, widely supported format
3. **Preservation Quality**: Maintains hierarchy, materials, and geometry
4. **Conversion Simplicity**: JSON structure easy to parse and transform
5. **Future-Proof**: Supports extensions for additional features

The converter should focus on GLTF as the primary format while providing hooks for enhanced conversion using supplementary formats when needed. This approach balances implementation complexity with functionality preservation, enabling most Resonite content to transfer successfully to Banter with minimal manual intervention.

## Next Steps

1. Implement GLTF parser and Banter entity generator
2. Create texture path resolver and asset copier
3. Build component mapping system for common patterns
4. Develop testing suite with various Resonite exports
5. Create documentation for manual enhancement process