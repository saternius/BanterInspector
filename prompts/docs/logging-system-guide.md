# Inspector Logging System Documentation

## Overview

The Unity Scene Inspector includes a sophisticated logging system that provides both browser console output and an in-app shell interface for debugging. The system was recently refactored to better reflect its shell-like nature rather than a simple console.

## Architecture

### Core Components

#### 1. Logger Class (`frontend/js/utils.js`)

The `Logger` class is the heart of the logging system:

```javascript
export class Logger{
    constructor(){
        this.include = {
            error: true,
            command: true,
            script: true,
            oneShot: false,
            spaceProps: false
        }
        this.tagColors = {};
        this.originalLog = console.log.bind(console);
        this.originalError = console.error.bind(console);
        this.active = true;
    }
}
```

**Key Features:**
- **Tag-based filtering**: Each log has a tag (category) that can be toggled on/off
- **Automatic color assignment**: Each tag gets a unique color via `hashStringToColor()`
- **Preservation of original console methods**: Stores references to native console functions
- **Global activation control**: The `active` flag can disable all logging

#### 2. Global Logging Functions

Two global functions are exposed for easy logging:

##### `window.log(tag, ...args)`
- Primary logging function for informational messages
- Creates collapsible groups in browser console with file location
- Automatically truncates excessively long messages (>1000 chars per arg, >5000 total)
- Sends output to both browser console and the shell panel

##### `window.err(tag, ...args)`
- Similar to `log` but for error messages
- Uses `console.error` instead of `console.log`
- Shows stack traces in collapsible groups
- Outputs to shell with "error" tag

#### 3. Shell Output Function

##### `appendToShell(tag, id, str)`
Located in `frontend/js/utils.js`, this function:
- Checks if the tag is enabled in `window.logger.include`
- Creates a formatted HTML div with the log message
- Adds color-coded tag labels
- Maintains a 500-line buffer (removes oldest when exceeded)
- Auto-scrolls to show latest messages

## User Interface

### Shell Panel (`frontend/js/pages/world-inspector/lifecycle-panel.js`)

The shell is integrated into the Lifecycle Panel:
- Located at the bottom of the lifecycle panel
- Shows command output, script logs, and system messages
- Includes toggle buttons for filtering different log types
- Features a command input field for executing commands

### Shell Toggle Buttons

Located in the shell header, these buttons control log visibility:

```html
<div class="shell-toggles">
    <button class="shell-toggle active" data-toggle="command">Command</button>
    <button class="shell-toggle active" data-toggle="script">Scripts</button>
    <button class="shell-toggle" data-toggle="oneShot">OneShot</button>
    <button class="shell-toggle" data-toggle="spaceProps">SpaceProps</button>
    <button class="shell-clear-button" id="clearShellBtn2">🗑️</button>
</div>
```

**Toggle Behavior:**
- Click toggles the `window.logger.include[toggleType]` boolean
- Active toggles have green background
- Changes take effect immediately for new logs
- Existing logs remain visible until cleared

### Command Input

```html
<input class="command-shell-input" id="commandShellInput" placeholder="> cmd">
```

- Unix-style command line interface
- Supports command history (arrow up/down navigation)
- Commands are parsed and executed via `RunCommand()` in `change-types.js`
- Command output appears in the shell with `[COMMAND]` tag

## Log Categories (Tags)

The system uses tags to categorize and filter logs:

### Default Tags

1. **error** - Always enabled, for error messages
2. **command** - User commands and their output (enabled by default)
3. **script** - MonoBehavior script output (enabled by default)
4. **oneShot** - Network synchronization events (disabled by default)
5. **spaceProps** - Space property changes (disabled by default)

### Custom Tags

Any string can be used as a tag. The system will:
- Automatically assign a consistent color
- Create the tag in the include list on first use
- Allow filtering via programmatic control

## Usage Examples

### Basic Logging

```javascript
// Simple log with tag
log("init", "Application starting...");

// Log with multiple arguments
log("scene", "Entity created:", entity.name, entity.id);

// Error logging
err("network", "Failed to connect:", error);

// Custom tag
log("my-feature", "Custom feature activated");
```

### Controlling Log Visibility

