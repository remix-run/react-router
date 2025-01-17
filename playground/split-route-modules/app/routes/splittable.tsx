import type { Route } from "./+types/splittable";
import { Form } from "react-router";

export const clientLoader = async () => {
  return "Hello from splittable client loader";
};

export const clientAction = async () => {
  return "Hello from splittable client action";
};

export function HydrateFallback() {
  return <div>Loading...</div>;
}

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
