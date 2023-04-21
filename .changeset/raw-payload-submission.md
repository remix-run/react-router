---
"react-router-dom": minor
---

- Support better submission and control of serialization of raw payloads through `useSubmit`/`fetcher.submit`. The default `encType` will still be `application/x-www-form-urlencoded` as it is today, but actions will now also receive a raw `payload` parameter when you submit a raw value (not an HTML element, `FormData`, or `URLSearchParams`).

The default behavior will still serialize into `FormData`:

```jsx
function Component() {
  let submit = useSubmit();
  submit({ key: "value" });
  // navigation.formEncType => "application/x-www-form-urlencoded"
  // navigation.formData    => FormData instance
  // navigation.payload     => { key: "Value" }
}

function action({ request, payload }) {
  // request.headers.get("Content-Type") => "application/x-www-form-urlencoded"
  // request.formData                    => FormData instance
  // payload                             => { key: 'value' }
}
```

You may opt out of this default serialization using `encType: null`:

```jsx
function Component() {
  let submit = useSubmit();
  submit({ key: "value" }, { encType: null });
  // navigation.formEncType => null
  // navigation.formData    => undefined
  // navigation.payload     => { key: "Value" }
}

function action({ request, payload }) {
  // request.headers.get("Content-Type") => null
  // request.formData                    => undefined
  // payload                             => { key: 'value' }
}
```

_Note: we plan to change the default behavior of `{ encType: undefined }` to match this "no serialization" behavior in React Router v7. In order to better prepare for this change, we encourage developers to add explicit content types to scenarios in which they are submitting raw JSON objects:_

```jsx
function Component() {
  let submit = useSubmit();

  // Change this:
  submit({ key: "value" });

  // To this:
  submit({ key: "value" }, { encType: "application/x-www-form-urlencoded" });
}
```

- You may now also opt-into different types of serialization of this `payload` into your `request` using the `formEncType` parameter:

```js
function Component() {
  let submit = useSubmit();
  submit({ key: "value" }, { encType: "application/json" });
  // navigation.formEncType => "application/json"
  // navigation.formData    => undefined
  // navigation.payload     => { key: "Value" }
}

function action({ request, payload }) {
  // request.headers.get("Content-Type") => "application/json"
  // request.json                        => { key: 'value' }
  // payload                             => { key: 'value' }
}
```

```js
function Component() {
  let submit = useSubmit();
  submit({ key: "value" }, { encType: "application/x-www-form-urlencoded" });
  // navigation.formEncType => "application/x-www-form-urlencoded"
  // navigation.formData    => FormData instance
  // navigation.payload     => { key: "Value" }
}

function action({ request, payload }) {
  // request.headers.get("Content-Type") => "application/x-www-form-urlencoded"
  // request.formData                    => { key: 'value' }
  // payload                             => { key: 'value' }
}
```

```js
function Component() {
  let submit = useSubmit();
  submit("Plain ol' text", { encType: "text/plain" });
  // navigation.formEncType => "text/plain"
  // navigation.formData    => undefined
  // navigation.payload     => "Plain ol' text"
}

function action({ request, payload }) {
  // request.headers.get("Content-Type") => "text/plain"
  // request.text                        => "Plain ol' text"
  // payload                             => "Plain ol' text"
}
```
