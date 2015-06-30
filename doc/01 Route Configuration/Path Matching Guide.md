Available configurations:

```js
<Router ...>
  <Route path='/home' component={ Comp }> {/* mounts to /home */}
    <Route path='inside-home' /> {/* mounts to /home/inside-home */}
    <Route path='/also-in-root' component={ Comp } /> {/* mounts to /also-in-root */}
    <Route path=':param' /> {/* mounts to /home/<param>. you can access your params in the props */}
    <Route path='something-before-:param' /> {/* it works too */}
    <Route path=':required(/:optional)' /> {/* required and optional path matching */}
  </Route>
</Router>
```
