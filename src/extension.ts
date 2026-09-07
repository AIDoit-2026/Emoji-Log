import * as vscode from 'vscode';
import { GitExtension, Repository } from './api/git';
import { configureEmojis, getConfiguredEmojis } from './EmojiLog/EmojiConfiguration';

export function activate(context: vscode.ExtensionContext) {
	const emojiLogCommand = vscode.commands.registerCommand('extension.EmojiLog', async (uri?) => {
		const git = getGitExtension();

		if (!git) {
			vscode.window.showErrorMessage('Unable to load Git Extension');
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

		if (uri) {
			const repositoryRoot = uri._rootUri ?? uri.rootUri;
			const selectedRepository = repositoryRoot
				? git.repositories.find((repository) => repository.rootUri.toString() === repositoryRoot.toString())
				: undefined;
			if (selectedRepository) {
				prefixCommit(selectedRepository, selected.prefix);
			} else {
				void vscode.window.showWarningMessage('Unable to find the selected Git repository.');
			}
		} else {
			for (const repo of git.repositories) {
				prefixCommit(repo, selected.prefix);
			}
		}
	});

	const configureCommand = vscode.commands.registerCommand('emojiLog.configureEmojis', configureEmojis);
	context.subscriptions.push(emojiLogCommand, configureCommand);
}

function prefixCommit(repository: Repository, prefix: string) {
	const currentMessage = repository.inputBox.value;
	if (currentMessage === prefix || currentMessage.startsWith(`${prefix} `)) {
		return;
	}
	repository.inputBox.value = `${prefix} ${currentMessage}`;
}

function getGitExtension() {
	const vscodeGit = vscode.extensions.getExtension<GitExtension>('vscode.git');
	const gitExtension = vscodeGit && vscodeGit.exports;
	return gitExtension && gitExtension.getAPI(1);
}

export function deactivate() {}
