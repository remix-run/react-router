---
title: Scripts
---

# Scripts

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/ssr/components.tsx
-->

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Scripts.html)

Renders the client runtime of your app. It should be rendered inside the
[`<body>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body)
 of the document.

If server rendering, you can omit `<Scripts/>` and the app will work as a
traditional web app without JavaScript, relying solely on HTML and browser
behaviors.

```tsx
import { Scripts } from "react-router";

export default function Root() {
  return (
    <html>
      <head />
      <body>
        <Scripts />
      </body>
    </html>
  );
}
```

## Signature

```tsx
function Scripts(scriptProps: ScriptsProps): React.JSX.Element | null
```

## Props

### scriptProps

Additional props to spread onto the [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) tags, such as [`crossOrigin`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/crossOrigin),
[`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce),
etc.

