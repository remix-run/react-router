Mixes in the `isActive` method of `Router`.

Methods
-------

### isActive

See [router.isActive][router.isActive]

Example
-------

Let's say you are using bootstrap and want to get `active` on those `li`
tags for the Tabs:

```js
import { Link, State } from 'react-router';

var Tab = React.createClass({

  mixins: [ State ],

  render() {
    var isActive = this.isActive(this.props.href, this.props.query);
    var className = isActive ? 'active' : '';
    return <li className={className}><Link {...this.props}/></li>;
  }

});

// use it just like <Link/>, and you'll get an anchor wrapped in an `li`
// with an automatic `active` class on both.
<Tab href="foo">Foo</Tab>
```

  [router.isActive]:#TODO

