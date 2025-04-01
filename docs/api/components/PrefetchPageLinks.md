---
title: PrefetchPageLinks
---

# PrefetchPageLinks

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.PrefetchPageLinks.html)

Renders `<link rel=prefetch|modulepreload>` tags for modules and data of another page to enable an instant navigation to that page. `<Link prefetch>` uses this internally, but you can render it to prefetch a page for any other reason.

```tsx
import { PrefetchPageLinks } from "react-router";

<PrefetchPageLinks page="/absolute/path" />;
```

For example, you may render one of this as the user types into a search field to prefetch search results before they click through to their selection.

## Props

### crossOrigin

[modes: framework]

How the element handles crossorigin requests

### disabled

[modes: framework]

Whether the link is disabled

### hrefLang

[modes: framework]

Language of the linked resource

### integrity

[modes: framework]

Integrity metadata used in Subresource Integrity checks

### media

[modes: framework]

Applicable media: "screen", "print", "(max-width: 764px)"

### page

[modes: framework]

The absolute path of the page to prefetch.

### referrerPolicy

[modes: framework]

Referrer policy for fetches initiated by the element
