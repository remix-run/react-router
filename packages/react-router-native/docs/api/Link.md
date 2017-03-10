# &lt;Link>

Provide declarative, accessible navigation around your application.

```js
import { Link } from 'react-router-native'

<Link to='/about'>About</Link>
```

## to: string

The pathname or location to link to.

```js
<Link to='/courses'/>
```

## to: object

The location to link to.

```js
<Link to={{
  pathname: '/courses',
  search: '?sort=name',
  hash: '#the-hash',
  state: { fromDashboard: true }
}}/>
```

## replace: bool

When `true`, clicking the link will replace the current entry in the history stack instead of adding a new one.

```js
<Link to="/courses" replace />
```

## component: func

A component for making `Link` respond properly to touches. Typically will be one React Native's "touchable" components (`TouchableHighlight`, `TouchableOpacity`, etc). All props passed to `Link` will be passed along to this component. Defaults to `TouchableHighlight`.

```js
<Link
  to='/about'
  component={TouchableOpacity}
  activeOpacity={0.8} />
```