export function base64ToUint8Array(base64Str: string): Uint8Array {
	const binaryStr = window.atob(base64Str);
	const bytes = binaryStr.split('').map(s => s.charCodeAt(0));
	return Uint8Array.from(bytes);
}

export function range(size: number): number[] {
	const result = [];
	for (let i = 0; i < size; i++) result.push(i);
	return result;
};