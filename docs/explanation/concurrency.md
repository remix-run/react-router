---
title: Network Concurrency Management
---

# Network Concurrency Management

[MODES: framework, data]

<br/>
<br/>

When building web applications, managing network requests can be a daunting task. The challenges of ensuring up-to-date data and handling simultaneous requests often lead to complex logic in the application to deal with interruptions and race conditions. React Router simplifies this process by automating network management while mirroring and expanding upon the intuitive behavior of web browsers.

To help understand how React Router handles concurrency, it's important to remember that after `form` submissions, React Router will fetch fresh data from the `loader`s. This is called revalidation.

## Natural Alignment with Browser Behavior

React Router's handling of network concurrency is heavily inspired by the default behavior of web browsers when processing documents.

### Link Navigation

**Browser Behavior**: When you click on a link in a browser and then click on another before the page transition completes, the browser prioritizes the most recent `action`. It cancels the initial request, focusing solely on the latest link clicked.

**React Router Behavior**: React Router manages client-side navigation the same way. When a link is clicked within a React Router application, it initiates fetch requests for each `loader` tied to the target URL. If another navigation interrupts the initial navigation, React Router cancels the previous fetch requests, ensuring that only the latest requests proceed.

### Form Submission

**Browser Behavior**: If you initiate a form submission in a browser and then quickly submit another form again, the browser disregards the first submission, processing only the latest one.

**React Router Behavior**: React Router mimics this behavior when working with forms. If a form is submitted and another submission occurs before the first completes, React Router cancels the original fetch requests. It then waits for the latest submission to complete before triggering page revalidation again.

## Concurrent Submissions and Revalidation

While standard browsers are limited to one request at a time for navigations and form submissions, React Router elevates this behavior. Unlike navigation, with [`useFetcher`][use_fetcher] multiple requests can be in flight simultaneously.

React Router is designed to handle multiple form submissions to server `action`s and concurrent revalidation requests efficiently. It ensures that as soon as new data is available, the state is updated promptly. However, React Router also safeguards against potential pitfalls by refraining from committing stale data when other `action`s introduce race conditions.

For instance, if three form submissions are in progress, and one completes, React Router updates the UI with that data immediately without waiting for the other two so that the UI remains responsive and dynamic. As the remaining submissions finalize, React Router continues to update the UI, ensuring that the most recent data is displayed.

Using this key:

- `|`: Submission begins
- ✓: Action complete, data revalidation begins
- ✅: Revalidated data is committed to the UI
- ❌: Request cancelled

We can visualize this scenario in the following diagram:

```text
submission 1: |----✓-----✅
submission 2:    |-----✓-----✅
submission 3:             |-----✓-----✅
```

However, if a subsequent submission's revalidation completes before an earlier one, React Router discards the earlier data, ensuring that only the most up-to-date information is reflected in the UI:

```text
submission 1: |----✓---------❌
submission 2:    |-----✓-----✅
submission 3:             |-----✓-----✅
```

Because the revalidation from submission (2) started later and landed earlier than submission (1), the requests from submission (1) are canceled and only the data from submission (2) is committed to the UI. It was requested later, so it's more likely to contain the updated values from both (1) and (2).

## Potential for Stale Data

It's unlikely your users will ever experience this, but there are still chances for the user to see stale data in very rare conditions with inconsistent infrastructure. Even though React Router cancels requests for stale data, they will still end up making it to the server. Canceling a request in the browser simply releases browser resources for that request; it can't "catch up" and stop it from getting to the server. In extremely rare conditions, a canceled request may change data after the interrupting `action`'s revalidation lands. Consider this diagram:

```text
     👇 interruption with new submission
|----❌----------------------✓
       |-------✓-----✅
                             👆
                  initial request reaches the server
                  after the interrupting submission
                  has completed revalidation
```

The user is now looking at different data than what is on the server. Note that this problem is both extremely rare and exists with default browser behavior, too. The chance of the initial request reaching the server later than both the submission and revalidation of the second is unexpected on any network and server infrastructure. If this is a concern with your infrastructure, you can send timestamps with your form submissions and write server logic to ignore stale submissions.

## Example

In UI components like comboboxes, each keystroke can trigger a network request. Managing such rapid, consecutive requests can be tricky, especially when ensuring that the displayed results match the most recent query. However, with React Router, this challenge is automatically handled, ensuring that users see the correct results without developers having to micromanage the network.

```tsx filename=app/pages/city-search.tsx
export async function loader({ request }) {
  const { searchParams } = new URL(request.url);
  const cities = await searchCities(searchParams.get("q"));
  return cities;
}

export function CitySearchCombobox() {
  const fetcher = useFetcher<typeof loader>();

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

        {/* render with the loader's data */}
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

All the application needs to know is how to query the data and how to render it. React Router handles the network.

## Conclusion

React Router offers developers an intuitive, browser-based approach to managing network requests. By mirroring browser behaviors and enhancing them where needed, it simplifies the complexities of concurrency, revalidation, and potential race conditions. Whether you're building a simple webpage or a sophisticated web application, React Router ensures that your user interactions are smooth, reliable, and always up to date.

[use_fetcher]: ../api/hooks/useFetcher
