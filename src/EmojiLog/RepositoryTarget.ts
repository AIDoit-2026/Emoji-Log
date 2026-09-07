export interface InputBoxLike {
	value: string;
}

export interface UriLike {
	toString(): string;
}

export interface RepositoryLike {
	rootUri: UriLike;
	inputBox: InputBoxLike;
	ui?: { selected: boolean };
}

export interface SourceControlContext {
	rootUri?: UriLike;
	_rootUri?: UriLike;
	inputBox?: InputBoxLike;
}

export function resolveTargetInputBoxes(
	repositories: RepositoryLike[],
	context?: SourceControlContext,
): InputBoxLike[] {
	if (context?.inputBox) {
		return [context.inputBox];
	}

	const repositoryRoot = context?._rootUri ?? context?.rootUri;
	if (repositoryRoot) {
		const repository = repositories.find(
			(candidate) => candidate.rootUri.toString() === repositoryRoot.toString(),
		);
		return repository ? [repository.inputBox] : [];
	}

	const selectedRepositories = repositories.filter((repository) => repository.ui?.selected);
	if (selectedRepositories.length > 0) {
		return selectedRepositories.map((repository) => repository.inputBox);
	}

	return repositories.length === 1 ? [repositories[0].inputBox] : [];
}

export function prefixInputBox(inputBox: InputBoxLike, prefix: string): void {
	if (inputBox.value === prefix || inputBox.value.startsWith(`${prefix} `)) {
		return;
	}
	inputBox.value = `${prefix} ${inputBox.value}`;
}
