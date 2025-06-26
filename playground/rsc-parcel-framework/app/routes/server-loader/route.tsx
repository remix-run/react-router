import type { Route } from "./+types/route.js";
// @ts-expect-error
import styles from "./styles.module.css";

export function loader() {
  return "hello, world from server loader";
}

export default function ServerLoaderRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <main>
      <h1 className={styles.heading}>Server loader</h1>
      <p>Loader data: {loaderData}</p>
    </main>
  );
}
