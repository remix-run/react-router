---
"@remix-run/router": minor
---

Add support for a new `payload` parameter for `router.navigate` and `router.fetch` submissions. This allows you to submit data to an action without requiring serialization into a `FormData` instance. This `payload` value wil be passed unaltered to your action function.

```js
router.navigate("/", { payload: { key: "value" } });

function action({ request, payload }) {
  // payload is `{ key: 'value' }`
  // request.body is `null`
}
```

You may also opt-into serialization of this `payload` into your `request` using the `formEncType` parameter:

```js
router.navigate("/", {
  payload: { key: "value" },
  formEncType: "application/json",
});

function action({ request, payload }) {
  // payload is `{ key: 'value' }`
  // await request.text() is '{"key":"value"}'
}
```

```js
router.navigate("/", {
  payload: { key: "value" },
  formEncType: "application/x-www-form-urlencoded",
});

function action({ request, payload }) {
  // payload is `{ key: 'value' }`
  // await request.formData() is a `FormData` instance with a single entry of key=value
}
```

```js
router.navigate("/", {
  payload: "Plain ol' text",
  formEncType: "text/plain",
});

function action({ request, payload }) {
  // payload is "Plain ol' text"
  // await request.text() is "Plain ol' text"
}
```
