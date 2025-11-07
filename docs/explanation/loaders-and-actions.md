# Loaders and Actions

In React Router, **loaders** and **actions** are functions attached to routes that handle
data loading and mutations during navigation.

They bring concepts from Remix to React Router’s Data APIs.

---

## Loaders

A **loader** runs before a route renders, allowing you to fetch the data it needs.

```ts
export async function loader({ params }) {
  const user = await fetch(`/api/users/${params.id}`).then(res => res.json());
  return { user };
}
```

The data returned by a loader is accessible via the `useLoaderData()` hook.

```ts
function User() {
  const { user } = useLoaderData();
  return <h1>{user.name}</h1>;
}
```
## Actions

An action handles form submissions and other data mutations.
```ts
export async function action({ request }) {
  const formData = await request.formData();
  await updateUser(formData);
  return redirect("/users");
}
```

The result of an action can be accessed with `useActionData()`.

## Relationship to Remix

These features originated in Remix’s routing model and were introduced
into React Router through the Data APIs.
For deeper details, see the original Remix documentation on Loaders and Actions
.