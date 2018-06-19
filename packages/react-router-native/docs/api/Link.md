# &lt;Link>

Provide declarative, accessible navigation around your application.

```jsx
import { Link } from 'react-router-native'

<Link to='/about'><Text>About</Text></Link>
```

## to: string

A string representation of the location to link to, created by concatenating the location's pathname, search, and hash properties.

```jsx
<Link to='/courses?sort=name'/>
```

## to: object

An object that can have any of the following properties:
  * `pathname`: A string representing the path to link to.
  * `search`: A string representation of query parameters, e.g. `?key=value`.
  * `hash`: A hash to put in the URL, e.g. `#a-hash`.
  * `state`: State to persist to the `location`.

```jsx
<Link to={{
  pathname: '/courses',
  search: '?sort=name',
  hash: '#the-hash',
  state: { fromDashboard: true }
}}/>
```

## replace: bool

When `true`, clicking the link will replace the current entry in the history stack instead of adding a new one.

```jsx
<Link to="/courses" replace />
```

## component: func

A component for making `Link` respond properly to touches. Typically will be one React Native's "touchable" components (`TouchableHighlight`, `TouchableOpacity`, etc). All props passed to `Link` will be passed along to this component. Defaults to `TouchableHighlight`.

```jsx
<Link
  to='/about'
  component={TouchableOpacity}
  activeOpacity={0.8} />
```
