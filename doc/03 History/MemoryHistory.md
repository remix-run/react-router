`MemoryHistory` is a [history][Histories] implementation that does not
read and write state to the address bar of the browser. Its useful for
testing and running React Router in persistent environments that don't
have URLs.

Example
-------

```js
import { Router } from 'react-router';
import MemoryHistory from 'react-router/lib/MemoryHistory';

React.render((
  <Router history={MemoryHistory}>
    {/* ... */}
  </Router>
), document.body);
```



  [Histories]:#TODO

