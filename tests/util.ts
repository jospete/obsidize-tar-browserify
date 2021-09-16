export function base64ToUint8Array(base64Str: string): Uint8Array {
	const binary = window.atob(base64Str);
	const bytes = binary.split('').map(s => s.charCodeAt(0));
	return Uint8Array.from(bytes);
}

export function range(size: number): number[] {
	const result = [];
	for (let i = 0; i < size; i++) result.push(i);
	return result;
};