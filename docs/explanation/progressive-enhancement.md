---
title: Progressive Enhancement
---

# Progressive Enhancement

> Progressive enhancement is a strategy in web design that puts emphasis on web content first, allowing everyone to access the basic content and functionality of a web page, whilst users with additional browser features or faster Internet access receive the enhanced version instead.

<cite>- [Wikipedia][wikipedia]</cite>

When using React Router with Server-Side Rendering (the default in framework mode), you can automatically leverage the benefits of progressive enhancement.

## Why Progressive Enhancement Matters

Coined in 2003 by Steven Champeon & Nick Finck, the phrase emerged during a time of varied CSS and JavaScript support across different browsers, with many users actually browsing the web with JavaScript disabled.

Today, we are fortunate to develop for a much more consistent web and where the majority of users have JavaScript enabled.

However, we still believe in the core principles of progressive enhancement in React Router. It leads to fast and resilient apps with simple development workflows.

**Performance**: While it's easy to think that only 5% of your users have slow connections, the reality is that 100% of your users have slow connections 5% of the time.

**Resilience**: Everybody has JavaScript disabled until it's loaded.

**Simplicity**: Building your apps in a progressively enhanced way with React Router is actually simpler than building a traditional SPA.

## Performance

Server rendering allows your app to do more things in parallel than a typical [Single Page App (SPA)][spa], making the initial loading experience and subsequent navigations faster.

Typical SPAs send a blank document and only start doing work when JavaScript has loaded:

```
HTML        |---|
JavaScript      |---------|
Data                      |---------------|
                            page rendered 👆
```

A React Router app can start doing work the moment the request hits the server and stream the response so that the browser can start downloading JavaScript, other assets, and data in parallel:

```
               👇 first byte
HTML        |---|-----------|
JavaScript      |---------|
Data        |---------------|
              page rendered 👆
```

## Resilience and Accessibility

While your users probably don't browse the web with JavaScript disabled, everybody uses the websites without JavaScript before it finishes loading. React Router embraces progressive enhancement by building on top of HTML, allowing you to build your app in a way that works without JavaScript, and then layer on JavaScript to enhance the experience.

The simplest case is a `<Link to="/account">`. These render an `<a href="/account">` tag that works without JavaScript. When JavaScript loads, React Router will intercept clicks and handle the navigation with client side routing. This gives you more control over the UX instead of just spinning favicons in the browser tab--but it works either way.

Now consider a simple add to cart button:

```tsx
export function AddToCart({ id }) {
  return (
    <Form method="post" action="/add-to-cart">
      <input type="hidden" name="id" value={id} />
      <button type="submit">Add To Cart</button>
    </Form>
  );
}
```

Whether JavaScript has loaded or not doesn't matter, this button will add the product to the cart.

When JavaScript loads, React Router will intercept the form submission and handle it client side. This allows you to add your own pending UI, or other client side behavior.

## Simplicity

When you start to rely on basic features of the web like HTML and URLs, you will find that you reach for client side state and state management much less.

Consider the button from before, with no fundamental change to the code, we can pepper in some client side behavior:

```tsx lines=[1,4,7,10-12,14]
import { useFetcher } from "react-router";

export function AddToCart({ id }) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action="/add-to-cart">
      <input name="id" value={id} />
      <button type="submit">
        {fetcher.state === "submitting"
          ? "Adding..."
          : "Add To Cart"}
      </button>
    </fetcher.Form>
  );
}
```

This feature continues to work the very same as it did before when JavaScript is loading, but once JavaScript loads:

- `useFetcher` no longer causes a navigation like `<Form>` does, so the user can stay on the same page and keep shopping
- The app code determines the pending UI instead of spinning favicons in the browser

It's not about building it two different ways–once for JavaScript and once without–it's about building it in iterations. Start with the simplest version of the feature and ship it; then iterate to an enhanced user experience.

Not only will the user get a progressively enhanced experience, but the app developer gets to "progressively enhance" the UI without changing the fundamental design of the feature.

Another example where progressive enhancement leads to simplicity is with the URL. When you start with a URL, you don't need to worry about client side state management. You can just use the URL as the source of truth for the UI.

```tsx
export function SearchBox() {
  return (
    <Form method="get" action="/search">
      <input type="search" name="query" />
      <SearchIcon />
    </Form>
  );
}
```

This component doesn't need any state management. It just renders a form that submits to `/search`. When JavaScript loads, React Router will intercept the form submission and handle it client side. Here's the next iteration:

```tsx lines=[1,4-6,11]
import { useNavigation } from "react-router";

export function SearchBox() {
  const navigation = useNavigation();
  const isSearching =
    navigation.location.pathname === "/search";

  return (
    <Form method="get" action="/search">
      <input type="search" name="query" />
      {isSearching ? <Spinner /> : <SearchIcon />}
    </Form>
  );
}
```

No fundamental change in architecture, simply a progressive enhancement for both the user and the code.

See also: [State Management][state_management]

[wikipedia]: https://en.wikipedia.org/wiki/Progressive_enhancement
[spa]: ../how-to/spa
[state_management]: ./state-management
