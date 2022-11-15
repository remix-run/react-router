import { ActionFunctionArgs, Form, redirect, useNavigate } from "react-router-dom";

import { createContact } from "../../api/contacts";
import { isValidNewContact } from "../../entities/Contact";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const create = Object.fromEntries(formData);

	if (!isValidNewContact(create)) {
		throw new Error('Contact is invalid');
	}

	const contact = await createContact(create);

	return redirect(`/contacts/${contact.id}`);
}

export const ContactCreate = () => {
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
				/>
				<input
					placeholder="Last"
					aria-label="Last name"
					type="text"
					name="last"
				/>
			</p>
			<label>
				<span>Twitter</span>
				<input
					type="text"
					name="twitter"
					placeholder="@jack"
				/>
			</label>
			<label>
				<span>Avatar URL</span>
				<input
					placeholder="https://example.com/avatar.jpg"
					aria-label="Avatar URL"
					type="text"
					name="avatar"
				/>
			</label>
			<label>
				<span>Notes</span>
				<textarea
					name="notes"
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
