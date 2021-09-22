import { TarHeader } from './tar-header'
import { TarHeaderField } from './tar-header-field'
import { TarHeaderFieldType } from './tar-header-field-type'

/**
 * Definitions taken from here:
 * https://en.wikipedia.org/wiki/Tar_(computing)
 */
export namespace TarHeaderFieldDefinition {

	// NOTE: We use object creator functions here so that each tar header gets its own instances of these fields,
	// in order to prevent programmatic data pollution.

	// Legacy Fields
	export function fileName(): TarHeaderField { return ({ name: 'fileName', offset: 0, size: 100, type: TarHeaderFieldType.ASCII_PADDED }) }
	export function fileMode(): TarHeaderField { return ({ name: 'fileMode', offset: 100, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function ownerUserId(): TarHeaderField { return ({ name: 'ownerUserId', offset: 108, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function groupUserId(): TarHeaderField { return ({ name: 'groupUserId', offset: 116, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function fileSize(): TarHeaderField { return ({ name: 'fileSize', offset: 124, size: 12, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function lastModified(): TarHeaderField { return ({ name: 'lastModified', offset: 136, size: 12, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function headerChecksum(): TarHeaderField { return ({ name: 'headerChecksum', offset: 148, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function typeFlag(): TarHeaderField { return ({ name: 'typeFlag', offset: 156, size: 1, type: TarHeaderFieldType.ASCII }) }
	export function linkedFileName(): TarHeaderField { return ({ name: 'linkedFileName', offset: 157, size: 100, type: TarHeaderFieldType.ASCII }) }

	// USTAR Fields
	export function ustarIndicator(): TarHeaderField { return ({ name: 'ustarIndicator', offset: 257, size: 6, type: TarHeaderFieldType.ASCII, constantValue: 'ustar\0' }) }
	export function ustarVersion(): TarHeaderField { return ({ name: 'ustarVersion', offset: 263, size: 2, type: TarHeaderFieldType.ASCII, constantValue: '00' }) }
	export function ownerUserName(): TarHeaderField { return ({ name: 'ownerUserName', offset: 265, size: 32, type: TarHeaderFieldType.ASCII }) }
	export function ownerGroupName(): TarHeaderField { return ({ name: 'ownerGroupName', offset: 297, size: 32, type: TarHeaderFieldType.ASCII }) }
	export function deviceMajorNumber(): TarHeaderField { return ({ name: 'deviceMajorNumber', offset: 329, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function deviceMinorNumber(): TarHeaderField { return ({ name: 'deviceMinorNumber', offset: 337, size: 8, type: TarHeaderFieldType.INTEGER_OCTAL }) }
	export function fileNamePrefix(): TarHeaderField { return ({ name: 'fileNamePrefix', offset: 345, size: 155, type: TarHeaderFieldType.ASCII }) }
	export function padding(): TarHeaderField { return ({ name: 'padding', offset: 500, size: 12, type: TarHeaderFieldType.ASCII, constantValue: '000000000000' }) }

	const fieldsByName: { [key in (keyof TarHeader)]: () => TarHeaderField } = {
		fileName,
		fileMode,
		ownerUserId,
		groupUserId,
		fileSize,
		lastModified,
		headerChecksum,
		typeFlag,
		linkedFileName,
		ustarIndicator,
		ustarVersion,
		ownerUserName,
		ownerGroupName,
		deviceMajorNumber,
		deviceMinorNumber,
		fileNamePrefix,
		padding
	};

	export function getFieldDefinition(fieldName: keyof TarHeader): TarHeaderField | undefined {
		const target = fieldsByName[fieldName];
		return target ? target() : undefined;
	}

	export function orderedSet(): TarHeaderField[] {
		return [
			fileName(),
			fileMode(),
			ownerUserId(),
			groupUserId(),
			fileSize(),
			lastModified(),
			headerChecksum(),
			typeFlag(),
			linkedFileName(),
			ustarIndicator(),
			ustarVersion(),
			ownerUserName(),
			ownerGroupName(),
			deviceMajorNumber(),
			deviceMinorNumber(),
			fileNamePrefix(),
			padding()
		];
	}
}