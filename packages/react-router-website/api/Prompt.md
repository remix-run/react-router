# &lt;Prompt>

Used to prompt the user before navigating away from a page. When your application enters a state that should prevent the user from navigating away (like a form is half-filled out), render a `<Prompt>`.

```js
import { Prompt } from 'react-router'

<Prompt
  when={formIsHalfFilledOut}
  message="Are you sure you want to leave?"
/>
```

## message: string _`<Prompt>`_

The message to prompt the user with when they try to navigate away.

```js
<Prompt message="Are you sure you want to leave?"/>
```

## message: func _`<Prompt>`_

Will be called with the next `location` and `action` the user is attempting to navigate to. Return a string to show a prompt to the user or `true` to allow the transition.

```js
<Prompt message={location => (
  `Are you sure you want to go to ${location.pathname}?`
)}/>
```

## when: bool _`<Prompt>`_

Instead of conditionally rendering a `<Prompt>` behind a guard, you can always render it but pass `when={true}` or `when={false}` to prevent or allow navigation accordingly.

```js
<Prompt when={formIsHalfFilledOut} message="Are you sure?"/>
```
