export function base64ToUint8Array(base64Str: string): Uint8Array {
	const binaryStr = window.atob(base64Str);
	const bytes = binaryStr.split('').map((s) => s.charCodeAt(0));
	return Uint8Array.from(bytes);
}

export function hexToUint8Array(hex: string): Uint8Array {
	const segments = Array.from(hex.replace(/[^a-fA-F0-9]/gm, '').match(/.{1,2}/g)!);
	const bytes = segments.map((b) => parseInt(b, 16));
	return Uint8Array.from(bytes);
}

export function range(size: number): number[] {
	const result: number[] = [];
	for (let i = 0; i < size; i++) result.push(i);
	return result;
}
