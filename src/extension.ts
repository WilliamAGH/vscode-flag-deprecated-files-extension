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
}

class DeprecatedFilesDecorationProvider implements vscode.FileDecorationProvider {
	private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
	readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
	private deprecatedFiles: Set<string> = new Set();
	private config: DeprecatedFilesConfig;

	constructor() {
		this.config = this.getConfig();
		// Listen for configuration changes
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('flagDeprecatedFiles')) {
				this.config = this.getConfig();
				this.updateDecorations();
			}
		});
	}

	private getConfig(): DeprecatedFilesConfig {
		const config = vscode.workspace.getConfiguration('flagDeprecatedFiles');
		return {
			excludedDirectories: config.get<string[]>('excludedDirectories', ['node_modules']),
			decorations: {
				badge: config.get<string>('decorations.badge', '⊖'),  // CIRCLED MINUS - clean, professional look
				color: config.get<string>('decorations.color', 'amber'),
				customColor: config.get<string>('decorations.customColor', '#d4a72c')
			},
			scanOnStartup: config.get<boolean>('scanOnStartup', true)
		};
	}

	async checkSingleFile(uri: vscode.Uri): Promise<boolean> {
		try {
			const document = await vscode.workspace.openTextDocument(uri);
			const text = document.getText();
			return text.includes('@deprecated');
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
			'**/*.{js,ts,jsx,tsx,java,py,md,mdx}',  // All matching files in workspace
			`{${this.config.excludedDirectories.map(dir => `**/${dir}/**`).join(',')}}`
		);

		for (const file of files) {
			if (await this.checkSingleFile(file)) {
				this.deprecatedFiles.add(file.fsPath);
			}
		}
		this.updateDecorations();
	}

	async handleFileChange(uri: vscode.Uri) {
		const isDeprecated = await this.checkSingleFile(uri);
		const wasDeprecated = this.deprecatedFiles.has(uri.fsPath);

		if (isDeprecated && !wasDeprecated) {
			this.deprecatedFiles.add(uri.fsPath);
			this.updateDecorations(uri);
		} else if (!isDeprecated && wasDeprecated) {
			this.deprecatedFiles.delete(uri.fsPath);
			this.updateDecorations(uri);
		}
	}

	handleFileDelete(uri: vscode.Uri) {
		if (this.deprecatedFiles.has(uri.fsPath)) {
			this.deprecatedFiles.delete(uri.fsPath);
			this.updateDecorations(uri);
		}
	}

	async handleFileCreate(uri: vscode.Uri) {
		if (await this.checkSingleFile(uri)) {
			this.deprecatedFiles.add(uri.fsPath);
			this.updateDecorations(uri);
		}
	}

	provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
		if (!this.deprecatedFiles.has(uri.fsPath)) {
			return undefined;
		}

		const fileName = path.basename(uri.fsPath);
		
		// Enhanced decoration that shows both in explorer and tabs
		return {
			badge: '⊖',  // Clean, professional look that works in both light/dark themes
			color: this.config.decorations.color === 'custom' 
				? new vscode.ThemeColor(this.config.decorations.customColor)
				: new vscode.ThemeColor('deprecated.files.subtle'),
			tooltip: `⊖ ${applyStrikethrough(fileName)}\n\nThis file is marked as deprecated.\nConsider updating any code that depends on it.`
		};
	}

	updateDecorations(uri?: vscode.Uri) {
		this._onDidChangeFileDecorations.fire(uri);
	}

	async clearAndRescan(): Promise<void> {
		this.deprecatedFiles.clear();
		await this.updateDeprecatedFiles();
	}
}

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
	// Create and register the decoration provider
	const decorationProvider = new DeprecatedFilesDecorationProvider();
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

	watcher.onDidChange(uri => decorationProvider.handleFileChange(uri));
	watcher.onDidCreate(uri => decorationProvider.handleFileCreate(uri));
	watcher.onDidDelete(uri => decorationProvider.handleFileDelete(uri));

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
