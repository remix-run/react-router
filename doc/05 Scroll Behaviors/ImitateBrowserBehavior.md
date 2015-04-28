Imitates the browser's built-in scroll behavior after route transitions.

In a non-client rendered app, the browser attempts to restore the scroll
position of the page, but when a client router takes over, this useful
feature of the web is often ruined.

`ImitateBrowserBehavior` imitates the browser's behavior by restoring
the position when the user clicks the back/forward buttons.

This is the default behavior of React Router. To opt-out at any level of
your hierarchy simply add `ignoreScrollBehavior` to the `Route`.

```js
// opt-out of the default behavior
<Route ignoreScrollBehavior={true}/>
```

