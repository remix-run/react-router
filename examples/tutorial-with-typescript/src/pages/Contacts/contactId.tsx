import { ActionFunctionArgs, Form, LoaderFunctionArgs, useFetcher, useLoaderData } from "react-router-dom";

import { Contact, isValidNewContact } from '../../entities/Contact'
import { getContact, updateContact } from "../../api/contacts";

export async function loader({ params }: LoaderFunctionArgs) {
	const contact = await getContact(String(params.contactId));

	if (!contact) {
		throw new Response("Not Found", { status: 404 });
	}

	return contact;
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
	if (!params?.contactId) {
		throw new Error("Missing contact id from URL");
	}

	const formData = await request.formData();

	return updateContact(params.contactId, { favorite: formData.get('favorite') === 'true' });
}

const Favorite: React.FC<{ contact: Contact }> = ({ contact }) => {
	const fetcher = useFetcher();

	// yes, this is a `let` for later
	let favorite = contact.favorite;
	if (fetcher.formData) {
    favorite = fetcher.formData.get("favorite") === "true";
  }

	return (
		<fetcher.Form method="post">
			<button
				name="favorite"
				value={favorite ? "false" : "true"}
				aria-label={
					favorite
						? "Remove from favorites"
						: "Add to favorites"
				}
			>
				{favorite ? "★" : "☆"}
			</button>
		</fetcher.Form>
	);
}

export const ContactDetails = () => {
	const contact = useLoaderData() as Awaited<ReturnType<typeof loader>>;

	return (
		<div id="contact">
			<div>
				<img
					key={contact.avatar}
					src={contact.avatar}
				/>
			</div>
			<div>
				<h1>
					{contact.first || contact.last ? (
						<>
							{contact.first} {contact.last}
						</>
					) : (
						<i>No Name</i>
					)}
					<Favorite contact={contact} />
				</h1>
				{contact.twitter && (
					<p>
						<a
							target="_blank"
							href={`https://twitter.com/${contact.twitter}`}
						>
							{contact.twitter}
						</a>
					</p>
				)}
				{contact.notes && <p>{contact.notes}</p>}
				<div>
					<Form action="edit">
						<button type="submit">Edit</button>
					</Form>
					<Form
						method="delete"
						action="delete"
						onSubmit={(event) => {
							if (
								!confirm(
									"Please confirm you want to delete this record."
								)
							) {
								event.preventDefault();
							}
						}}
					>
						<button type="submit">Delete</button>
					</Form>
				</div>
			</div>
		</div>
	);
}
