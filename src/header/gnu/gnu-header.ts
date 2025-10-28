export interface GnuHeaderAttributes {
	longPath?: string;
	longLinkPath?: string;
}

export class GnuHeader implements GnuHeaderAttributes {
	public readonly longPath: string | undefined;
	public readonly longLinkPath: string | undefined;

	constructor(attributes: GnuHeaderAttributes) {
		this.longPath = attributes.longPath;
		this.longLinkPath = attributes.longLinkPath;
	}
}
