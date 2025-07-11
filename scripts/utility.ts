import { existsSync, mkdirSync } from 'node:fs';

export function mkdirpSync(dirPath: string) {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, {recursive: true});
	}
}
