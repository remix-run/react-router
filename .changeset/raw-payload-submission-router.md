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

- `formEncType: "application/x-ww-form-urlencoded"` => serializes into `request.formData()`
- `formEncType: "application/json"` => serializes into `request.json()`
- `formEncType: "text/plain"` => serializes into `request.text()`
