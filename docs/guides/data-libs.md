---
title: Data Library Integration
description: 'Since the release of v6.4 some folks wonder if React Router is attempting to replace libraries like React Query.  The answer is "nope!".'
---

# Data Library Integration

Since the release of v6.4 some folks wonder if React Router is attempting to replace libraries like [React Query][react-query], [useSwr][useswr], etc.

The answer is "nope!".

React Router's data APIs are about _when_ to load, mutate, and revalidate data, but not _how_ to do it. It's about the data lifecycle, not the actual implementation of data fetching, mutation, storage, and caching.

Considering that `<a href>` and `<form action>` are both navigation events, and both coupled to data (what data to show or what data to change), it makes sense that a client side router would help you with the _navigation state_ of both elements. But the actual data implementation is up to you.

The examples here were adapted from [TkDodo's blog][tkdodo], thank you for the great post!

## Loading Data

Instead of loading data in components, you use your data abstractions inside of loaders. Note that this loading happens outside of the React render lifecycle, so you can't use hooks like React Query's `useQuery`, you'll need to use the query client's methods directly.

```jsx lines=[4]
import { queryClient } from "./query-client";

export const loader = ({ params }) => {
  return queryClient.fetchQuery(queryKey, queryFn, {
    staleTime: 10000,
  });
};
```

If the query client throws errors correctly, then React Router's [`errorElement`][errorelement] will work the same.

Of course, you can use all of the features of the data library, like caching. Caching your data ensures that when the user clicks the back button to a page you've already seen, the data is loaded from the cache immediately. Sometimes caching is the right choice, sometimes you always want it fresh, but that's not a decision within the scope of React Router's data APIs.

React Router only retains the _current page's loaderData_. If users click "back", all loaders are called again. Without a data caching library like React Query (or HTTP cache headers on your JSON API to use the browser's own HTTP cache), your app will refetch all of the data again.

In this way, React Router is about _timing_, where React Query is about _caching_.

## Accessing Data in Components

While React Router's `useLoaderData` returns whatever you returned from your loader, you can use your data abstraction's hooks instead to get access to the full feature set of that package.

```diff
export default function SomeRouteComponent() {
- const data = useLoaderData();
+ const { data } = useQuery(someQueryKey);
}
```

## Invalidating Data in Mutations

Because most of these library's have some mechanism for caching, you'll need to invalidate those caches at some point.

The perfect place to invalidate those caches is in a React Router [action][action].

```jsx lines=[7]
import { queryClient } from "./query-client";

export const action = async ({ request, params }) => {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  await updateContact(params.contactId, updates);
  await queryClient.invalidateQueries(["contacts"]);
  return redirect(`/contacts/${params.contactId}`);
};
```

## Usage with `defer`

You can similarly take advantage of the deferred APIs:

```jsx lines=[2,10,14,28]
function loader() {
  return defer({
    // no await!
    someData: queryClient.fetchQuery("someKey", fn),
  });
}

function Comp() {
  // *do* useLoaderData for promise
  const { someData } = useLoaderData();
  return (
    <div>
      <h1>Something</h1>
      <Await
        resolve={someData}
        errorElement={<div>Oops!</div>}
      >
        <SomeView />
      </Await>
    </div>
  );
}

function SomeView() {
  // instead of accessing with useAsyncValue
  // const someData = useAsyncValue();
  // `useQuery` as usual
  const { data } = useQuery("someKey");
  // ...
}
```

## The Overlap

Hooks like `useQuery` often return pending and error states you can use to branch your UI. With React Router, you can keep all of that branching out of your happy path components and rely on [`errorElement`][errorelement], [`useNavigation`][usenavigation], and [`Await`][await] instead.

## Conclusion

With all of these APIs working together, you can now use [`useNavigation`][usenavigation] from React Router to build pending states, optimistic UI, and more. Use React Router for timing of data loading, mutations, and navigation state, then use libraries like React Query for the actual implementation of loading, invalidating, storage, and caching.

[react-query]: https://tanstack.com/query/v4/
[useswr]: https://swr.vercel.app/
[errorelement]: ../route/error-element
[action]: ../route/action
[tkdodo]: https://tkdodo.eu/blog/react-query-meets-react-router
[usenavigation]: ../hooks/use-navigation
[await]: ../components/await
