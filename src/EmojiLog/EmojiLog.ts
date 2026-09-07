export interface EmojiLogEntry {
	prefix: string;
	description: string;
}

const EmojiLog: EmojiLogEntry[] = [
	{
		prefix: '📦 NEW:',
		description: 'Add something entirely new.',
	},
	{
		prefix: '👌 IMPROVE:',
		description: 'Improve piece of code like refactoring.',
	},
	{
		prefix: '🐛 FIX:',
		description: 'Fix a bug — need I say more?',
	},
	{
		prefix: '📖 DOC:',
		description: 'Anything documentation related.',
	},
	{
		prefix: '🚀 RELEASE:',
		description: 'Release a new version.',
	},
	{
		prefix: '🤖 TEST:',
		description: 'Testing related commits.',
	},
	{
		prefix: '‼️ BREAKING:',
		description: 'Change that breaks previous versions.',
	},
];
export default EmojiLog;
