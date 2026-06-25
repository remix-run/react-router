import type { Route } from "./+types/route";
import { log } from "./actions";
import "./styles.css";

export function loader({}: Route.LoaderArgs) {
  return "hello, world";
}

export function ServerComponent({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <h1 className="home__heading">Home</h1>
      <p>This is the home page.</p>
      <p>loaderData: {loaderData}</p>
      <form action={log}>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}
