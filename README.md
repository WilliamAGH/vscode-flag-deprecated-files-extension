# Flag Deprecated Files

A Visual Studio Code extension that visually distinguishes deprecated files in the file explorer view. Files marked with the JSDoc or JavaDoc `@deprecated` tag will be highlighted with a subtle badge and color in both the file explorer and a dedicated "Deprecated Files" view.

## Features

- Automatically detects files containing `@deprecated` JSDoc or JavaDoc tags
- Shows subtle badge overlay (⊘) next to deprecated files in the file explorer
- Provides a dedicated "Deprecated Files" view for easy tracking
- Uses a muted amber/gold color scheme to indicate deprecation (customizable)
- Supports JavaScript, TypeScript, Java, Python, and Markdown files
- Real-time updates when files are modified
- Configurable directory exclusions and decoration styles
- Lightweight and performant - only scans when needed

## Usage

1. Install the extension
2. Open a workspace containing files with `@deprecated` JSDoc tags
3. The extension will automatically scan and mark deprecated files (if enabled)
4. Use the command "Flag Deprecated Files: Scan Workspace" to manually rescan files
5. Check the "Deprecated Files" view in the explorer sidebar for a dedicated list

Example of a deprecated file:
```javascript
/**
 * @deprecated This file is deprecated and will be removed in the next version
 */
console.log('This file is deprecated');
```

## Configuration

You can customize the extension through VS Code settings. Add these to your `.vscode/settings.json`:

```json
{
    "flagDeprecatedFiles.excludedDirectories": ["node_modules", "dist", "build"],
    "flagDeprecatedFiles.decorations.badge": "⊘",
    "flagDeprecatedFiles.decorations.color": "amber",
    "flagDeprecatedFiles.decorations.customColor": "#d4a72c",
    "flagDeprecatedFiles.scanOnStartup": true
}
```

### Configuration Options

- `excludedDirectories`: Array of directory names to exclude from scanning (default: `["node_modules"]`)
- `decorations.badge`: Single character to use as badge overlay (default: `"⊘"`)
- `decorations.color`: Color theme for deprecated files (options: `"amber"`, `"gray"`, `"custom"`)
- `decorations.customColor`: Custom color in hex format when using `"custom"` color
- `scanOnStartup`: Whether to scan for deprecated files when VS Code starts (default: `true`)

## Requirements

- Visual Studio Code version 1.90.0 or higher

## Known Limitations

1. **File Scanning**:
   - Only scans root-level files by default for performance
   - Limited to specific file types: .js, .ts, .jsx, .tsx, .java, .py, .md, .mdx
   - Simple text search for "@deprecated" tag (no AST parsing)

2. **Decorations**:
   - Badge overlay is limited to a single character (VS Code API limitation)
   - Cannot modify the file type icon directly (VS Code API limitation)
   - Color applies to the entire filename (cannot color specific parts)

3. **Performance Considerations**:
   - Initial scan occurs on startup (if enabled) or when view is first opened
   - Large workspaces with many files may take longer to scan
   - File watcher only monitors root-level files for changes

## Release Notes

### 1.0.0

Initial release:
- Dual-view system: File Explorer decorations and dedicated Deprecated Files view
- Configurable badge and color schemes
- Performance optimizations for file scanning
- Real-time updates with file watcher
- Comprehensive configuration options

**Enjoy!**
