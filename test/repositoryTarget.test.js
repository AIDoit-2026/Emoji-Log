'use strict';

const assert = require('assert');
const {
	prefixInputBox,
	resolveTargetInputBoxes,
} = require('../out/EmojiLog/RepositoryTarget');

function createRepository(path, selected = false) {
	return {
		rootUri: { toString: () => `file:///${path}` },
		inputBox: { value: '' },
		ui: { selected },
	};
}

function prefixTargets(repositories, context, prefix) {
	for (const inputBox of resolveTargetInputBoxes(repositories, context)) {
		prefixInputBox(inputBox, prefix);
	}
}

const first = createRepository('first');
const second = createRepository('second', true);

prefixTargets([first, second], { inputBox: second.inputBox }, '🐛 FIX:');

assert.strictEqual(first.inputBox.value, '', 'the first repository must remain unchanged');
assert.strictEqual(second.inputBox.value, '🐛 FIX: ', 'the clicked repository must receive the prefix');

first.inputBox.value = '';
second.inputBox.value = '';
prefixTargets([first, second], undefined, '📖 DOC:');

assert.strictEqual(first.inputBox.value, '', 'an unselected repository must remain unchanged');
assert.strictEqual(second.inputBox.value, '📖 DOC: ', 'the selected repository must receive the prefix');

console.log('multi-repository target test passed');
