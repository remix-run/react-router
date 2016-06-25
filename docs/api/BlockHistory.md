# `<BlockHistory>`

When your application enters a state that should prevent the user from
navigating away (like a form is half-filled out), render a
`BlockHistory`.

```js
{formIsHalfFilledOut && (
  <BlockHistory prompt="Are you sure you want to leave?"/>
)}
```

## `prompt: string`

The string to prompt the user with when they try to navigate away.


```js
<BlockHistory prompt="Are you sure you want to leave?"/>
```


## `prompt: func`

Will be called with the `nextLocation` the user is attempting to
navigate to. Return a string to prompt the user with, `true` to allow
the transition.

```js
<BlockHistory prompt={(location) => (
  `Are you sure you want to go to ${location.pathname}?`
)}/>
```

## `when: bool`

Instead of guarding a `BlockHistory` behind a flag, you can always
render it but pass true or false to `when`. If `true`, navigation will
be blocked, if `false`, navigation will be allowed.

```js
<BlockHistory when={formIsHalfFilledOut} prompt="Are you sure?"/>
```

# `</BlockHistory>`
