# &lt;Prompt>

Used to prompt the user before navigating away from a page. When your application enters a state that should prevent the user from navigating away (like a form is half-filled out), render a `<Prompt>`.

```jsx
import { Prompt } from "react-router"
;<Prompt when={formIsHalfFilledOut} message="Are you sure you want to leave?" />
```

## message: string

The message to prompt the user with when they try to navigate away.

```jsx
<Prompt message="Are you sure you want to leave?" />
```

## message: func

Will be called with the next `location` and `action` the user is attempting to navigate to. Return a string to show a prompt to the user or `true` to allow the transition.

```jsx
<Prompt
  message={location =>
    location.pathname.startsWith("/app")
      ? true
      : `Are you sure you want to go to ${location.pathname}?`
  }
/>
```

## when: bool

Instead of conditionally rendering a `<Prompt>` behind a guard, you can always render it but pass `when={true}` or `when={false}` to prevent or allow navigation accordingly.

```jsx
<Prompt when={formIsHalfFilledOut} message="Are you sure?" />
```
