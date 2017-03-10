# &lt;Prompt>

A component which gives you the ability to prompt the user before they navigate away from the current screen.

## when : bool

When true, the user will be prompted when they attempt to navigate away from the current screen.

```js
<Prompt
  when={isBlocking}
  message={location => (
    `Are you sure you want to go to ${location.pathname}`
  )}
/>
```

## message : string

A message the user will be shown when they attempt to navigate away from the current screen.

```js
<Prompt
  when={isBlocking}
  message='Everything not saved will be lost'
/>
```

## message : func

A function which will be passed the location of the next screen the user is going to and whose return value will be the message shown to the user.

```js
<Prompt
  when={isBlocking}
  message={location => (
    `Are you sure you want to go to ${location.pathname}`
  )}
/>
```