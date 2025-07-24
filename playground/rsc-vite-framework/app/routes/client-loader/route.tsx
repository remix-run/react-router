import type { Route } from "./+types/route";

import styles from "./styles.module.css";

export function loader() {
  return "hello, world from server loader";
}

export function clientLoader() {
  return "hello, world from client loader";
}

export default function ClientLoaderRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <main>
      <h1 className={styles.heading}>Client loader</h1>
      <p>Loader data: {loaderData}</p>
    </main>
  );
}
