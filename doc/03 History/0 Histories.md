`Router` sets up a `History` and updates `Router` state when the
`History` emits changes.  You can implement your own history, or create
an instance of one with your own options for query parsing.

```js
import History from 'react-router/lib/BrowserHistory';
<Router history={History}/>
```

If you need to do your own query parsing:

```js
import { BrowserHistory } from 'react-router/lib/BrowserHistory';

var history = new BrowserHistory({
  parseQueryString(string) {
    return customParse(string);
  }
});

var router = <Router history={history}/>;
```
