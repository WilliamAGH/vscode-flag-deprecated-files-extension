// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
function applyStrikethrough(text: string): string {
    return text.split('').map(char => char + '\u0336').join('');
}

interface DeprecatedFilesConfig {
	excludedDirectories: string[];
	decorations: {
		badge: string;
		color: string;
		customColor: string;
	};
	scanOnStartup: boolean;
	maxLinesToScan: number;
}

class DeprecatedFilesDecorationProvider implements vscode.FileDecorationProvider {
	private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
	readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
	private deprecatedFiles: Set<string> = new Set();
	private deprecatedFolderCounts: Map<string, number> = new Map();
	private config: DeprecatedFilesConfig;
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.config = this.getConfig();
	// Listen for configuration changes
	vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
			if (e.affectsConfiguration('flagDeprecatedFiles')) {
				this.config = this.getConfig();
				this.updateDecorations();
			}
		});
		// Load cached deprecated files on startup
		const cached = this.context.globalState.get<string[]>('deprecatedFiles', []);
		this.deprecatedFiles = new Set(cached);
	}

	private getConfig(): DeprecatedFilesConfig {
		const config = vscode.workspace.getConfiguration('flagDeprecatedFiles');
		return {
			excludedDirectories: config.get<string[]>('excludedDirectories', ['node_modules']),
			decorations: {
				badge: config.get<string>('decorations.badge', '⊖'),
				color: config.get<string>('decorations.color', 'custom'),
				customColor: config.get<string>('decorations.customColor', '#9B8EB5')
			}, 
			scanOnStartup: config.get<boolean>('scanOnStartup', true),
			maxLinesToScan: config.get<number>('maxLinesToScan', 12)
		};
	}

	async checkSingleFile(uri: vscode.Uri): Promise<boolean> {
		try {
			// Read first chunk of file as raw bytes
			const bytes = await vscode.workspace.fs.readFile(uri);
			// Quick check first 1KB for @deprecated
			const quickCheck = new TextDecoder().decode(bytes.slice(0, 1024));
			if (!quickCheck.includes('@deprecated')) {
				return false;
			}
			
			// Only if quick check finds potential match, do full line check
			const document = await vscode.workspace.openTextDocument(uri);
			for (let i = 0; i < Math.min(document.lineCount, this.config.maxLinesToScan); i++) {
				if (document.lineAt(i).text.includes('@deprecated')) {
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error(`Error processing file ${uri.fsPath}:`, error);
			return false;
		}
	}

	async updateDeprecatedFiles() {
		if (!vscode.workspace.workspaceFolders) {
			return;
		}

		const files = await vscode.workspace.findFiles(
			'**/*.{js,ts,jsx,tsx,java,py,md,mdx}',
			`{${this.config.excludedDirectories.map(dir => `**/${dir}/**`).join(',')}}`
		);

		const BATCH_SIZE = 20; // Process 20 files at a time
		
		for (let i = 0; i < files.length; i += BATCH_SIZE) {
			const batch = files.slice(i, i + BATCH_SIZE);
			await Promise.all(batch.map(async (file: vscode.Uri) => {
				if (await this.checkSingleFile(file)) {
					this.deprecatedFiles.add(file.fsPath);
					this.updateFolderCount(file.fsPath);
				}
			}));
			
			// Update UI every batch
			this.updateDecorations();
			
			// Let other VS Code operations happen
			await new Promise(resolve => setTimeout(resolve, 10));
		}
	}

	private updateFolderCount(filePath: string) {
		const dir = path.dirname(filePath);
		const count = this.deprecatedFolderCounts.get(dir) || 0;
		this.deprecatedFolderCounts.set(dir, count + 1);
	}

	async handleFileChange(uri: vscode.Uri) {
		const isDeprecated = await this.checkSingleFile(uri);
		const wasDeprecated = this.deprecatedFiles.has(uri.fsPath);

		if (isDeprecated && !wasDeprecated) {
			this.deprecatedFiles.add(uri.fsPath);
			this.updateFolderCount(uri.fsPath);
			this.updateDecorations(uri);
		} else if (!isDeprecated && wasDeprecated) {
			this.deprecatedFiles.delete(uri.fsPath);
			this.decrementFolderCount(uri.fsPath);
			this.updateDecorations(uri);
		}
	}

	private decrementFolderCount(filePath: string) {
		const dir = path.dirname(filePath);
		const count = this.deprecatedFolderCounts.get(dir) || 0;
		if (count > 1) {
			this.deprecatedFolderCounts.set(dir, count - 1);
		} else {
			this.deprecatedFolderCounts.delete(dir);
		}
	}

	handleFileDelete(uri: vscode.Uri) {
		if (this.deprecatedFiles.has(uri.fsPath)) {
			this.deprecatedFiles.delete(uri.fsPath);
			this.decrementFolderCount(uri.fsPath);
			this.updateDecorations(uri);
		}
	}

	async handleFileCreate(uri: vscode.Uri) {
		if (await this.checkSingleFile(uri)) {
			this.deprecatedFiles.add(uri.fsPath);
			this.updateFolderCount(uri.fsPath);
			this.updateDecorations(uri);
		}
	}

	private async isDirectory(fsPath: string): Promise<boolean> {
		try {
			const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fsPath));
			return stat.type === vscode.FileType.Directory;
		} catch {
			return false;
		}
	}

	async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
		const isFile = uri.scheme === 'file';
		if (!isFile) {
			return undefined;
		}

		const fsPath = uri.fsPath;
		
		// First check if it's a deprecated file
		if (this.deprecatedFiles.has(fsPath)) {
			const fileName = path.basename(fsPath);
			return {
				badge: this.config.decorations.badge,
				color: this.config.decorations.color === 'custom' 
					? new vscode.ThemeColor(this.config.decorations.customColor)
					: new vscode.ThemeColor('deprecated.files.subtle'),
				tooltip: `${this.config.decorations.badge} ${applyStrikethrough(fileName)}\n\nThis file is marked as deprecated.\nConsider updating any code that depends on it.`
			};
		}

		// Then check if it's a directory with deprecated files
		try {
			const stat = await vscode.workspace.fs.stat(uri);
			if (stat.type === vscode.FileType.Directory) {
				const count = this.deprecatedFolderCounts.get(fsPath);
				if (count) {
					return {
						badge: `${count} ${this.config.decorations.badge}`,
						color: this.config.decorations.color === 'custom' 
							? new vscode.ThemeColor(this.config.decorations.customColor)
							: new vscode.ThemeColor('deprecated.files.subtle'),
						tooltip: `Contains ${count} deprecated file${count > 1 ? 's' : ''}`
					};
				}
			}
		} catch (error) {
			console.error(`Error checking directory status for ${fsPath}:`, error);
		}

		return undefined;
	}

	updateDecorations(uri?: vscode.Uri) {
		this._onDidChangeFileDecorations.fire(uri);
	}

	async clearAndRescan(): Promise<void> {
		this.deprecatedFiles.clear();
		this.deprecatedFolderCounts.clear();
		await this.updateDeprecatedFiles();
	}

	// Save to cache whenever we update deprecated files
	private async saveToCache() {
		await this.context.globalState.update('deprecatedFiles', 
			Array.from(this.deprecatedFiles));
	}
}

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
	// Create and register the decoration provider
	const decorationProvider = new DeprecatedFilesDecorationProvider(context);
	const decorationRegistration = vscode.window.registerFileDecorationProvider(decorationProvider);

	// Register the command to scan workspace
	let scanCommand = vscode.commands.registerCommand('flag-deprecated-files.scanWorkspace', async () => {
		await decorationProvider.clearAndRescan();
	});

	// Watch for file changes
	const watcher = vscode.workspace.createFileSystemWatcher(
		'**/*.{js,ts,jsx,tsx,java,py,md,mdx}',
		false,
		false,
		false
	);

	watcher.onDidChange((uri: vscode.Uri) => decorationProvider.handleFileChange(uri));
	watcher.onDidCreate((uri: vscode.Uri) => decorationProvider.handleFileCreate(uri));
	watcher.onDidDelete((uri: vscode.Uri) => decorationProvider.handleFileDelete(uri));

	// Initial scan if enabled
	const config = vscode.workspace.getConfiguration('flagDeprecatedFiles');
	if (config.get<boolean>('scanOnStartup', true)) {
		await decorationProvider.clearAndRescan();
	}

	context.subscriptions.push(
		decorationRegistration,
		scanCommand,
		watcher
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
