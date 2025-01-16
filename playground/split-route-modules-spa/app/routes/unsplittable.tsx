import { Form, useLoaderData, useActionData } from "react-router";

// Dummy variable to prevent route exports from being split
let shared: null = null;

export const clientLoader = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return shared ?? "Hello from unsplittable client loader";
};

export const clientAction = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return shared ?? "Hello from unsplittable client action";
};

export default function Hello() {
  const message = useLoaderData() as Awaited<ReturnType<typeof clientLoader>>;
  const actionData = useActionData() as Awaited<
    ReturnType<typeof clientAction>
  >;
  return (
    <>
      <p>{message}</p>
      <p>{actionData}</p>
      <Form method="post">
        <button>Submit</button>
      </Form>
    </>
  );
}
