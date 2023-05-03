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

The default behavior if you submit a JSON object is to encode the data into `FormData`:

```tsx
submit({ key: "value" });
// will serialize into request.formData() in your action
```

Or you can opt-into JSON encoding:

```tsx
submit({ key: "value" }, { encType: "application/json" });
// will serialize into request.json() in your action
```

Or plain text:

```tsx
submit("value", { encType: "text/plain" });
// will serialize into request.text() in your action
```

If you do not want to serialize your data at all, it's recommended to use a direct object reference via an inline action (see below).

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

### Inline action

If you want to perform a submission, but you don't want/need to create a route for your `action`, you can pass an `action` to `useSubmit` which will perform a submission navigation to the current location but will use the provided `action`:

```tsx
submit(data, {
  action({ request }) {
    // Custom action implementation here
  },
});
```

[pickingarouter]: ../routers/picking-a-router
