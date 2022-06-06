import { useLoaderData, Form, redirect } from "react-router-dom";
import { deleteNote, getNote } from "../notes";

export default function Note() {
  const note = useLoaderData();
  return (
    <div>
      <h2>{note.title}</h2>
      <div>{note.content}</div>
      <Form method="post" style={{ marginTop: "2rem" }}>
        <button type="submit">Delete</button>
      </Form>
    </div>
  );
}

export async function loader({ params }) {
  const note = await getNote(params.noteId);
  if (!note) throw new Response("", { status: 404 });
  return note;
}

export async function action({ params }) {
  await deleteNote(params.noteId);
  return redirect("/new");
}
