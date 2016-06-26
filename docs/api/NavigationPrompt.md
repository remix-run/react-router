# `<NavigationPrompt>`

When your application enters a state that should prevent the user from
navigating away (like a form is half-filled out), render a
`NavigationPrompt`.

```js
{formIsHalfFilledOut && (
  <NavigationPrompt message="Are you sure you want to leave?"/>
)}
```

## `message: string`

The message to prompt the user with when they try to navigate away.


```js
<NavigationPrompt message="Are you sure you want to leave?"/>
```


## `message: func`

Will be called with the `nextLocation` the user is attempting to
navigate to. Return a string to prompt the user with or `true` to allow
the transition.

```js
<NavigationPrompt message={(location) => (
  `Are you sure you want to go to ${location.pathname}?`
)}/>
```

## `when: bool`

Instead of guarding a `NavigationPrompt` behind a flag, you can always
render it but pass true or false to `when`. If `true`, navigation will
be blocked, if `false`, navigation will be allowed.

```js
<NavigationPrompt when={formIsHalfFilledOut} message="Are you sure?"/>
```

# `</NavigationPrompt>`
