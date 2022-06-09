---
title: Elements
hidden: true
---

# Markdown Test Page

This is for testing all the different kinds of markdown that can exist. Whenever I find a styling edge case that exists, I add it to this document. It’s my form of visual regression for all the different kinds of elements that need to be styled across different contexts.

## Code, Links, and Lists

A relative `<Link to>` value (that does not begin with `/`) resolves relative to the parent route, which means that it builds upon the URL path that was matched by the route that rendered that `<Link>`. It may contain `..` to link to routes further up the hierarchy. In these cases, `..` works exactly like the command-line `cd` function; each `..` removes one segment of the parent path.

This is a list of links, some of which are code:

- This is my first list item
- [This is my second list item that’s a link][$link]
- This is my third item that has `<code>` and [`<LinkedCode>` mixed with text][$link]

## Headings

For headings, do we ever go deeper than a heading 4? Do we really need styles for that?

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

## Callouts

Callouts can be used with the `<docs-*>` elements. They are specifically for calling special attention to pieces of information outside the normal flow of the document.

@TODO There are four variations on these in code, but we probably really only need the first three:

1. `<docs-info>`
2. `<docs-warning>`
3. `<docs-error>`
4. `<docs-success>`

<docs-info>`<Link to>` with a `..` behaves differently from a normal `<a href>` when the current URL ends with `/`. `<Link to>` ignores the trailing slash, and removes one URL segment for each `..`. But an `<a href>` value handles `..` differently when the current URL ends with `/` vs when it does not.</docs-info>

<docs-warning>`useMatches` only works with Data Routers, since they know the full route tree up front and can provide all of the current matches. Additionally, `useMatches` will not match down into any descendant route trees since the router isn't aware of the descendant routes.</docs-warning>

<docs-error>Do not do this</docs-error>

## Normal Prose

@TODO Blockquotes, lists, etc.

This is a `<blockquote>` with multiple lines in it:

> This is my quote.
>
> It can have [links]($link), **bold text**, _italic text_, and even `<code>`, all of which should be accounted for. Oh, and don't forget lists:
>
> - List item 1
> - List item 2
> - List item 3
>
> Unordered, or ordered:
>
> 1. List item
> 2. Another list item
> 3. Yet another list item

## Code

Normal code:

```tsx
<DataBrowserRouter initialEntries={["/events/123"]}>
  <Route path="/" element={<Root />} loader={rootLoader}>
    <Route
      path="events/:id"
      element={<Event />}
      loader={eventLoader}
    />
  </Route>
</DataBrowserRouter>
```

With multiple highlighted lines:

```tsx lines=[1-2,5]
<DataBrowserRouter initialEntries={["/events/123"]}>
  <Route path="/" element={<Root />} loader={rootLoader}>
    <Route
      path="events/:id"
      element={<Event />}
      loader={eventLoader}
    />
  </Route>
</DataBrowserRouter>
```

With a filename:

```tsx filename=src/main.jsx
<DataBrowserRouter initialEntries={["/events/123"]}>
  <Route path="/" element={<Root />} loader={rootLoader}>
    <Route
      path="events/:id"
      element={<Event />}
      loader={eventLoader}
    />
  </Route>
</DataBrowserRouter>
```

Bad code with highlighted lines:

```tsx bad lines=[2-5]
<DataBrowserRouter initialEntries={["/events/123"]}>
  <Routes>
    <Route path="/" element={<Root />} loader={rootLoader}>
      <Route
        path="events/:id"
        element={<Event />}
        loader={eventLoader}
      />
    </Route>
  </Routes>
</DataBrowserRouter>
```

Lines that overflow:

```html
<!-- Other HTML for your app goes here -->
<!-- prettier-ignore -->
<script src="https://unpkg.com/react@>=16.8/umd/react.development.js" crossorigin></script>
```

---

[all-links]: https://www.youtube.com/watch?v=dQw4w9WgXcQ
