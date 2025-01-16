import { Form, useLoaderData, useActionData } from "react-router";

export const clientLoader = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Hello from splittable client loader";
};

export const clientAction = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Hello from splittable client action";
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
