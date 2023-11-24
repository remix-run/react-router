---
title: useNavigation
new: true
---

# `useNavigation`

This hook tells you everything you need to know about a page navigation to build pending navigation indicators and optimistic UI on data mutations. Things like:

- Global loading indicators
- Disabling forms while a mutation is happening
- Adding busy indicators to submit buttons
- Optimistically showing a new record while it's being created on the server
- Optimistically showing the new state of a record while it's being updated

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

```js
import { useNavigation } from "react-router-dom";

function SomeComponent() {
  const navigation = useNavigation();
  navigation.state;
  navigation.location;
  navigation.formData;
  navigation.json;
  navigation.text;
  navigation.formAction;
  navigation.formMethod;
  navigation.formEncType;
}
```

<docs-warning>The `useNavigation().formMethod` field is lowercase without the `future.v7_normalizeFormMethod` [Future Flag][api-development-strategy]. This is being normalized to uppercase to align with the `fetch()` behavior in v7, so please upgrade your React Router v6 applications to adopt the uppercase HTTP methods.</docs-warning>

## `navigation.state`

- **idle** - There is no navigation pending.
- **submitting** - A route action is being called due to a form submission using POST, PUT, PATCH, or DELETE
- **loading** - The loaders for the next routes are being called to render the next page

Normal navigations and GET form submissions transition through these states:

```
idle → loading → idle
```

Form submissions with POST, PUT, PATCH, or DELETE transition through these states:

```
idle → submitting → loading → idle
```

Here's a simple submit button that changes its text when the navigation state is changing:

```tsx
function SubmitButton() {
  const navigation = useNavigation();

  const text =
    navigation.state === "submitting"
      ? "Saving..."
      : navigation.state === "loading"
      ? "Saved!"
      : "Go";

  return <button type="submit">{text}</button>;
}
```

While `navigation.state` provides the high-level state of the active navigation, you can deduce more granular information by combining it with other `navigation` aspects:

```js
// Is this just a normal load?
let isNormalLoad =
  navigation.state === "loading" &&
  navigation.formData == null;

// Are we reloading after an action?
let isReloading =
  navigation.state === "loading" &&
  navigation.formData != null &&
  navigation.formAction === navigation.location.pathname;

// Are we redirecting after an action?
let isRedirecting =
  navigation.state === "loading" &&
  navigation.formData != null &&
  navigation.formAction !== navigation.location.pathname;
```

## `navigation.formData`

Any POST, PUT, PATCH, or DELETE navigation that started from a `<Form>` or `useSubmit` will have your form's submission data attached to it. This is primarily useful to build "Optimistic UI" with the `submission.formData` [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.

In the case of a GET form submission, `formData` will be empty and the data will be reflected in `navigation.location.search`.

## `navigation.json`

Any POST, PUT, PATCH, or DELETE navigation that started from a `useSubmit(payload, { encType: "application/json" })` will have your JSON value available in `navigation.json`.

## `navigation.text`

Any POST, PUT, PATCH, or DELETE navigation that started from a `useSubmit(payload, { encType: "text/plain" })` will have your text value available in `navigation.text`.

## `navigation.location`

This tells you what the next [location][location] is going to be.

Note that this link will not appear "pending" if a form is being submitted to the URL the link points to, because we only do this for "loading" states. The form will contain the pending UI for when the state is "submitting", once the action is complete, then the link will go pending.

## `navigation.formAction`

Any POST, PUT, PATCH, or DELETE navigation that started from a `<Form>` or `useSubmit` will have form's submission action route's path value available in `navigation.formAction`.

In the case of a GET form submission, `navigation.formAction` will be empty

If you submitted the form at `example.com/id`, then `navigation.formAction` would be "/id"

## `navigation.formMethod`

Any POST, PUT, PATCH, or DELETE navigation that started from a `<Form>` or `useSubmit` will have form's submission method value available in `navigation.formMethod`.

In the case of a GET form submission, `navigation.formMethod` will be empty

Here is an example. Please note that `navigation.formMethod` is in lowercase

```tsx
function SubmitButton() {
  const navigation = useNavigation();
  if (navigation.formMethod) {
    console.log(navigation.formMethod); // post
  }

  return (
    <Form method="POST">
      <button>Submit</button>
    </Form>
  );
}
```

## `navigation.formEncType`

Any POST, PUT, PATCH, or DELETE navigation that started from a `<Form>` or `useSubmit` will have form's submission method value available in `navigation.formEncType`.

This property can be one of the four values: "text/plain," "application/json," "multipart/form-data," or "application/x-www-form-urlencoded."

In the case of a GET form submission, `navigation.formEncType` will be empty

[location]: ../utils/location
[pickingarouter]: ../routers/picking-a-router
[api-development-strategy]: ../guides/api-development-strategy
