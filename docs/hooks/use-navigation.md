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

```js
import { useNavigation } from "react-router-dom";

function SomeComponent() {
  const navigation = useNavigation();
  navigation.state;
  navigation.location;
  navigation.formData;
  navigation.formAction;
  navigation.formMethod;
}
```

## `navigation.state`

- **idle** - There is no navigation pending.
- **submitting** - A form has been submitted. If GET, then route loaders are being called. If POST, PUT, PATCH, DELETE, then a route action is being called.
- **loading** - The loaders for the next routes are being called to render the next page.

Normal navigation transitions through these states:

```
idle → loading → idle
```

GET form submissions:

```
idle → submitting → idle
```

Form submissions with POST, PUT, PATCH, or DELETE navigation:

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

## `navigation.formData`

Any navigation that started from a `<Form>` or `useSubmit` will have your form's submission data attached to it. This is primarily useful to build "Optimistic UI" with the `submission.formData` [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.

## `navigation.location`

This tells you what the next [location][location] is going to be.

Note that this link will not appear "pending" if a form is being submitted to the URL the link points to, because we only do this for "loading" states. The form will contain the pending UI for when the state is "submitting", once the action is complete, then the link will go pending.

[location]: ../utils/location