```javascript
// Programmatically enable/disable tags
window.logger.include.oneShot = true;  // Show OneShot logs
window.logger.include.script = false;  // Hide script logs

// Disable all logging
window.logger.active = false;

// Check if a tag is enabled
if (window.logger.include.debug) {
    // Perform expensive debug operation
    log("debug", expensiveDebugInfo());
}
```

### Command Execution

Commands entered in the shell input are processed by the change system:

```
> help                  # Shows available commands
> add_entity Cube       # Creates a new entity
> set_prop color #ff0000  # Sets a property
```

## Stack Trace Information

The logger captures and displays source location:
- Automatically extracts filename and line number from stack
- Skips internal logger frames to show actual caller
- Displays as clickable links in browser console
- Appends location to shell output as `(filename:lineNumber)`

## Performance Considerations

### Truncation Limits
- Individual arguments: 1000 characters
- Total message: 5000 characters
- Shell buffer: 500 lines maximum

### Optimization Tips

1. **Use tag filtering** - Disable verbose tags in production
2. **Conditional logging** - Check `logger.include` before expensive operations
3. **Avoid circular objects** - The system detects and labels them as `[circular object]`
4. **Clear shell periodically** - Use the trash button to clear old logs

## Color System

### Automatic Color Generation

The `hashStringToColor()` function creates consistent colors:
- Generates HSL color from string hash
- Each tag always gets the same color
- Colors have good contrast on dark background
- Saturation: 60-90%
- Lightness: 50-80%

### Special Colors
- **Error messages**: Always red
- **Active toggles**: Green background (#1f3024)
- **Command input**: Green text (#04ff00) on black

## Integration Points

### MonoBehavior Scripts

Scripts can log using the global functions:
```javascript
// In a MonoBehavior script
onStart() {
    log("script", `${this.name} started`);
}
```

### Change System

Commands create Change objects that log their execution:
```javascript
class EntityAddChange {
    apply() {
        // ... create entity ...
        appendToShell("command", this.id, `Created entity: ${name}`);
    }
}
```

### Network Events

OneShot events are logged when the toggle is enabled:
```javascript
networking.handleOneShot = (event) => {
    log("oneShot", "Received:", event.type, event.data);
    // ... handle event ...
}
```

## Debugging Tips

1. **Use descriptive tags** - Makes filtering easier
2. **Include context** - Log relevant IDs, names, states
3. **Use error for critical issues** - These are always visible
4. **Check shell for command history** - Previous commands are visible
5. **Use browser console for stack traces** - Click locations to jump to code
6. **Monitor performance** - Disable verbose logging in production

## Recent Changes (Console → Shell Rename)

The system was recently refactored to better reflect its terminal-like behavior:

### Renamed Elements
- `lifecycleConsole` → `lifecycleShell`
- `console-*` CSS classes → `shell-*` classes
- `clearConsole()` → `clearShell()`
- `appendToConsole()` → `appendToShell()`
- `commandConsoleInput` → `commandShellInput`
- UI text "Console" → "Shell"

This change acknowledges that the interface operates more like a Unix shell with command execution, history, and interactive features rather than a simple output console.

## Best Practices

1. **Consistent Tag Usage**: Use standardized tags across your codebase
2. **Error Handling**: Always use `err()` for errors to ensure visibility
3. **Clean Output**: Clear shell before long operations
4. **Performance**: Disable verbose tags when not debugging
5. **User Commands**: Validate and sanitize command input
6. **Async Operations**: Log both start and completion of long tasks

## Troubleshooting

### Logs Not Appearing
- Check if tag is enabled: `window.logger.include[tagName]`
- Verify logger is active: `window.logger.active`
- Check shell element exists: `document.getElementById("lifecycleShell")`

### Performance Issues
- Too many logs: Increase truncation limits or filter tags
- Shell lag: Clear old messages with trash button
- Memory usage: Reduce buffer size in `appendToShell()`

### Color Issues
- Tags may have similar colors: Manually set in `logger.tagColors`
- Poor contrast: Adjust HSL ranges in `hashStringToColor()`

## Summary

The logging system provides a powerful debugging interface that combines browser console integration with an in-app shell. By understanding its tag-based filtering, command execution, and various output modes, developers can effectively debug and monitor the Unity Scene Inspector application. The recent refactoring to "shell" terminology better reflects its interactive, command-driven nature.