# History Mixin

Adds the router's `history` object to your component instance.

**Note**: You do not need this mixin for route components, its already
avaible as `this.props.history`. This is for components deeper in the
render tree that need access to the router's history object.

### Methods

#### `pushState(state, pathname, query)`

Transitions to a new URL.

##### arguments

- `state` - the location state.
- `pathname` - the full url with or without the query.
- `query` - an object that will be stringified by the router.

#### `replaceState(state, pathname, query)`

Replaces the current URL with a new one, without affecting the length of
the history (like a redirect).

##### arguments

- `state` - the location state.
- `pathname` - the full url with or without the query.
- `query` - an object that will be stringified by the router.

#### `go(n)`

Go forward or backward in the history by `n` or `-n`.

#### `goBack()`

Go back one entry in the history.

#### `goForward()`

Go forward one entry in the history.

#### `createPath(pathname, query)`

Stringifies the query into the pathname, using the router's config.

#### `createHref(pathname, query)`

Creates a URL, using the router's config. For example, it will add `#/` in
front of the `pathname` for hash history.

### Example

```js
import { History } from 'react-router'

React.createClass({

  mixins: [ History ],

  render() {
    return (
      <div>
        <div onClick={() => this.history.pushState(null, '/foo')}>Go to foo</div>
        <div onClick={() => this.history.replaceState(null, 'bar')}>Go to bar without creating a new history entry</div>
        <div onClick={() => this.history.goBack()}>Go back</div>
     </div>
   )
 }
})
```

### But I’m using Classes

> Notice how we never told you to use ES6 classes? :)

https://twitter.com/soprano/status/610867662797807617

If you aren't happy using `createClass` for a handful of components in
your app for the sake of the `History` mixin, have a couple of options:

- Pass `this.props.history` from your route components down to the
  components that need it.

- Use context

    ```js
    import PropTypes from 'react-router'
    class MyComponent extends React.Component {
      doStuff () {
        this.context.history.pushState(null, '/some/path')
      }
    }
    MyComponent.contextTypes = { history: PropTypes.history }
    ```

- [Make your history a module](/docs/advanced/NavigatingOutsideOfComponents.md)

- Create a higher order component, we might end up shipping with this
  and deprecating history, just haven't had the time to think it through
  all the way.

    ```js
    function connectHistory (Component) {
      return React.createClass({
        mixins: [ History ],
        render () {
          return <Component {...this.props} history={this.history}/>
        }
      })
    }

    // other file
    import connectHistory from './connectHistory'

    class MyComponent extends React.Component {
      doStuff () {
        this.props.history.pushState(null, '/some/where')
      }
    }

    export default connectHistory(MyComponent)
    ```

