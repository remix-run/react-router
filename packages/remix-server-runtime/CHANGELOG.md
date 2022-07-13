# @remix-run/server-runtime

## 1.6.5-pre.1

### Patch Changes

- We enhanced the type signatures of `loader`/`action` and `useLoaderData`/`useActionData` to make it possible to infer the data type from return type of its related server function.

  ```tsx
  import type { LoaderArgs } from "@remix-run/[runtime]";

  export async function loader(args: LoaderArgs) {
    return json({ greeting: "Hello!" }); // TypedResponse<{ greeting: string }>
  }

  export default function App() {
    let data = useLoaderData<typeof loader>(); // { greeting: string }
    return <div>{data.greeting}</div>;
  }
  ```

  See the discussion in #1254 for more context.

## 1.6.5-pre.0
