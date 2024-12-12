---
title: Race Conditions
---

# Race Conditions

While impossible to eliminate every possible race condition in your application, React Router automatically handles the most common race conditions found in web user interfaces.

## Browser Behavior

React Router's handling of network concurrency is heavily inspired by the behavior of web browsers when processing documents.

Consider clicking a link to a new document, and then clicking a different link before the new page has finished loading. The browser will:

1. cancel the first request
2. immediately process the new navigation

The same behavior applies to form submissions. When a pending form submission is interrupted by a new one, the first is canceled and the new submission is immediately processed.

## React Router Behavior

Like the browser, interrupted navigations with links and form submissions will cancel in flight data requests and immediately process the new event.

Fetchers are a bit more nuanced since they are not singleton events like navigation. Fetchers can't interrupt other fetcher instances, but they can interrupt themselves and the behavior is the same as everything else: cancel the interrupted request and immediately process the new one.

Fetchers do, however, interact with each other when it comes to revalidation. After a fetcher's action request returns to the browser, a revalidation for all page data is sent. This means multiple revalidation requests can be in-flight at the same time. React Router will commit all "fresh" revalidation responses and cancel any stale requests. A stale request is any request that started _earlier_ than one that has returned.

This management of the network prevents the most common UI bugs caused by network race conditions.

Since networks are unpredictable, and your server still processes these cancelled requests, your backend may still experience race conditions and have potential data integrity issues. These risks are the same risks as using default browser behavior with plain HTML `<forms>`, which we consider to be low, and outside the scope of React Router.

## Practical Benefits

Consider building a type-ahead combobox. As the user types, you send a request to the server. As they type each new character you send a new request. It's important to not show the user results for a value that's not in the text field anymore.

When using a fetcher, this is automatically managed for you. Consider this pseudo-code:

```tsx
// route("/city-search", "./search-cities.ts")
export async function loader({ request }) {
  const { searchParams } = new URL(request.url);
  return searchCities(searchParams.get("q"));
}
```

```tsx
export function CitySearchCombobox() {
  const fetcher = useFetcher();

  return (
    <fetcher.Form action="/city-search">
      <Combobox aria-label="Cities">
        <ComboboxInput
          name="q"
          onChange={(event) =>
            // submit the form onChange to get the list of cities
            fetcher.submit(event.target.form)
          }
        />

        {fetcher.data ? (
          <ComboboxPopover className="shadow-popup">
            {fetcher.data.length > 0 ? (
              <ComboboxList>
                {fetcher.data.map((city) => (
                  <ComboboxOption
                    key={city.id}
                    value={city.name}
                  />
                ))}
              </ComboboxList>
            ) : (
              <span>No results found</span>
            )}
          </ComboboxPopover>
        ) : null}
      </Combobox>
    </fetcher.Form>
  );
}
```

Calls to `fetcher.submit` will cancel pending requests on that fetcher automatically. This ensures you never show the user results for a request for a different input value.
