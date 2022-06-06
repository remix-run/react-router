import { Form, redirect } from "react-router-dom";
import { createNote } from "../notes";

////////////////////////////////////////////////////////////////////////////////
export default function NewNote() {
  return (
    <Form method="post">
      <p>
        <label>
          Title
          <br />
          <input type="text" name="title" />
        </label>
      </p>
      <p>
        <label htmlFor="content">Content</label>
        <br />
        <textarea name="content" rows="10" cols="30" id="content" />
      </p>
      <p>
        <button type="submit">Save</button>
      </p>
    </Form>
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const note = await createNote({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  return redirect(`/note/${note.id}`);
}
