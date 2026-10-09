import { Form, redirect } from "react-router";
import { incrementCounter, readCounter } from "../counter.server";
import type { Route } from "./+types/a";

export function loader() {
  return { counter: readCounter() };
}

export function action() {
  incrementCounter();
  return redirect("/b");
}

export default function A({ loaderData }: Route.ComponentProps) {
  return (
    <section>
      <h2>Route /a</h2>
      <p>
        Counter from loader:{" "}
        <strong data-testid="counter">{loaderData.counter}</strong>
      </p>
      <p>
        <label>
          Unsaved draft <input placeholder="Type before navigating" />
        </label>
      </p>
      <Form method="post" discover="none">
        <button>Increment counter and redirect to /b</button>
      </Form>
      <p>
        With a mismatch and Cancel selected, the mutation succeeds but /a stays
        visible with its old counter. Revalidate to see the new value.
      </p>
    </section>
  );
}
