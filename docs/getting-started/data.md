---
title: Data Quick Start
new: true
order: 3
---

# Data APIs Quick Start

Follow along with the [completed demo on stackblitz][demo].

This guide is intended for people with some experience with React Router v6 already. If you are brand new to React Router, you will probably want to review the normal [Quick Start][quickstart] first.

React Router v6.4 introduces all of the data abstractions from [Remix][remix] for React Router SPAs. Now you can keep your UI _and your data_ in sync with the URL automatically.

## Installation

The new Data APIs are available on the `next` tag:

```sh
npm install react-router-dom@next
```

## Configuring Routes

Configuring routes is the same, except you need to use [`DataBrowserRouter`][databrowserrouter] to enable the data APIs. note you no longer render `<Routes>` either, just `<Route>`.

<docs-info>It's important to render `DataBrowserRouter` at the top of the React tree.</docs-info>

```jsx filename=main.jsx [4,8-10]
import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { DataBrowserRouter, Route } from "react-router-dom";
import Root from "./routes/root";

createRoot(document.getElementById("root")).render(
  <DataBrowserRouter>
    <Route path="/" element={<Root />} />
  </DataBrowserRouter>
);
```

Let's check out our root route:

```jsx filename=routes/root.jsx
import { Outlet } from "react-router-dom";

export default function Root() {
  return (
    <div>
      <h1>Notes!</h1>
      <Outlet />
    </div>
  );
}
```

## Data Loading

Now that we have a router in place, we can add [loaders][loader] to our routes to provide data to components.

First we'll export a loader from the root route and then access the data with [`useLoaderData`][useloaderdata].

```jsx filename=routes/root.jsx lines=[1,3-11,14]
import { useLoaderData, Link } from "react-router-dom";

export async function loader() {
  return [
    {
      id: "abc",
      title: "Fake Note",
      content: "We'll replace this with real data soon",
    },
  ];
}

export default function Root() {
  const notes = useLoaderData();

  return (
    <div>
      {notes.map((note) => (
        <div key={note.id}>
          <Link to={`/note/${note.id}`}>{note.title}</Link>
        </div>
      ))}
      <Outlet />
    </div>
  );
}
```

Next we add the [loader][loader] to the route config:

```jsx filename=main.jsx lines=[2,9]
// ...
import Root, { loader as rootLoader } from "./routes/root";

createRoot(document.getElementById("root")).render(
  <DataBrowserRouter>
    <Route
      path="/"
      element={<Root />}
      loader={rootLoader}
    />
  </DataBrowserRouter>
);
```

Feel free to add some styles, we're just getting the data on the page here 😋.

If you're coding along with this, you'll want to copy paste our data model into `notes.js`.

<details>
<summary>View data model code</summary>

```sh
npm install localforage
```

```jsx filename=notes.js
import localforage from "localforage";

export async function getNotes() {
  let notes = await localforage.getItem("notes");
  if (!notes) notes = [];
  return notes;
}

export async function createNote({ title, content }) {
  let id = Math.random().toString(36).substring(2, 9);
  let note = { id, title, content };
  let notes = await getNotes();
  notes.unshift(note);
  await set(notes);
  return note;
}

export async function getNote(id) {
  let notes = await localforage.getItem("notes");
  let note = notes.find((note) => note.id === id);
  return note ?? null;
}

export async function deleteNote(id) {
  let notes = await localforage.getItem("notes");
  let index = notes.findIndex((note) => note.id === id);
  if (index > -1) {
    notes.splice(index, 1);
    await set(notes);
    return true;
  }
  return false;
}

function set(notes) {
  return localforage.setItem("notes", notes);
}
```

</details>

With our real data in place, we can change our root [loader][loader] to use it:

```jsx lines=[2,5] filename=routes/root.jsx
import { useLoaderData, Link } from "react-router-dom";
import { getNotes } from "../notes";

export async function loader() {
  return getNotes();
}

export default function Root() {
  // ...
}
```

But now we have an empty page. It's time for a form.

## Data Mutations

In order to create new notes, we'll create a form and add it to a route at "/new".

```jsx filename=routes/new.jsx
import { Form } from "react-router-dom";

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
        <textarea
          id="content"
          name="content"
          rows="10"
          cols="30"
        />
      </p>
      <p>
        <button type="submit">Save</button>
      </p>
    </Form>
  );
}
```

Next add the page to our route config. We'll make it a child of the root so that the root layout renders around it.

```jsx filename=main.jsx lines=[3,8]
// ...
import Root, { loader as rootLoader } from "./routes/root";
import NewNote from "./routes/new-note";

createRoot(document.getElementById("root")).render(
  <DataBrowserRouter>
    <Route path="/" element={<Root />} loader={rootLoader}>
      <Route path="new" element={<NewNote />} />
    </Route>
  </DataBrowserRouter>
);
```

And finally link to it from the root:

