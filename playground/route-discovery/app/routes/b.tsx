import { readCounter } from "../counter.server";
import type { Route } from "./+types/b";

export function loader() {
  return { counter: readCounter() };
}

export default function B({ loaderData }: Route.ComponentProps) {
  return (
    <section>
      <h2>Route /b</h2>
      <p>
        Counter from loader:{" "}
        <strong data-testid="counter">{loaderData.counter}</strong>
      </p>
      <p>
        /b is now discovered. Use “Reset to /a” for another discovery attempt.
      </p>
    </section>
  );
}
