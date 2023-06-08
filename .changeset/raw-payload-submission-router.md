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

function action({ request }) {
  // request.formData => FormData instance with entry [key=value]
  // request.text => "key=value"
}
```

```js
// Pass `formEncType` to opt-into a different encoding
router.navigate("/", {
  formMethod: "post",
  formEncType: "application/json",
  body: { key: "value" },
});

function action({ request }) {
  // request.json => { key: "value" }
  // request.text => '{ "key":"value" }'
}
```

```js
router.navigate("/", {
  formMethod: "post",
  formEncType: "text/plain",
  body: "Text submission",
});

function action({ request }) {
  // request.text => "Text submission"
}
```
