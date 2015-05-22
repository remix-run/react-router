API is described in [Histories][Histories].

Uses the hash (`#`) portion of the URL.

For example, your urls will look like this:
`https://example.com/#/courses/123`.

Query Params
------------

Query params in the portion of the URL before the `#` are completely
ignored with `HashHistory` because they are not part of the URL that
`HashHistory` manages. Query parameters after the `#` will work as
expected.

For example: ` http://example.com/?lang=es#/messages?sort=date`,
`lang=es` is invisible to a `HashHistory` router, but `sort=date` is
recognized, and will be used as the query parameters.

Example
-------

```js
import { HashHistory, Router } from 'react-router';
import routes from './routes';

React.render((
  <HashHistory>
    <Router routes={routes}/>
  </HashHistory>
), document.body);
```



  [Histories]:#TODO
