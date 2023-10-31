---
title: action
new: true
---

# `action`

Route actions are the "writes" to route [loader][loader] "reads". They provide a way for apps to perform data mutations with simple HTML and HTTP semantics while React Router abstracts away the complexity of asynchronous UI and revalidation. This gives you the simple mental model of HTML + HTTP (where the browser handles the asynchrony and revalidation) with the behavior and UX capabilities of modern SPAs.

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

```tsx
<Route
  path="/song/:songId/edit"
  element={<EditSong />}
  action={async ({ params, request }) => {
    let formData = await request.formData();
    return fakeUpdateSong(params.songId, formData);
  }}
  loader={({ params }) => {
    return fakeGetSong(params.songId);
  }}
/>
```

Actions are called whenever the app sends a non-get submission ("post", "put", "patch", "delete") to your route. This can happen in a few ways:

```tsx
// forms
<Form method="post" action="/songs" />;
<fetcher.Form method="put" action="/songs/123/edit" />;

// imperative submissions
let submit = useSubmit();
submit(data, {
  method: "delete",
  action: "/songs/123",
});
fetcher.submit(data, {
  method: "patch",
  action: "/songs/123/edit",
});
```

## `params`

Route params are parsed from [dynamic segments][dynamicsegments] and passed to your action. This is useful for figuring out which resource to mutate:

```tsx
<Route
  path="/projects/:projectId/delete"
  action={({ params }) => {
    return fakeDeleteProject(params.projectId);
  }}
/>
```

## `request`

This is a [Fetch Request][request] instance being sent to your route. The most common use case is to parse the [FormData][formdata] from the request

```tsx
<Route
  action={async ({ request }) => {
    let formData = await request.formData();
    // ...
  }}
/>
```

> A Request?!

It might seem odd at first that actions receive a "request". Have you ever written this line of code?

```tsx [3]
<form
  onSubmit={(event) => {
    event.preventDefault();
    // ...
  }}
/>
```

What exactly are you preventing?

Without JavaScript, just plain HTML and an HTTP web server, that default event that was prevented is actually pretty great. Browsers will serialize all the data in the form into [`FormData`][formdata] and send it as the body of a new request to your server. Like the code above, React Router [`<Form>`][form] prevents the browser from sending that request and instead sends the request to your route action! This enables highly dynamic web apps with the simple model of HTML and HTTP.

Remember that the values in the `formData` are automatically serialized from the form submission, so your inputs need a `name`.

```tsx
<Form method="post">
  <input name="songTitle" />
  <textarea name="lyrics" />
  <button type="submit">Save</button>
</Form>;

// accessed by the same names
formData.get("songTitle");
formData.get("lyrics");
```

For more information on `formData` see [Working with FormData][workingwithformdata].

### Opt-in serialization types

Note that when using [`useSubmit`][usesubmit] you may also pass `encType: "application/json"` or `encType: "text/plain"` to instead serialize your payload into `request.json()` or `request.text()`.

## Returning Responses

While you can return anything you want from an action and get access to it from [`useActionData`][useactiondata], you can also return a web [Response][response].

For more information, see the [loader documentation][returningresponses].

## Throwing in Actions

You can `throw` in your action to break out of the current call stack (stop running the current code) and React Router will start over down the "error path".

```tsx [10]
<Route
  action={async ({ params, request }) => {
    const res = await fetch(
      `/api/properties/${params.id}`,
      {
        method: "put",
        body: await request.formData(),
      }
    );
    if (!res.ok) throw res;
    return { ok: true };
  }}
/>
```

For more details and expanded use cases, read the [errorElement][errorelement] documentation.

## Handling multiple actions per route

A fairly common question that pops up is _"What if I need to handle multiple different behaviors in my action?"_ There's a few ways to accomplish this, but usually the simplest is to put a `name`/`value` on your `<button type="submit">` and use that in the action to decide which code to execute (that's right - submitting [buttons][button] can have name/value attributes!):

```jsx lines=[3,5,10,30-32,42-44]
async function action({ request }) {
  let formData = await request.formData();
  let intent = formData.get("intent");

  if (intent === "edit") {
    await editSong(formData);
    return { ok: true };
  }

  if (intent === "add") {
    await addSong(formData);
    return { ok: true };
  }

  throw json(
    { message: "Invalid intent" },
    { status: 400 }
  );
}

function Component() {
  let song = useLoaderData();

  // When the song exists, show an edit form
  if (song) {
    return (
      <Form method="post">
        <p>Edit song lyrics:</p>
        {/* Edit song inputs */}
        <button type="submit" name="intent" value="edit">
          Edit
        </button>
      </Form>
    );
  }

  // Otherwise show a form to add a new song
  return (
    <Form method="post">
      <p>Add new lyrics:</p>
      {/* Add song inputs */}
      <button type="submit" name="intent" value="add">
        Add
      </button>
    </Form>
  );
}
```

If a button name/value isn't right for your use case, you could also use a hidden input to send and `intent` or you could submit different HTTP methods via the [`<Form method>`][form-method] prop (`POST` for add, `PUT`/`PATCH` for edit, `DELETE` for remove).

[loader]: ./loader
[pickingarouter]: ../routers/picking-a-router
[dynamicsegments]: ./route#dynamic-segments
[formdata]: https://developer.mozilla.org/en-US/docs/Web/API/FormData
[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[url]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[urlsearchparams]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
[migratingtoremix]: ../guides/migrating-to-remix
[useloaderdata]: ../hooks/use-loader-data
[json]: ../fetch/json
[errorelement]: ./error-element
[form]: ../components/form
[workingwithformdata]: ../guides/form-data
[useactiondata]: ../hooks/use-action-data
[usesubmit]: ../hooks/use-submit
[returningresponses]: ./loader#returning-responses
[createbrowserrouter]: ../routers/create-browser-router
[button]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
[form-method]: ../components/form#method
