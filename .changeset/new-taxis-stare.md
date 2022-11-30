---
"react-router": minor
"@remix-run/router": minor
---

Allows optional routes and optional static segments

**Optional params examples**

`:lang?/about` will get expanded matched with

```
/:lang/about
/about
```

`/multistep/:widget1?/widget2?/widget3?`
Will get expanded matched with:

```
/multistep
/multistep/:widget1
/multistep/:widget1/:widget2
/multistep/:widget1/:widget2/:widget3
```

**optional static segment example**

`/fr?/about` will get expanded and matched with:

```
/about
/fr/about
```
