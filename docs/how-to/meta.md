---
title: Meta Tags and SEO
---

# Meta Tags and SEO

[MODES: framework]

<br/>
<br/>

React Router framework apps can describe document metadata from route modules. Use React's built-in [`<title>`][react-title], [`<meta>`][react-meta], and [`<link>`][react-link] elements when using React 19. Use the route module `meta` and `links` exports when you need React Router's route-based APIs or support for older React versions.

## Set up the root route

If you use the `meta` or `links` route exports, render [`<Meta />`][meta-component] and [`<Links />`][links-component] once in the document `<head>` of your root route:

```tsx filename=app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
} from "react-router";

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

If all of your metadata uses React 19's built-in elements, you do not need to add `Meta` or `Links` just for those elements. The root route is still the right place for document-wide tags such as `charset`, viewport settings, and a site favicon.

## Use React 19 elements for dynamic metadata

React 19 hoists metadata elements rendered by a route component into the document `<head>`. This makes the elements a good fit for metadata that depends on loader data, including canonical URLs:

```tsx filename=app/routes/products.$productId.tsx
import type { Route } from "./+types/products.$productId";

export async function loader({ params }: Route.LoaderArgs) {
  let product = await getProduct(params.productId);

  if (!product) {
    throw new Response("Not Found", { status: 404 });
  }

  return { product };
}

export default function Product({
  loaderData,
}: Route.ComponentProps) {
  let { product } = loaderData;
  let canonical = `https://example.com/products/${product.id}`;

  return (
    <>
      <title>{product.name} | Example</title>
      <meta name="description" content={product.description} />
      <meta property="og:title" content={product.name} />
      <link rel="canonical" href={canonical} />
      <h1>{product.name}</h1>
    </>
  );
}
```

Prefer an absolute, normalized canonical URL that matches the URL you want search engines to index. Keep the same URL policy for trailing slashes, casing, and query parameters across your application.

## Use the `meta` export

The `meta` export returns descriptors that React Router renders through `<Meta />`. It is useful for titles, descriptions, Open Graph tags, and structured data:

```tsx filename=app/routes/products.$productId.tsx
import type { Route } from "./+types/products.$productId";

export function meta({ loaderData }: Route.MetaArgs) {
  let { product } = loaderData;

  return [
    { title: `${product.name} | Example` },
    {
      name: "description",
      content: product.description,
    },
    {
      property: "og:title",
      content: product.name,
    },
    {
      tagName: "link",
      rel: "canonical",
      href: `https://example.com/products/${product.id}`,
    },
  ];
}
```

The `meta` function receives `loaderData`, `params`, and the other values described by [`Route.MetaArgs`][meta-args]. In React Router v8, use `loaderData` rather than the removed `data` property.

The descriptor array can also contain JSON-LD structured data:

```tsx
export function meta() {
  return [
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Example",
        url: "https://example.com",
      },
    },
  ];
}
```

For stylesheet links, favicons, and preload hints, use the `links` export instead of a `meta` descriptor with `tagName: "link"`.

## Use the `links` export

The `links` export describes link elements such as stylesheets, favicons, and preload resources:

```tsx filename=app/routes/dashboard.tsx
import dashboardHref from "./dashboard.css?url";

export function links() {
  return [
    { rel: "stylesheet", href: dashboardHref },
    { rel: "icon", href: "/favicon.png", type: "image/png" },
    {
      rel: "preload",
      href: "/images/dashboard-banner.jpg",
      as: "image",
    },
  ];
}
```

Links from all matching routes are aggregated and rendered by the root route's `<Links />` component. This makes `links` a good fit when both a parent layout and a child route contribute stylesheets or other resources.

For a link that depends on loader data, such as a product's canonical URL, use React 19's `<link>` element in the route component. The `links` export does not receive the route's `loaderData`.

## Parent and child routes

`links` entries from matching parent and child routes are combined. `meta` behaves differently: the descriptor array from the last matching route replaces the arrays from its parent routes rather than being merged.

If a child route defines `meta`, include the metadata that should remain on that page in the child's returned array. When metadata is shared across routes, you can read parent loader data from `matches` and compose the descriptors explicitly:

```tsx
export function meta({ matches, loaderData }: Route.MetaArgs) {
  let rootMatch = matches.find((match) => match.id === "root");

  return [
    { title: `${loaderData.product.name} | ${rootMatch?.loaderData.siteName}` },
    {
      name: "description",
      content: loaderData.product.description,
    },
  ];
}
```

Avoid returning multiple conflicting canonical URLs for one document. Put the canonical URL on the leaf route that owns the page, and keep site-wide metadata in a shared helper or in each route's composed descriptor list.

## Troubleshooting checklist

- If route `meta` or `links` exports do nothing, confirm that `<Meta />` and `<Links />` are rendered in the root document `<head>`.
- If a child route loses the parent's title or description, remember that `meta` arrays are replaced, not merged.
- If canonical data comes from a loader, render a React 19 `<link rel="canonical">` in the route component or build it in `meta` using `loaderData`.
- Use `links` for stylesheets and resource hints, not for data-dependent metadata.
- Make sure the route is server-rendered or pre-rendered when crawlers need to receive the metadata in the initial HTML.

[links-component]: ../api/components/Links
[meta-args]: https://api.reactrouter.com/v8/interfaces/react-router.MetaArgs
[meta-component]: ../api/components/Meta
[react-link]: https://react.dev/reference/react-dom/components/link
[react-meta]: https://react.dev/reference/react-dom/components/meta
[react-title]: https://react.dev/reference/react-dom/components/title
