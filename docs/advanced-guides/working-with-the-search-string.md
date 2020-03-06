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
import { useSearchParams } from 'react-router-dom';

// Assuming a <SearchResults> element is rendered at a URL like
// /search?q=some+search+value, you can get the `q` search parameter like this:
function SearchResults() {
  let searchParams = useSearchParams();
  let q = searchParams.get('q');

  return (
    <p>The query is "{q}".</p>
  );
}
```

You can easily re-use all existing search parameters and add more by cloning
the existing `searchParams` object and appending a new parameter or two. The
following example creates a few links, each of which append a new value to the
search string and preserve all existing values.

```js
import { useSearchParams } from 'react-router-dom';

function ShoeBrandLinks() {
  let searchParams = useSearchParams();

  function addParam(name, value) {
    let newParams = new URLSearchParams(searchParams);
    newParams.append(name, value);
    return newParams;
  }

  return (
    <div>
      <Link to={{ search: '?' + addParam('brand', 'Nike') }}>Nike</Link>{' '}
      <Link to={{ search: '?' + addParam('brand', 'Adidas') }}>Adidas</Link>{' '}
      <Link to={{ search: '?' + addParam('brand', 'Under Armour') }}>Under Armour</Link>
    </div>
  );
}
```

Tip: Notice how the `URLSearchParams` object is automatically converted to a
string when using `'?' + searchParams`. This is a feature of JavaScript objects
that implement [the `toString`
method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString).

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
