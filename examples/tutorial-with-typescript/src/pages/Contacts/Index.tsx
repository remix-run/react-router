import { useEffect, useState } from 'react';
import { Form, Link, LoaderFunctionArgs, NavLink, Outlet, useLoaderData, useNavigation, useSearchParams, useSubmit } from 'react-router-dom';

import { getContacts } from '../../api/contacts'
import { Contact } from '../../entities/Contact';

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const q = url.searchParams.get('q') || undefined;
	const contacts = await getContacts(q);

	return { contacts };
}

const ContactItem: React.FC<{ contact: Contact }> = ({ contact }) =>
	<li>
		<NavLink className={(props) => {
			if (props.isActive) return "active";
			if (props.isPending) return "pending";

			return "";
		}} to={`contacts/${contact.id}`}>{contact.first} {contact.last}</NavLink>
	</li>

const Contacts = () => {
	const { contacts } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

	return (
		contacts.length === 0
			? (<p>
				<i>No contacts</i>
			</p>)
			:
			<ul>
				{contacts.map(contact => <ContactItem key={contact.id} contact={contact} />)}
			</ul>
	)
}

export const Index = () => {
	const search = useSubmit();
	const navigation = useNavigation();
	const params = navigation.location && new URLSearchParams(navigation.location.search);
	const isSearching = params?.has('q');
	const [clientSideParams,] = useSearchParams();
	const [searchInput, setSearchInput] = useState<string | null>(null);

	useEffect(() => {
		if (params?.has('q')) {
			setSearchInput(params.get('q'))
		} else {
			setSearchInput(clientSideParams.get('q'))
		}
	}, [params?.get('q'), clientSideParams.get('q')])

	return (
		<>
			<div id="sidebar">
				<h1>React Router Contacts</h1>
				<div>
					<Form id="search-form" role="search">
						<input
							className={isSearching ? "loading" : ""}
							defaultValue={searchInput || undefined}
							onChange={(event) => search(event.currentTarget.form)}
							id="q"
							aria-label="Search contacts"
							placeholder="Search"
							type="search"
							name="q"
						/>
						<div
							id="search-spinner"
							aria-hidden
							hidden={!isSearching}
						/>
						<div
							className="sr-only"
							aria-live="polite"
						></div>
					</Form>
					<Link to='contacts/create'>New</Link>
				</div>
				<nav>
					<Contacts />
				</nav>
			</div>
			<div id="detail" className={navigation.state === 'loading' ? "loading" : ""}><Outlet /></div>
		</>
	)
}
