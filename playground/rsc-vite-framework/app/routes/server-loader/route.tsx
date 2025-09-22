// @ts-expect-error - needs React 19 types
import { unstable_ViewTransition as ViewTransition } from "react";
import type { Route } from "./+types/route";
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
      <ViewTransition name="blue">
        <div
          style={{ backgroundColor: "blue", width: "100px", height: "100px" }}
        />
      </ViewTransition>
    </main>
  );
}
