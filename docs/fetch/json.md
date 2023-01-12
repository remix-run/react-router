---
title: json
new: true
---

# `json`

A shortcut for:

```jsx
new Response(JSON.stringify(someValue), {
  headers: {
    "Content-Type": "application/json; utf-8",
  },
});
```

Typically used in loaders:

```jsx
import { json } from "react-router-dom";

const loader = async () => {
  const data = getSomeData();
  return json(data);
};
```

See also:

- [Returning Responses from Loaders][responses]

[responses]: ../route/loader#returning-responses
