import * as vscode from 'vscode';
import { getNonce } from './utils/nonce';

// This method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
	const provider = new GameProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(GameProvider.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('2048.restart', () => {
			provider.restart();
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('2048.reset', () => {
			provider.reset();
		})
	);
}

class GameProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = '2048.view';

	private view?: vscode.WebviewView;

	constructor(
		private readonly extensionUri: vscode.Uri,
	) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this.view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.extensionUri, 'game')
			]
		};
		webviewView.webview.html = this.getHtmlWebview(webviewView.webview);
	}

	private getHtmlWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'game', 'main.js'));
		const styleGame = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'game', 'style.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
				<title>2048</title>
				<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
				<link rel="stylesheet" href="${styleGame}">
			</head>
		
			<body>
				<div id="container">
					<div id="head">
						<h1 class="title">2048</h1>
						<div id="scroreBar">
							<div id="score">0</div>
						</div>
						<div id="bestScroreBar">
							<div id="bestScore">0</div>
						</div>     
					</div>
					<div id="board">
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="item"></div>
						<div class="mask" hidden></div>
						<div class="gameover" hidden>Game over!</div>
					</div>
				</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>`;
	}

	private messageHandler(resolve: () => void) {
		return (message: { type: string; }) => {
			if (message.type === 'ready') {
				resolve();
			}
		}
	};

	public async restart(): Promise<void> {
		if (this.view) {
			const webviewReadyPromise = new Promise<void>((resolve) => {
				this.view?.webview.onDidReceiveMessage(this.messageHandler(resolve));
				this.view?.webview.postMessage({ type: 'restart' });
			});
			await webviewReadyPromise;
			this.view.webview.html = this.getHtmlWebview(this.view.webview);
		}
	}

	public async reset(): Promise<void> {
		if (this.view) {
			const webviewReadyPromise = new Promise<void>((resolve) => {
				this.view?.webview.onDidReceiveMessage(this.messageHandler(resolve));
				this.view?.webview.postMessage({ type: 'reset' });
			});
			await webviewReadyPromise;
			this.view.webview.html = this.getHtmlWebview(this.view.webview);			
		}		
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
