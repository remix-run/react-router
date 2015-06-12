`Router` sets up a `History` and updates `Router` state when the
`History` emits changes.  You can implement your own history, or create
an instance of one with your own options for query parsing.

```js
// typical usage
import BrowserHistory from 'react-router/lib/BrowserHistory';
<Router history={BrowserHistory}/>
```

If you need to do your own query parsing:

```js
// note the `{ ... }` in the import statement...
import { BrowserHistory } from 'react-router/lib/BrowserHistory';
// ...this gives you a class instead of a singleton instance

var history = new BrowserHistory({
  parseQueryString(string) {
    return customParse(string);
  },
  stringifyQuery(obj) {
    return customStringify(obj);
  }
});

var router = <Router history={history}/>;
```

