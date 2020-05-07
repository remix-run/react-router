# Working with the Search/Query String

[The "search"
string](https://developer.mozilla.org/en-US/docs/Web/API/URL/search) (also
called a "query string") is the portion of a URL that begins with a `?` and
contains the search parameters of the URL. These parameters are commonly used to
describe variations on a given resource, such as filtering and paging. In search
engines, the search string often contains the terms that were entered into the
search field.

## Using the `useSearchParams` hook

React Router includes a convenient [`useSearchParams` hook](#TODO) for working
with search strings that is based on [JavaScript's standard `URLSearchParams`
API](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

Using the `URLSearchParams` object provides a few nice benefits:

- It's built-in to web browsers, so you don't have to load extra code just for
  working with search strings
- It provides various tools for cloning, appending to, removing from, and
  properly encoding search string parameters
- It has a built-in `toString` method that makes it easy to append to URLs

You can use the `useSearchParams` hook anywhere you need to work with the
search/query parameters.

```js
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';

function SearchPage() {
  let queryRef = React.useRef();
  let [searchParams, setSearchParams] = useSearchParams({ q: '' });
  let query = searchParams.get('q');

  // Use the form's "submit" event to persist
  // the query to the browser's address bar
  function handleSubmit(event) {
    event.preventDefault();
    setSearchParams({ q: queryRef.current.value });
  }

  return (
    <div>
      <p>The current query is "{query}".</p>

      <form onSubmit={handleSubmit}>
        <input name="q" defaultValue={query} ref={queryRef} />
      </form>
    </div>
  );
}
```

## Using a Custom Parser

If you'd rather use a custom search string parser, instead of the built-in
`useSearchParams` hook, you can easily create your own hook that parses the
`location.search` value using whatever parser you'd like.

In this example, the custom `useQuery` hook uses [the popular `query-string`
parser](https://www.npmjs.com/package/query-string).

Note: Although this approach provides a little more flexibility when parsing
search strings, you will also incur the cost of loading another library in your
app in order to use it. In web apps in particular, it's important to try to keep
your dependencies to a minimum so your application loads and executes as quickly
as possible. For this reason, we always try to use APIs that are built-in to
browsers if we can.

```js
import React from 'react';
import { useLocation } from 'react-router-dom';

import qs from 'query-string';

// First, create our custom hook. We memoize the result of parsing the search
// string here so we don't have to re-parse it every time the hook is used.
function useQuery() {
  let location = useLocation();
  return React.useMemo(
    () => qs.parse(location.search),
    [location.search]
  );
}

// Then, assuming a <SearchResults> element is rendered at a URL like
// /results?q=some+search+value, you can get the `q` search parameter like this:
function SearchResults() {
  let { q } = useQuery();

  return (
    <p>The query is "{q}".</p>
  );
}
```
