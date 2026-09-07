import * as vscode from 'vscode';
import DefaultEmojiLog, { EmojiLogEntry } from './EmojiLog';

const configurationSection = 'emojiLog';
const configurationKey = 'emojis';

interface IndexedEmojiQuickPickItem extends vscode.QuickPickItem {
	index: number;
}

export function getConfiguredEmojis(): EmojiLogEntry[] {
	const configured = vscode.workspace
		.getConfiguration(configurationSection)
		.get<EmojiLogEntry[]>(configurationKey);

	if (!Array.isArray(configured)) {
		return cloneDefaults();
	}

	return configured
		.filter(isEmojiLogEntry)
		.map((entry) => ({ prefix: entry.prefix.trim(), description: entry.description.trim() }))
		.filter((entry) => entry.prefix.length > 0);
}

export async function configureEmojis(): Promise<void> {
	while (true) {
		const action = await vscode.window.showQuickPick(
			[
				{ label: '$(add) Add Emoji', description: 'Create a new commit prefix', action: 'add' },
				{ label: '$(edit) Edit Emoji', description: 'Change a prefix or description', action: 'edit' },
				{ label: '$(trash) Delete Emoji', description: 'Remove a commit prefix', action: 'delete' },
				{ label: '$(arrow-swap) Reorder Emojis', description: 'Move a prefix up or down', action: 'reorder' },
				{ label: '$(discard) Restore Defaults', description: 'Replace custom emojis with the built-in list', action: 'restore' },
				{ label: '$(settings-gear) Open Settings', description: 'Edit the raw emoji configuration', action: 'settings' },
			],
			{ placeHolder: 'Configure Emoji Log commit prefixes' },
		);

		if (!action) {
			return;
		}

		switch (action.action) {
			case 'add':
				await addEmoji();
				break;
			case 'edit':
				await editEmoji();
				break;
			case 'delete':
				await deleteEmoji();
				break;
			case 'reorder':
				await reorderEmoji();
				break;
			case 'restore':
				await restoreDefaults();
				break;
			case 'settings':
				await vscode.commands.executeCommand(
					'workbench.action.openSettings',
					'@ext:ccimage.emoji-log emojiLog.emojis',
				);
				return;
		}
	}
}

async function addEmoji(): Promise<void> {
	const emojis = getConfiguredEmojis();
	const prefix = await promptForPrefix(emojis);
	if (prefix === undefined) {
		return;
	}

	const description = await promptForDescription();
	if (description === undefined) {
		return;
	}

	emojis.push({ prefix, description });
	await saveEmojis(emojis);
}

async function editEmoji(): Promise<void> {
	const emojis = getConfiguredEmojis();
	const selected = await selectEmoji(emojis, 'Select an emoji to edit');
	if (!selected) {
		return;
	}

	const prefix = await promptForPrefix(emojis, selected.index, selected.entry.prefix);
	if (prefix === undefined) {
		return;
	}

	const description = await promptForDescription(selected.entry.description);
	if (description === undefined) {
		return;
	}

	emojis[selected.index] = { prefix, description };
	await saveEmojis(emojis);
}

async function deleteEmoji(): Promise<void> {
	const emojis = getConfiguredEmojis();
	const selected = await selectEmoji(emojis, 'Select an emoji to delete');
	if (!selected) {
		return;
	}

	const confirmation = await vscode.window.showWarningMessage(
		`Delete ${selected.entry.prefix}?`,
		{ modal: true },
		'Delete',
	);
	if (confirmation !== 'Delete') {
		return;
	}

	emojis.splice(selected.index, 1);
	await saveEmojis(emojis);
}

async function reorderEmoji(): Promise<void> {
	const emojis = getConfiguredEmojis();
	const selected = await selectEmoji(emojis, 'Select an emoji to move');
	if (!selected) {
		return;
	}

	const directions = [];
	if (selected.index > 0) {
		directions.push({ label: '$(arrow-up) Move Up', offset: -1 });
	}
	if (selected.index < emojis.length - 1) {
		directions.push({ label: '$(arrow-down) Move Down', offset: 1 });
	}

	if (directions.length === 0) {
		void vscode.window.showInformationMessage('There are no other emojis to move past.');
		return;
	}

	const direction = await vscode.window.showQuickPick(directions, {
		placeHolder: `Move ${selected.entry.prefix}`,
	});
	if (!direction) {
		return;
	}

	const targetIndex = selected.index + direction.offset;
	[emojis[selected.index], emojis[targetIndex]] = [emojis[targetIndex], emojis[selected.index]];
	await saveEmojis(emojis);
}

async function restoreDefaults(): Promise<void> {
	const confirmation = await vscode.window.showWarningMessage(
		'Restore the built-in Emoji Log prefixes?',
		{ modal: true, detail: 'Your custom emoji configuration will be replaced.' },
		'Restore Defaults',
	);
	if (confirmation === 'Restore Defaults') {
		await saveEmojis(cloneDefaults());
	}
}

async function selectEmoji(
	emojis: EmojiLogEntry[],
	placeHolder: string,
): Promise<{ entry: EmojiLogEntry; index: number } | undefined> {
	if (emojis.length === 0) {
		void vscode.window.showInformationMessage('No emojis are configured yet.');
		return undefined;
	}

	const items: IndexedEmojiQuickPickItem[] = emojis.map((entry, index) => ({
		label: entry.prefix,
		description: entry.description,
		index,
	}));
	const selected = await vscode.window.showQuickPick(items, { placeHolder });
	return selected ? { entry: emojis[selected.index], index: selected.index } : undefined;
}

async function promptForPrefix(
	emojis: EmojiLogEntry[],
	currentIndex?: number,
	value?: string,
): Promise<string | undefined> {
	return vscode.window.showInputBox({
		prompt: 'Enter an emoji and commit prefix',
		placeHolder: '✨ FEATURE:',
		value,
		ignoreFocusOut: true,
		validateInput: (input) => {
			const prefix = input.trim();
			if (!prefix) {
				return 'The prefix cannot be empty.';
			}
			if (emojis.some((entry, index) => index !== currentIndex && entry.prefix === prefix)) {
				return 'This prefix is already configured.';
			}
			return undefined;
		},
	}).then((input) => input?.trim());
}

async function promptForDescription(value?: string): Promise<string | undefined> {
	return vscode.window.showInputBox({
		prompt: 'Describe when this commit prefix should be used',
		placeHolder: 'Add a new feature.',
		value,
		ignoreFocusOut: true,
	}).then((input) => input?.trim());
}

async function saveEmojis(emojis: EmojiLogEntry[]): Promise<void> {
	await vscode.workspace
		.getConfiguration(configurationSection)
		.update(configurationKey, emojis, vscode.ConfigurationTarget.Global);
}

function isEmojiLogEntry(value: unknown): value is EmojiLogEntry {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const entry = value as { prefix?: unknown; description?: unknown };
	return typeof entry.prefix === 'string' && typeof entry.description === 'string';
}

function cloneDefaults(): EmojiLogEntry[] {
	return DefaultEmojiLog.map((entry) => ({ ...entry }));
}
