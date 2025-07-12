# Vector3 Support Documentation

## Overview
The Unity Scene Inspector provides comprehensive support for Vector3 objects throughout the application. Vector3 objects are used extensively in Unity for positions, rotations, scales, and other 3D data.

## Vector3 Object Structure
A Vector3 object in the inspector has the following structure:
```javascript
{
  x: number,
  y: number,
  z: number
}
```

## Implementation Areas

### 1. Component Properties Panel
When editing component properties that are Vector3 values (like Transform position, rotation, scale):

- **Display**: Shows three separate number inputs labeled X, Y, Z
- **Editing**: Each axis can be edited independently
- **Updates**: Changes are immediately reflected in the local state and queued for Unity updates
- **Validation**: Inputs accept any numeric value including decimals and negatives

### 2. Space Properties Panel
Vector3 support in public/protected space properties:

#### Display Mode
- Vector3 values are shown as: `(x, y, z)`
- Example: `(1.5, 2.0, -3.5)`

#### Always Editable
- Vector3 properties always display three separate number inputs
- Each input is labeled with its axis (X, Y, Z)
- Auto-saves on Enter key or when input loses focus (change event)
- No need to toggle edit mode - always ready for input
- Delete button (×) remains available to remove the property

#### Adding New Vector3 Properties
Users can create Vector3 properties by entering values in these formats:
- `(1, 2, 3)` - Parentheses with commas
- `1 2 3` - Space separated
- `1,2,3` - Comma separated
- `{x: 1, y: 2, z: 3}` - JSON format

### 3. Unity Integration
When Vector3 values are sent to Unity:

```javascript
// Properties panel updates
component.position = new BS.Vector3(
    parseFloat(newValue.x),
    parseFloat(newValue.y),
    parseFloat(newValue.z)
);
```

### 4. Data Persistence
Vector3 values are stored in space properties as regular objects:

```javascript
// Space property storage
{
  "spawnPoint": { "x": 0, "y": 1, "z": 0 },
  "targetPosition": { "x": 10, "y": 0, "z": -5 }
}
```

## User Interface

### Component Properties
```
Position
X [____0____] Y [____1____] Z [____0____]

Scale
X [____1____] Y [____1____] Z [____1____]
```

### Space Properties - Always Editable
```
spawnPoint    X [0] Y [1] Z [0]    [❌]
```

Vector3 properties in the space properties panel are always editable - no need to click an edit button. Simply change any axis value and it will auto-save when you press Enter or when the input loses focus.

## API Usage

### Detecting Vector3 Objects
```javascript
import { isVector3Object } from './utils.js';

if (isVector3Object(value)) {
    // Handle as Vector3
}
```

### Parsing Vector3 from String
The `parseValue()` method in space-props-panel.js automatically detects and parses Vector3 formats:

```javascript
parseValue("(1, 2, 3)")     // Returns: {x: 1, y: 2, z: 3}
parseValue("1 2 3")         // Returns: {x: 1, y: 2, z: 3}
parseValue("1,2,3")         // Returns: {x: 1, y: 2, z: 3}
```

### Creating Vector3 Inputs
```javascript
// For each axis
['x', 'y', 'z'].forEach(axis => {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = vector3[axis] || 0;
    input.step = 'any';
    // Add to container
});
```

## Best Practices

1. **Always validate numeric inputs**: Use `parseFloat()` and check for `NaN`
2. **Default to 0**: If an axis value is missing, default to 0
3. **Preserve precision**: Use `step="any"` on number inputs
4. **Consistent formatting**: Display Vector3 as "(x, y, z)" in read-only contexts
5. **Immediate feedback**: Update local state immediately, queue Unity updates

## Common Use Cases

### Transform Components
- Position: World or local position
- Rotation: Euler angles (though Unity may use Quaternions internally)
- Scale: Local scale factors

### Physics
- Velocity vectors
- Force vectors
- Collision bounds (size, center)

### Graphics
- Color (RGB as x, y, z)
- Texture coordinates
- Vertex positions

### Game Logic
- Spawn points
- Target positions
- Movement directions
- Area bounds

## Troubleshooting

### Values not updating
1. Ensure the property is properly detected as Vector3
2. Check that all three values are valid numbers
3. Verify the change is being broadcast via `setSpaceProperty`

### Parsing issues
1. Check the input format matches supported patterns
2. Ensure no extra spaces or characters
3. Try JSON format as fallback: `{"x":1,"y":2,"z":3}`

### Display issues
1. Verify the value has all three properties (x, y, z)
2. Check that values are numeric, not strings
3. Default missing values to 0

## Future Enhancements
- Vector2 support for 2D positions
- Vector4 support for colors with alpha
- Quaternion editing with Euler angle conversion
- Copy/paste Vector3 values
- Vector math operations (normalize, magnitude)
- Visual vector editor with 3D gizmo