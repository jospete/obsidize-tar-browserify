export interface LongLinkHeaderAttributes {
	fileName: string;
}

export class LongLinkHeader implements LongLinkHeaderAttributes {
	public readonly fileName: string;

	constructor(attributes: LongLinkHeaderAttributes) {
		this.fileName = attributes.fileName;
	}
}
