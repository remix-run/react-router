---
title: Meta Tags and SEO
hidden: true
---

[copy pasted from route module doc]

By default, meta descriptors will render a [`<meta>` tag][meta-element] in most cases. The two exceptions are:

- `{ title }` renders a `<title>` tag
- `{ "script:ld+json" }` renders a `<script type="application/ld+json">` tag, and its value should be a serializable object that is stringified and injected into the tag.

```tsx
export function meta() {
  return [
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "React Router",
        url: "https://reactrouter.com",
      },
    },
  ];
}
```

A meta descriptor can also render a [`<link>` tag][link-element] by setting the `tagName` property to `"link"`. This is useful for `<link>` tags associated with SEO like `canonical` URLs. For asset links like stylesheets and favicons, you should use the [`links` export][links] instead.

```tsx
export function meta() {
  return [
    {
      tagName: "link",
      rel: "canonical",
      href: "https://reactrouter.com",
    },
  ];
}
```
