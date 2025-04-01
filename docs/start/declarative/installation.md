---
title: Installation
order: 1
---

# Installation

[MODES: declarative]

## Introduction

You can start with a React template from Vite and choose "React", otherwise bootstrap your application however you prefer.

```shellscript nonumber
npx create-vite@latest
```

Next install React Router from npm:

```shellscript nonumber
npm i react-router
```

Finally, render a `<BrowserRouter>` around your application:

```tsx lines=[3,9-11]
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./app";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

---

Next: [Routing](./routing)
