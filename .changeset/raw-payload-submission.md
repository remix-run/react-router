---
"react-router-dom": minor
---

- Support submission of raw payloads through `useSubmit`/`fetcher.submit` by opting out of serialization into `request.formData` using `encType: null`. When opting-out of serialization, your data will be passed to the action in a new `payload` parameter:

```jsx
function Component() {
  let submit = useSubmit();
  submit({ key: "value" }, { encType: null });
}

function action({ request, payload }) {
  // payload      => { key: 'value' }
  // request.body => null
}
```

Since the default behavior in `useSubmit` today is to serialize to `application/x-www-form-urlencoded`, that will remain the behavior for `encType:undefined` in v6. But in v7, we plan to change the default behavior for `undefined` to skip serialization. In order to better prepare for this change, we encourage developers to add explicit content types to scenarios in which they are submitting raw JSON objects:

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
}

function action({ request, payload }) {
  // payload              => { key: 'value' }
  // await request.json() => {"key":"value"}
}
```

```js
function Component() {
  let submit = useSubmit();
  submit({ key: "value" }, { encType: "application/x-www-form-urlencoded" });
}

function action({ request, payload }) {
  // payload                  => { key: 'value' }
  // await request.formData() => FormData instance with a single entry of key=value
}
```

```js
function Component() {
  let submit = useSubmit();
  submit("Plain ol' text", { encType: "text/plain" });
}

function action({ request, payload }) {
  // payload              => "Plain ol' text"
  // await request.text() => "Plain ol' text"
}
```