```jsx filename=routes/root.jsx lines=[7]
// ...
export default function Root() {
  const notes = useLoaderData();

  return (
    <div>
      <Link to="/new">New Note</Link>
      {notes.map((note) => (
        <div key={note.id}>
          <Link to={`/note/${note.id}`}>{note.title}</Link>
        </div>
      ))}
      <Outlet />
    </div>
  );
}
```

### Actions

With the route configured, we can create an [`action`][action]. Actions are like [loaders][loader] except instead "reading" data they "write" data. Think of it like `React.useState`. It returns a reader and a writer. In React Router, loaders are your readers, actions are your writers.

```jsx
const [reader, writer] = React.useState();
<Route loader={reader} action={writer} />;
```

In fact, after an action is called, React Router revalidates all of your loaders to keep your app in sync with your data. Exactly the same as React updating the DOM when you call `setState`.

Enough talk, here's the code:

```jsx filename=routes/new-note.jsx lines=[1,2,4-11]
import { Form, redirect } from "react-router-dom";
import { createNote } from "../notes";

export async function action({ request }) {
  const formData = await request.formData();
  const note = await createNote({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  return redirect(`/note/${note.id}`);
}

export default function NewNote() {
  // ...
}
```

Now add it to the route config:

```jsx filename=main.jsx lines=[3,13]
// ...
import Root, { loader as rootLoader } from "./routes/root";
import NewNote, {
  action as newNoteAction,
} from "./routes/new-note";

createRoot(document.getElementById("root")).render(
  <DataBrowserRouter>
    <Route path="/" element={<Root />} loader={rootLoader}>
      <Route
        path="new"
        element={<NewNote />}
        action={newNoteAction}
      />
    </Route>
  </DataBrowserRouter>
);
```

Now you you can submit the form and Remix will automatically serialize the form, call the `action` with a [request][request] containing the serialized [FormData][formdata], and then revalidate all of the loaders on the page to capture the change.

Let's add one last route to this demo that loads, displays, and can delete an individual note. First we'll configure the routes:

```jsx filename=main.jsx lines=[5-8,18-24]
import Root, { loader as rootLoader } from "./routes/root";
import NewNote, {
  action as newNoteAction,
} from "./routes/new-note";
import Note, {
  loader as noteLoader,
  action as noteAction,
} from "./routes/note";

createRoot(document.getElementById("root")).render(
  <DataBrowserRouter>
    <Route path="/" element={<Root />} loader={rootLoader}>
      <Route
        path="new"
        element={<NewNote />}
        action={newNoteAction}
      />
      <Route
        path="note/:noteId"
        element={<Note />}
        loader={noteLoader}
        action={noteAction}
        errorElement={<div>Note not found</div>}
      />
    </Route>
  </DataBrowserRouter>
);
```

Here's the note route module:

```jsx filename=routes/note.jsx lines=[]
import {
  useLoaderData,
  Form,
  redirect,
} from "react-router-dom";
import { deleteNote, getNote } from "../notes";

export async function loader({ params }) {
  const note = await getNote(params.noteId);
  if (!note) throw new Response("", { status: 404 });
  return note;
}

export async function action({ params }) {
  await deleteNote(params.noteId);
  return redirect("/new");
}

export default function Note() {
  const note = useLoaderData();
  return (
    <div>
      <h2>{note.title}</h2>
      <div>{note.content}</div>
      <Form method="post">
        <button type="submit">Delete</button>
      </Form>
    </div>
  );
}
```

Notice the use of `params` in the loader. Even more interesting, check out how it throws a 404 response if the note isn't found. React Router automatically catches anything thrown from a loader or action and renders the [`errorElement`][errorelement] instead. This keeps your component happy paths, happy.

## What's next

We've only scratched the surface here. We have a lot of work to do ourselves to show the myriad use cases that React Router can now handle with guides and tutorials. The individual documentation is fairly complete, you just have to connect some dots yourself for a bit until we get our guides caught up.

Until then, we recommend reading the following documentation:

- [`loader`][loader]
- [`action`][action]
- [`errorElement`][errorelement]
- [`<Form>`][form]
- [`useNavigation`][usenavigation]
- [`useFetcher`][usefetcher]

Good luck!

[usefetcher]: ../hooks/use-fetcher
[usenavigation]: ../hooks/use-navigation
[route]: ../route/route
[errorelement]: ../route/error-element
[form]: ../components/form
[databrowserrouter]: ../routers/data-browser-router
[quickstart]: ./overview
[remix]: https://remix.run
[useloaderdata]: ../hooks/use-loader-data
[action]: ../route/action
[loader]: ../route/loader
[formdata]: https://developer.mozilla.org/en-US/docs/Web/API/FormData
[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[demo]: https://stackblitz.com/github/remix-run/react-router/tree/dev/examples/notes?file=src%2Fmain.jsx
