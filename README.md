# Flag Deprecated Files

A Visual Studio Code extension that visually distinguishes deprecated files in the file explorer view. Files marked with the JSDoc or JavaDoc `@deprecated` tag will be highlighted with a subtle badge and color in both the file explorer and a dedicated "Deprecated Files" view. It's pretty basic at the moment, but it gets the job done! Feel free to view the code on [GitHub](https://github.com/WilliamAGH/vscode-flag-deprecated-files-extension) and submit feature requests or PRs.

[![Visual Studio Marketplace](https://img.shields.io/badge/Marketplace-Flag%20Deprecated%20Files-blue.svg)](https://marketplace.visualstudio.com/items?itemName=WilliamCallahan.flag-deprecated-files)

## Screenshot

![Example of deprecated files in VS Code](https://raw.githubusercontent.com/WilliamAGH/vscode-flag-deprecated-files-extension/main/src/resources/example-of-deprecation-flag-in-vscode.png)

_The screenshot above shows how deprecated files are flagged in the file explorer view in Visual Studio Code, Cursor, Windstream, and other VS Code forks._

It's a safe, simple, open source tool. If you'd like to see its code before installing, it's [available here](https://github.com/WilliamAGH/vscode-flag-deprecated-files-extension/blob/main/src/extension.ts)

## Features

- Automatically detects files containing `@deprecated` JSDoc or JavaDoc tags
- Shows subtle badge overlay (⊘) next to deprecated files in the file explorer
- Displays count of deprecated files in folders
- Provides a dedicated "Deprecated Files" view for easy tracking
- Uses a muted amber/gold color scheme to indicate deprecation (customizable)
- Supports JavaScript, TypeScript, Java, Python, and Markdown files currently
- Real-time updates when files are modified
- Configurable directory exclusions and decoration styles
- Lightweight and performant - only scans when needed
- Smart scanning that only checks the first N lines of each file for better performance

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
```

## Configuration

You can customize the extension through VS Code settings. Add any of these examples to your `.vscode/settings.json` for your project:

```json
{
  "flagDeprecatedFiles.excludedDirectories": ["node_modules", "dist", "build"],
  "flagDeprecatedFiles.decorations.badge": "⊘",
  "flagDeprecatedFiles.decorations.color": "amber",
  "flagDeprecatedFiles.decorations.customColor": "#d4a72c",
  "flagDeprecatedFiles.scanOnStartup": true,
  "flagDeprecatedFiles.maxLinesToScan": 12
}
```

### Configuration Options

- `excludedDirectories`: Array of directory names to exclude from scanning (default: `["node_modules"]`)
- `decorations.badge`: Single character to use as badge overlay (default: `"⊘"`)
- `decorations.color`: Color theme for deprecated files (options: `"amber"`, `"gray"`, `"custom"`)
- `decorations.customColor`: Custom color in hex format when using `"custom"` color
- `scanOnStartup`: Whether to scan for deprecated files when VS Code starts (default: `true`)
- `maxLinesToScan`: Maximum number of lines to scan for @deprecated tag in each file (default: `12`)

## Requirements

- Visual Studio Code version 1.90.0 or higher

## Known Limitations

1. **File Scanning**:

   - Only scans the first N lines of each file for @deprecated tag (configurable)
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

See the [CHANGELOG.md](./CHANGELOG.md) for release notes and version history.

## Feature Requests

I wrote this plugin to easily flag which files are deprecated in a few large repositories of my own. If you have any feature requests, feel free to reach out to me on [X / Twitter](https://x.com/williamcallahan) or open an issue or pull request on [GitHub](https://github.com/WilliamAGH/vscode-flag-deprecated-files-extension).

## About the Author

When I'm not working on my day job of building a [venture capital research tool](https://aventure.vc), I'm tinkering with fun things like this! Learn more about me at [williamcallahan.com](https://williamcallahan.com).

**Enjoy!**
