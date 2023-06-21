---
"@remix-run/router": minor
---

Add support for `application/json` and `text/plain` encodings for `router.navigate`/`router.fetch` submissions. To leverage these encodings, pass your data in a `body` parameter and specify the desired `formEncType`:

```js
// By default, the encoding is "application/x-www-form-urlencoded"
router.navigate("/", {
  formMethod: "post",
  body: { key: "value" },
});

async function action({ request }) {
  // await request.formData() => FormData instance with entry [key=value]
}
```

```js
// Pass `formEncType` to opt-into a different encoding
router.navigate("/", {
  formMethod: "post",
  formEncType: "application/json",
  body: { key: "value" },
});

async function action({ request }) {
  // await request.json() => { key: "value" }
}
```

```js
router.navigate("/", {
  formMethod: "post",
  formEncType: "text/plain",
  body: "Text submission",
});

async function action({ request }) {
  // await request.text() => "Text submission"
}
```
