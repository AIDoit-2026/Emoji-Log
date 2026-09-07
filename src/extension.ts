import * as vscode from 'vscode';
import { GitExtension } from './api/git';
import { configureEmojis, getConfiguredEmojis } from './EmojiLog/EmojiConfiguration';
import { prefixInputBox, resolveTargetInputBoxes } from './EmojiLog/RepositoryTarget';

export function activate(context: vscode.ExtensionContext) {
	const emojiLogCommand = vscode.commands.registerCommand('extension.EmojiLog', async (uri?) => {
		const git = getGitExtension();

		if (!git) {
			vscode.window.showErrorMessage('Unable to load Git Extension');
			return;
		}

		const targetInputBoxes = resolveTargetInputBoxes(git.repositories, uri);
		if (targetInputBoxes.length === 0) {
			void vscode.window.showWarningMessage('Unable to find the selected Git repository.');
			return;
		}

		const emojis = getConfiguredEmojis();
		if (emojis.length === 0) {
			const configure = await vscode.window.showInformationMessage(
				'No Emoji Log prefixes are configured.',
				'Configure Emojis',
			);
			if (configure === 'Configure Emojis') {
				await configureEmojis();
			}
			return;
		}

		const selected = await vscode.window.showQuickPick(
			emojis.map((entry) => ({
				label: entry.prefix,
				description: entry.description,
				prefix: entry.prefix,
			})),
			{ placeHolder: 'Select a particular Emoji Log git commit.' },
		);
		if (!selected) {
			return;
		}

		void vscode.commands.executeCommand('workbench.view.scm');
		for (const inputBox of targetInputBoxes) {
			prefixInputBox(inputBox, selected.prefix);
		}
	});

	const configureCommand = vscode.commands.registerCommand('emojiLog.configureEmojis', configureEmojis);
	context.subscriptions.push(emojiLogCommand, configureCommand);
}
function getGitExtension() {
	const vscodeGit = vscode.extensions.getExtension<GitExtension>('vscode.git');
	const gitExtension = vscodeGit && vscodeGit.exports;
	return gitExtension && gitExtension.getAPI(1);
}

export function deactivate() {}
