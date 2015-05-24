Primary component of React Router.

[more docs here coming]

Props
-----

### `children`

A bunch of `Route`s.

Examples
--------

```js
import { Router, Route } from 'react-router';

React.render((
  <Router>
    <Route path="about" component={About}/>
    <Route path="dashboard" component={Dashboard}/>
  </Router>
), document.body);
```
