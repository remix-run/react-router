---
title: PrefetchPageLinks
---

# PrefetchPageLinks

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

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.PrefetchPageLinks.html)

Renders [`<link rel=prefetch|modulepreload>`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/rel)
tags for modules and data of another page to enable an instant navigation to
that page. [`<Link prefetch>`](./Link#prefetch) uses this internally, but you
can render it to prefetch a page for any other reason.

For example, you may render one of this as the user types into a search field
to prefetch search results before they click through to their selection.

```tsx
import { PrefetchPageLinks } from "react-router";

<PrefetchPageLinks page="/absolute/path" />
```

## Signature

```tsx
function PrefetchPageLinks({ page, ...linkProps }: PageLinkDescriptor)
```

## Props

### page

The absolute path of the page to prefetch, e.g. `/absolute/path`.

### linkProps

Additional props to spread onto the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link) tags, such as [`crossOrigin`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/crossOrigin),
[`integrity`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/integrity),
[`rel`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/rel),
etc.

