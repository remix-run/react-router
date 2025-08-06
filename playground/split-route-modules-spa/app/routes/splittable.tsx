import type { Route } from "./+types/splittable";
import { Form } from "react-router";

export const clientLoader = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Hello from splittable client loader";
};

export const clientAction = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Hello from splittable client action";
};

export default function SplittableRoute({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <>
      <p>{loaderData}</p>
      <p>{actionData}</p>
      <Form method="post">
        <button>Submit</button>
      </Form>
    </>
  );
}
