---
title: useSubmit
new: true
---

# `useSubmit`

The imperative version of `<Form>` that lets you, the programmer, submit a form instead of the user.

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

For example, submitting the form every time a value changes inside the form:

```tsx [8]
import { useSubmit, Form } from "react-router-dom";

function SearchField() {
  let submit = useSubmit();
  return (
    <Form
      onChange={(event) => {
        submit(event.currentTarget);
      }}
    >
      <input type="text" name="search" />
      <button type="submit">Search</button>
    </Form>
  );
}
```

This can also be useful if you'd like to automatically sign someone out of your website after a period of inactivity. In this case, we've defined inactivity as the user hasn't navigated to any other pages after 5 minutes.

```tsx lines=[1,10,15]
import { useSubmit, useLocation } from "react-router-dom";
import { useEffect } from "react";

function AdminPage() {
  useSessionTimeout();
  return <div>{/* ... */}</div>;
}

function useSessionTimeout() {
  const submit = useSubmit();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      submit(null, { method: "post", action: "/logout" });
    }, 5 * 60_000);

    return () => clearTimeout(timer);
  }, [submit, location]);
}
```

## Submit target

The first argument to submit accepts many different values.

You can submit any form or form input element:

```tsx
// input element events
<input onChange={(event) => submit(event.currentTarget)} />;

// React refs
let ref = useRef();
<button ref={ref} />;
submit(ref.current);
```

You can submit `FormData`:

```tsx
let formData = new FormData();
formData.append("cheese", "gouda");
submit(formData);
```

### Payload Serialization

You may also submit raw JSON to your `action` and the default behavior will be to encode the key/values into `FormData`:

```tsx
let obj = { key: "value" };
submit(obj); // -> request.formData()
```

You may also choose which type of serialization you'd like via the `encType` option:

```tsx
let obj = { key: "value" };
submit(obj, {
  encType: "application/x-www-form-urlencoded",
}); // -> request.formData()
```

```tsx
let obj = { key: "value" };
submit(obj, { encType: "application/json" }); // -> request.json()
```

```tsx
let text = "Plain ol' text";
submit(obj, { encType: "text/plain" }); // -> request.text()
```

<docs-warn>In future versions of React Router, the default behavior will not serialize raw JSON payloads. If you are submitting raw JSON today it's recommended to specify an explicit `encType`.</docs-warn>

### Opting out of serialization

Sometimes in a client-side application, it's overkill to require serialization into `request.formData` when you have a raw JSON object in your component and want to submit it to your `action` directly. If you'd like to opt out of serialization, you can pass `encType: null` to your second options argument, and your data will be sent to your action function verbatim as a `payload` parameter:

```tsx
let obj = { key: "value" };
submit(obj, { encType: null });

function action({ request, payload }) {
  // payload is `obj` from your component
  // request.body === null
}
```

## Submit options

The second argument is a set of options that map (mostly) directly to form submission attributes:

```tsx
submit(null, {
  action: "/logout",
  method: "post",
});

// same as
<Form action="/logout" method="post" />;
```

### Direct `action` specification

If you want to perform a submission, but you don't want/need to create a route for your `action`, you can pass an `action` to `useSubmit` which will perform a submission navigation to the current location but will use the provided `action`:

```tsx
submit(data, {
  action({ request }) {
    // Custom action implementation here
  },
});
```

[pickingarouter]: ../routers/picking-a-router
