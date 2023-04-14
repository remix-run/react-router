---
"@remix-run/router": minor
---

Add support for a new `payload` parameter for `router.navigate`/`router.fetch` submissions. This allows you to submit data to an `action` without requiring serialization into a `FormData` instance. This `payload` value will be passed unaltered to your `action` function.

```js
router.navigate("/", { payload: { key: "value" } });

function action({ request, payload }) {
  // payload      => { key: 'value' }
  // request.body => null
}
```

You may also opt-into serialization of this `payload` into your `request` using the `formEncType` parameter:

```js
router.navigate("/", {
  payload: { key: "value" },
  formEncType: "application/json",
});

function action({ request, payload }) {
  // payload              => { key: 'value' }
  // await request.json() => {"key":"value"}
}
```

```js
router.navigate("/", {
  payload: { key: "value" },
  formEncType: "application/x-www-form-urlencoded",
});

function action({ request, payload }) {
  // payload                  => { key: 'value' }
  // await request.formData() => FormData instance with a single entry of key=value
}
```

```js
router.navigate("/", {
  payload: "Plain ol' text",
  formEncType: "text/plain",
});

function action({ request, payload }) {
  // payload              => "Plain ol' text"
  // await request.text() => "Plain ol' text"
}
```
