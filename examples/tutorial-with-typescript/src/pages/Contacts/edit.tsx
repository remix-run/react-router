import { ActionFunctionArgs, Form, LoaderFunctionArgs, redirect, useLoaderData, useNavigate } from "react-router-dom";

import { getContact, updateContact } from "../../api/contacts";
import { isValidNewContact } from "../../entities/Contact";

export const loader = async ({ params }: LoaderFunctionArgs) => {
	if (!params?.contactId) {
		throw new Error("Missing contact id from URL");
	}

	const contact = await getContact(String(params.contactId));

	if (!contact) {
		throw new Response("Not Found", { status: 404 });
	}

	return contact;
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const updates = Object.fromEntries(formData);

	if (!params?.contactId) {
		throw new Error("Missing contact id from URL");
	}

	if (!isValidNewContact(updates)) {
		throw new Error('Contact is invalid');
	}

	await updateContact(params.contactId, updates);

	return redirect(`/contacts/${params.contactId}`);
}

export const ContactEdit = () => {
	const contact = useLoaderData() as Awaited<ReturnType<typeof loader>>;
	const navigate = useNavigate();

	return (
		<Form method="post" id="contact-form">
			<p>
				<span>Name</span>
				<input
					placeholder="First"
					aria-label="First name"
					type="text"
					name="first"
					defaultValue={contact.first}
				/>
				<input
					placeholder="Last"
					aria-label="Last name"
					type="text"
					name="last"
					defaultValue={contact.last}
				/>
			</p>
			<label>
				<span>Twitter</span>
				<input
					type="text"
					name="twitter"
					placeholder="@jack"
					defaultValue={contact.twitter}
				/>
			</label>
			<label>
				<span>Avatar URL</span>
				<input
					placeholder="https://example.com/avatar.jpg"
					aria-label="Avatar URL"
					type="text"
					name="avatar"
					defaultValue={contact.avatar}
				/>
			</label>
			<label>
				<span>Notes</span>
				<textarea
					name="notes"
					defaultValue={contact.notes}
					rows={6}
				/>
			</label>
			<p>
				<button type="submit">Save</button>
				<button type="button" onClick={() => navigate(-1)}>Cancel</button>
			</p>
		</Form>
	);
};
