---
"react-router-dom": minor
---

Add support for `application/json` and `text/plain` encodings for `useSubmit`/`fetcher.submit`. To reflect these additional types, `useNavigation`/`useFetcher` now also contain `navigation.json`/`navigation.text` and `fetcher.json`/`fetcher.text` which include the json/text submission if applicable.

```jsx
// The default behavior will still serialize as FormData
function Component() {
  let navigation = useNavigation();
  let submit = useSubmit();
  submit({ key: "value" });
  // navigation.formEncType => "application/x-www-form-urlencoded"
  // navigation.formData    => FormData instance
}

async function action({ request }) {
  // request.headers.get("Content-Type") => "application/x-www-form-urlencoded"
  // await request.formData()            => FormData instance
}
```

```js
// Opt-into JSON encoding with `encType: "application/json"`
function Component() {
  let navigation = useNavigation();
  let submit = useSubmit();
  submit({ key: "value" }, { encType: "application/json" });
  // navigation.formEncType => "application/json"
  // navigation.json        => { key: "value" }
}

async function action({ request }) {
  // request.headers.get("Content-Type") => "application/json"
  // await request.json()                => { key: "value" }
}
```

```js
// Opt-into text encoding with `encType: "text/plain"`
function Component() {
  let navigation = useNavigation();
  let submit = useSubmit();
  submit("Text submission", { encType: "text/plain" });
  // navigation.formEncType => "text/plain"
  // navigation.text        => "Text submission"
}

async function action({ request }) {
  // request.headers.get("Content-Type") => "text/plain"
  // await request.text()                => "Text submission"
}
```
