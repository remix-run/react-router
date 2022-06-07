---
title: Working With FormData
new: true
---

# Working With FormData

<docs-info>TODO: This document is a stub</docs-info>

A common trick is to turn the entire formData into an object with [`Object.fromEntries`][object-fromentries]:

```tsx
const data = Object.fromEntries(await request.formData());
data.songTitle;
data.lyrics;
```

[object-fromentries]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
