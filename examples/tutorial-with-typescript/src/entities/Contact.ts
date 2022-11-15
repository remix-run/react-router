export interface Contact {
	id: string;
	createdAt: number;
	first: string,
	last: string,
	avatar: string,
	twitter: string,
	notes?: string,
	favorite?: boolean,
};

export const isContact = (value: unknown): value is Contact => {
	return (
		typeof value !== 'undefined' &&
		typeof (value as Contact).id === 'string' &&
		typeof (value as Contact).createdAt === 'string' &&
		typeof (value as Contact).first === 'string' &&
		typeof (value as Contact).last === 'string' &&
		typeof (value as Contact).avatar === 'string' &&
		typeof (value as Contact).twitter === 'string' &&
		(
			typeof (value as Contact).notes === 'string' ||
			typeof (value as Contact).notes === 'undefined'
		) &&
		(
			typeof (value as Contact).favorite === 'string' ||
			typeof (value as Contact).favorite === 'undefined'
		)
	)
}

export const isValidNewContact = (value: unknown): value is Contact => {
	return (
		typeof value !== 'undefined' &&
		typeof (value as Contact).first === 'string' &&
		typeof (value as Contact).last === 'string' &&
		typeof (value as Contact).avatar === 'string' &&
		typeof (value as Contact).twitter === 'string' &&
		(
			typeof (value as Contact).notes === 'string' ||
			typeof (value as Contact).notes === 'undefined'
		)
	)
}
