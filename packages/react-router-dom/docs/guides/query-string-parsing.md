# Query String Parsing

In earlier versions of React Router we provided out-of-the-box support for query string parsing. Since there are too many different parsing-algorithms out there and people had problems with an opinionated version, it's been removed from React Router since v4.

But it's easy to integrate your favourite query string parsing lib!

First install [`history`](https://www.npmjs.com/package/qs) and the parsing library of your choice (e.g. [querystring](https://www.npmjs.com/package/querystring) or [qs](https://www.npmjs.com/package/qs))

```sh
yarn add history, querystring -S
```

Instead of using `BrowserRouter` which has `browserHistory` already included, you'll need to use the basic `Router` and create your custom `browserHistory` object.  
With [`browserHistory.listen()`](https://github.com/reacttraining/history#listening) you can listen for changes to the current location. We need to parse the *string* in `location.search` on every change of the current location.

```jsx
import {
  Link,
  Route,
  Router,
  Switch,
} from 'react-router-dom'
import createHistory from 'history/createBrowserHistory'
import { parse as parseQueryString } from 'querystring'

const browserHistory = createHistory()

// helper to add parsed query-property to history.location
function addLocationQuery(historyObject) {
  historyObject.location = Object.assign(
    historyObject.location,
    // slice(1) removes the `?` at the beginning of `location.search`
    { query: parseQueryString(historyObject.location.search.slice(1)) },
  )
}

// parse query-parameters at first page load
addLocationQuery(browserHistory)

// add parsing for all following history-changes
browserHistory.listen(() => addLocationQuery(browserHistory))

// query parameters can be accessed via location.query
const Hello = ({ location }) => (
  <div>
    <h2>Hello {location.query.name}!</h2>
  </div>
)

const Routes = () => (
  <Router history={browserHistory}>
    <ul>
      <li><Link to="/?name=World">Hello</Link></li>
    </ul>
    <Switch>
      <Route exact path="/" component={Hello} />
    </Switch>
  </Router>
)

```