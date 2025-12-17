---
title: Form
---

# Form

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Form.html)

A progressively enhanced HTML [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
that submits data to actions via [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch),
activating pending states in [`useNavigation`](../hooks/useNavigation) which enables advanced
user interfaces beyond a basic HTML [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).
After a form's `action` completes, all data on the page is automatically
revalidated to keep the UI in sync with the data.

Because it uses the HTML form API, server rendered pages are interactive at a
basic level before JavaScript loads. Instead of React Router managing the
submission, the browser manages the submission as well as the pending states
(like the spinning favicon). After JavaScript loads, React Router takes over
enabling web application user experiences.

`Form` is most useful for submissions that should also change the URL or
otherwise add an entry to the browser history stack. For forms that shouldn't
manipulate the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
stack, use [`<fetcher.Form>`](https://api.reactrouter.com/v7/types/react_router.FetcherWithComponents.html#Form).

```tsx
import { Form } from "react-router";

function NewEvent() {
  return (
    <Form action="/events" method="post">
      <input name="title" type="text" />
      <input name="description" type="text" />
    </Form>
  );
}
```

## Props

### action

The URL to submit the form data to. If `undefined`, this defaults to the
closest route in context.

### discover

Defines the form [lazy route discovery](../../explanation/lazy-route-discovery) behavior.

- **render** — default, discover the route when the form renders
- **none** — don't eagerly discover, only discover if the form is submitted

```tsx
<Form /> // default ("render")
<Form discover="render" />
<Form discover="none" />
```

### encType

The encoding type to use for the form submission.

```tsx
<Form encType="application/x-www-form-urlencoded"/>  // Default
<Form encType="multipart/form-data"/>
<Form encType="text/plain"/>
```

### fetcherKey

Indicates a specific fetcherKey to use when using `navigate={false}` so you
can pick up the fetcher's state in a different component in a [`useFetcher`](../hooks/useFetcher).

### method

The HTTP verb to use when the form is submitted. Supports `"delete"`,
`"get"`, `"patch"`, `"post"`, and `"put"`.

Native [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
only supports `"get"` and `"post"`, avoid the other verbs if you'd like to
support progressive enhancement

### navigate

When `false`, skips the navigation and submits via a fetcher internally.
This is essentially a shorthand for [`useFetcher`](../hooks/useFetcher) + `<fetcher.Form>` where
you don't care about the resulting data in this component.

### onSubmit

A function to call when the form is submitted. If you call
[`event.preventDefault()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
then this form will not do anything.

### preventScrollReset

Prevent the scroll position from resetting to the top of the viewport on
completion of the navigation when using the
``<ScrollRestoration>`` component

### relative

Determines whether the form action is relative to the route hierarchy or
the pathname. Use this if you want to opt out of navigating the route
hierarchy and want to instead route based on slash-delimited URL segments.
See [`RelativeRoutingType`](https://api.reactrouter.com/v7/types/react_router.RelativeRoutingType.html).

### reloadDocument

Forces a full document navigation instead of client side routing and data
fetch.

### replace

Replaces the current entry in the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
stack when the form navigates. Use this if you don't want the user to be
able to click "back" to the page with the form on it.

### state

State object to add to the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
stack entry for this navigation

### viewTransition

Enables a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
for this navigation. To apply specific styles during the transition, see
[`useViewTransitionState`](../hooks/useViewTransitionState).

### unstable_defaultShouldRevalidate

Specify the default revalidation behavior after this submission

If no `shouldRevalidate` functions are present on the active routes, then this
value will be used directly.  Otherwise it will be passed into `shouldRevalidate`
so the route can make the final determination on revalidation. This can be
useful when updating search params and you don't want to trigger a revalidation.

By default (when not specified), loaders will revalidate according to the routers
standard revalidation behavior.

