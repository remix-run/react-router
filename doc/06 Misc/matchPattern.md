Matches a path to a pattern (route path).

Example
-------

```js
import { matchPattern } from 'react-router';
var match = matchPattern('/statements/2015-01-01?foo=bar', '/statements/:month');
// {
//   path: '/statements/2015-01-01',
//   params: {
//     month: '2015-01-01'
//   }
// }
```

