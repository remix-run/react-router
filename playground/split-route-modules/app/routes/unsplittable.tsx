import type { Route } from "./+types/unsplittable";
import { Form } from "react-router";

// Dummy variable to prevent route exports from being split
let shared: null = null;

export const clientLoader = async () => {
  return shared ?? "Hello from unsplittable client loader";
};

export const clientAction = async () => {
  return shared ?? "Hello from unsplittable client action";
};

export function HydrateFallback() {
  return shared ?? <div>Loading...</div>;
}

export default function UnsplittableRoute({
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
