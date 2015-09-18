# Navigating Outside of Components

While route components get `this.props.history` and the `History` mixin
provides `this.history`, many apps want to be able to navigate outside
of their components.

Its pretty simple, just hang on to your history object:

You can have a module in your app somewhere that exports your history
object.

```js
// history.js
import createBrowserHistory from 'history/lib/createBrowserHistory'
export default createBrowserHistory()
```

And then import it to render a `<Router>`:

```js
// index.js
import history from './history'
React.render(<Router history={history}/>, el)
```

And now you can use that history object anywhere in your app, maybe in a
flux actions file

```js
// actions.js
import history from './history'
history.replaceState(null, '/some/path')
```
