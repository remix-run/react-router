---
"react-router-dom": minor
---

Add support for `application/json` and `text/plain` encodings for `useSubmit`/`fetcher.submit`. To reflect these additional types, `useNavigation`/`useFetcher` now also contain `navigation.json`/`navigation.text` and `fetcher.json`/`fetcher.text` which are getter functions mimicking `request.json` and `request.text`. Just as a `Request` does, if you access one of these methods for the incorrect encoding type, it will throw an Error (i.e. accessing `navigation.formData` when `navigation.formEncType` is `application/json`).

```jsx
// The default behavior will still serialize as FormData
function Component() {
  let navigation = useNavigation();
  let submit = useSubmit();
  submit({ key: "value" });
  // navigation.formEncType => "application/x-www-form-urlencoded"
  // navigation.formData    => FormData instance
  // navigation.text        => "key=value"
}

function action({ request }) {
  // request.headers.get("Content-Type") => "application/x-www-form-urlencoded"
  // request.formData                    => FormData instance
  // request.text                        => "key=value"
}
```

```js
// Opt-into JSON encoding with `encType: "application/json"`
function Component() {
  let submit = useSubmit();
  submit({ key: "value" }, { encType: "application/json" });
  // navigation.formEncType => "application/json"
  // navigation.json        => { key: "value" }
  // navigation.text        => '{"key":"value"}'
}

function action({ request }) {
  // request.headers.get("Content-Type") => "application/json"
  // request.json                        => { key: "value" }
  // request.text                        => '{"key":"value"}'
}
```

```js
// Opt-into JSON encoding with `encType: "application/json"`
function Component() {
  let submit = useSubmit();
  submit("Text submission", { encType: "text/plain" });
  // navigation.formEncType => "text/plain"
  // navigation.text        => "Text submission"
}

function action({ request }) {
  // request.headers.get("Content-Type") => "text/plain"
  // request.text                        => "Text submission"
}
```
