import localforage from "localforage";
import { matchSorter } from "match-sorter";
import { sortBy } from "sort-by-typescript";

import { Contact } from '../entities/Contact'

export async function getContacts(query?: string) {
	await fakeNetwork(`getContacts:${query}`);
	let contacts = await localforage.getItem<Contact[]>("contacts");
	if (!contacts) contacts = [];
	if (query) {
		contacts = matchSorter(contacts, query, { keys: ["first", "last"] });
	}

	return contacts.sort(sortBy("last", "createdAt"));
}

export async function createContact(contact: Omit<Contact, 'id' | 'createdAt'>) {
	await fakeNetwork();
	let id = Math.random().toString(36).substring(2, 9);
	let newContact: Contact = { id, createdAt: Date.now(), ...contact };
	let contacts = await getContacts();
	contacts.unshift(newContact);
	await set(contacts);

	return newContact;
}

export async function getContact(id: Contact['id']) {
	await fakeNetwork(`contact:${id}`);
	const contacts = await localforage.getItem<Contact[]>("contacts");

	if (!contacts) return null;

	const contact = contacts.find(contact => contact.id === id);

	return contact ?? null;
}

export async function updateContact(id: Contact['id'], updates: Partial<Omit<Contact, 'id' | 'createdAt'>>) {
	await fakeNetwork();
	const contacts = await localforage.getItem<Contact[]>("contacts");
	if (!contacts) throw new Error("No contacts found");

	const contact = contacts.find(contact => contact.id === id);

	if (!contact) throw new Error(`No contact found for: ${id}`);

	Object.assign(contact, updates);
	await set(contacts);

	return contact;
}

export async function deleteContact(id: Contact['id']) {
	const contacts = await localforage.getItem<Contact[]>("contacts");

	if (!contacts) throw new Error('No contacts found');

	const index = contacts.findIndex(contact => contact.id === id);

	if (index > -1) {
		contacts.splice(index, 1);
		await set(contacts);

		return true;
	}

	return false;
}

function set(contacts: Contact[]) {
	return localforage.setItem("contacts", contacts);
}

// fake a cache so we don't slow down stuff we've already seen
let fakeCache: Record<string, boolean> = {};

async function fakeNetwork(key?: string) {
	if (!key) {
		fakeCache = {};
		return;
	}

	if (fakeCache[key]) {
		return;
	}

	fakeCache[key] = true;
	return new Promise(res => {
		setTimeout(res, Math.random() * 800);
	});
}
