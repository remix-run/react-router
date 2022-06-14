---
title: Markdown Elements
hidden: true
---

# Markdown Elements

This is for testing all the different kinds of markdown that can exist. Whenever I find a styling edge case that exists, I add it to this document. It’s my form of visual regression for all the different kinds of elements that need to be styled across different contexts.

## Headings

For headings, do we ever go deeper than a heading 4? Do we really need styles for that?

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

## Callouts

Callouts can be used with the `<docs-*>` elements. They are specifically for calling special attention to pieces of information outside the normal flow of the document.

There are three supported variations of these elements:

1. `<docs-info>` - For general callouts to bits of information.
2. `<docs-warning>` - For warning the read about something they should know.
3. `<docs-error>` - For telling the user they shouldn’t be doing something.

Examples:

<docs-info>`<Link to>` with a `..` behaves differently from a normal `<a href>` when the current URL ends with `/`. `<Link to>` ignores the trailing slash, and removes one URL segment for each `..`. But an `<a href>` value handles `..` differently when the current URL ends with `/` vs when it does not.</docs-info>

<docs-warning>`useMatches` only works with Data Routers, since they know the full route tree up front and can provide all of the current matches. Additionally, `useMatches` will not match down into any descendant route trees since the router isn't aware of the descendant routes.</docs-warning>

<docs-error>Do not do this</docs-error>

<docs-info>The markup for this is kind of ugly, because (currently) these all have to be inside the `<docs-*>` element without any line breaks _but_ it is possible there could be an image inside these. <img src="https://picsum.photos/480/270" width="480" height="270" /></docs-info>

Note: maybe the semantics for these aren't quite right. There might be other nouns that make sense in the case of docs, like:

- `<docs-info>` could become `<docs-tip>`
- `<docs-warning>` could become `<docs-important>`
- `<docs-error>` could become `<docs-warning>` or `<docs-danger>`

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

This is a list of links, some of which are code:

- This is my first list item
- [This is my second list item that’s a link][$link]
- This is my third item that has `<code>` and [`<LinkedCode>` mixed with text][$link]

And don't forget about proper styling for `<a>` tags that don’t have an `href`: <a>like this link right here</a>.

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

Bad code:

```tsx bad
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

Bad code with highlighted lines and a filename:

```tsx filename=src/main.jsx bad lines=[2-5]
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

[$link]: https://www.youtube.com/watch?v=dQw4w9WgXcQ
