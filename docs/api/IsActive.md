# IsActive Mixin

Provides `isActive` to a component.

### Methods

#### `isActive(pathname, query)`

Returns `true` or `false` depending on if the current path is active.
Will be true for every route in the route branch matched by the
`pathname` (child route is active, therefore parent is too).

### Example

Let's say you are using bootstrap and want to get `active` on those `li`
tags for the Tabs:

```js
import { Link, IsActive } from 'react-router'

let Tab = React.createClass({

  mixins: [ IsActive ],

  render() {
    let isActive = this.isActive(this.props.to, this.props.query)
    let className = isActive ? 'active' : ''
    return <li className={className}><Link {...this.props}/></li>
  }

})

// use it just like <Link/>, and you'll get an anchor wrapped in an `li`
// with an automatic `active` class on both.
<Tab href="foo">Foo</Tab>
```
