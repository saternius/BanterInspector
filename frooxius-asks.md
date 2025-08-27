# Feature Requests for Frooxius - Resonite Export Enhancements

## Context
These feature requests would enable high-fidelity content migration from Resonite to other platforms while preserving interactive behaviors and logic. Currently, exports only preserve geometry and materials, losing all interactive functionality.

## Priority 1: Logic Graph Serialization (Critical)

### Request
Add logic node connection data to exports, preserving the relationships between ProtoFlux nodes.

### Proposed Format
```json
{
  "logicNodes": [
    {
      "id": "node_001",
      "type": "Dynamic Impulse Receiver",
      "position": [x, y, z],
      "properties": {
        "tag": "onOffToggle",
        "enabled": true
      }
    }
  ],
  "connections": [
    {
      "from": { "nodeId": "node_001", "output": "Impulse" },
      "to": { "nodeId": "node_002", "input": "Trigger" },
      "dataType": "impulse"
    }
  ]
}
```

### Rationale
Without connection data, all interactive behaviors are lost during export, requiring complete manual recreation.

## Priority 2: ProtoFlux Script Export (High)

### Request
Export ProtoFlux visual scripts as structured data that can be parsed and converted to other scripting systems.

### Required Data
- Node types and configurations
- Input/output connections with data types
- Variable bindings and scopes
- Execution flow paths
- Group hierarchies

### Example Structure
```json
{
  "protoFluxScripts": [
    {
      "name": "LampController",
      "nodes": [...],
      "connections": [...],
      "variables": {
        "local": [...],
        "inputs": [...],
        "outputs": [...]
      },
      "executionOrder": [...]
    }
  ]
}
```

## Priority 3: GLTF Extensions for Logic (High)

### Request
Implement Resonite-specific GLTF extensions to preserve logic within the industry-standard format.

### Proposed Extensions
```json
{
  "extensions": {
    "RESONITE_logic_nodes": {
      "version": "1.0",
      "nodes": [...],
      "connections": [...],
      "variables": [...]
    },
    "RESONITE_interactions": {
      "grabbable": true,
      "triggers": [...],
      "colliders": [...],
      "physics": {...}
    },
    "RESONITE_components": {
      "components": [...],
      "drivers": [...],
      "bindings": [...]
    }
  }
}
```

### Benefits
- Maintains GLTF compatibility
- Standardized approach for logic preservation
- Could become industry standard for interactive 3D content

## Priority 4: Component State Serialization (Medium)

### Request
Export full component configurations including dynamic variables and bindings.

### Required Data
- Component types and properties
- Dynamic variable values and bindings
- Value/Reference field connections
- Driver relationships
- Component-specific settings

### Format Example
```json
{
  "components": [
    {
      "type": "DynamicValueVariable",
      "id": "var_001",
      "value": 1.0,
      "bindings": [
        {
          "target": "node_005.intensity",
          "mode": "drive"
        }
      ]
    }
  ]
}
```

## Priority 5: Event System Mapping (Medium)

### Request
Export event configurations and handlers to preserve interaction logic.

### Required Data
```json
{
  "events": [
    {
      "trigger": "collision_enter",
      "source": "entity_001",
      "handlers": [
        {
          "type": "impulse",
          "target": "node_002",
          "tag": "onCollision"
        }
      ]
    }
  ]
}
```

## Priority 6: Variable Context Export (Low)

### Request
Preserve variable scoping and cloud/local/user variable states.

### Structure
```json
{
  "variables": {
    "local": {...},
    "user": {...},
    "world": {...},
    "cloud": {...}
  },
  "bindings": [
    {
      "variable": "varName",
      "target": "nodeId.property",
      "mode": "read|write|bidirectional"
    }
  ]
}
```

## Implementation Suggestions

### Option A: Enhanced ResonitePackage Format
Extend the existing .resonitepackage format:
```
ResonitePackage/
├── Assets/           # Existing asset data
├── Metadata/         # Existing metadata
├── Logic/            # NEW: Node graphs and connections
├── Scripts/          # NEW: ProtoFlux exports
├── Components/       # NEW: Component serialization
├── Mappings/         # NEW: Event and variable mappings
└── manifest.json     # Enhanced with logic metadata
```

### Option B: Developer Export Mode
Add a "Developer Export" option that creates:
- Human-readable JSON for all logic
- Complete component serialization
- Asset dependency graphs
- Debug information for conversion tools

### Option C: Export API/SDK
Provide programmatic access for third-party tools:
```csharp
var exporter = new ResoniteExporter();
exporter.IncludeLogic = true;
exporter.IncludeComponents = true;
exporter.Format = ExportFormat.Extended;
var data = exporter.Export(rootSlot);
```

## Minimum Viable Implementation

If resources are limited, the absolute minimum that would enable conversions:

### Single JSON File Addition
Add a `logic.json` file to exports containing:
1. **Node IDs and types** - What logic nodes exist
2. **Connections** - How nodes are wired together
3. **Property values** - Configuration of each node
4. **Execution triggers** - What starts the logic flow

Even this basic data would improve conversion accuracy from ~60% to 95%+.

## Example Use Case

### Current Export (Loses All Logic)
```
DeskLamp.gltf - Geometry and materials only
Result: Static non-interactive lamp
```

### With Proposed Features
```
DeskLamp.gltf - Geometry and materials
DeskLamp.logic.json - ProtoFlux nodes and connections
Result: Fully interactive lamp with toggle behavior preserved
```

## Community Benefits

1. **Content Portability** - Creators can migrate their work between platforms
2. **Archival** - Complete preservation of interactive experiences
3. **Learning** - Educational tools can analyze logic structures
4. **Collaboration** - Teams can work across different tools
5. **Future-Proofing** - Content remains accessible even if platforms change

## Technical Feasibility

All requested features involve data that Resonite already has internally:
- Logic nodes are already serialized for save/load
- Connections exist in the runtime graph
- Component states are already persisted

The request is essentially to expose this existing data during export rather than discarding it.

## Priority Summary

### Must Have (Enables Basic Conversion)
1. Logic node connections
2. ProtoFlux basic export

### Should Have (Enables High-Quality Conversion)
3. GLTF extensions
4. Component serialization
5. Event mappings

### Nice to Have (Enables Perfect Conversion)
6. Variable contexts
7. Timing information
8. Debug metadata

## Contact Message Template

> Hi Frooxius,
> 
> I'm working on tools to help creators preserve and migrate their interactive Resonite content. Currently, exports lose all ProtoFlux logic and interactions, requiring complete manual recreation.
> 
> Would it be possible to add an export option that preserves logic node connections? Even a simple JSON file mapping node IDs to their connections would be incredibly valuable. This would help creators:
> 
> - Archive their complete creative work
> - Share interactive content across platforms
> - Learn from existing logic implementations
> - Future-proof their creations
> 
> I've documented specific technical suggestions that would require minimal changes to Resonite while providing maximum value to the community. The data already exists internally - it just needs to be included in exports.
> 
> Thank you for considering this enhancement to help preserve the amazing interactive content your community creates!

## Alternative Approach

If adding export features isn't feasible, consider:
- Opening the ResonitePackage format specification
- Providing a plugin API for custom exporters
- Documenting the internal data structures
- Creating a "logic-only" export option

Any of these would enable the community to build conversion tools while minimizing impact on core Resonite development.