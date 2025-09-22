// @ts-expect-error - needs React 19 types
import { unstable_ViewTransition as ViewTransition } from "react";
import type { Route } from "./+types/route";
import { log } from "./actions";
import { SubmitButton } from "./client";
import "./styles.css";

export function loader({}: Route.LoaderArgs) {
  return "hello, world";
}

const items = ["blue", "green", "red", "yellow", "purple"];

export async function ServerComponent({ loaderData }: Route.ComponentProps) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return (
    <main>
      <h1 className="home__heading">Home</h1>
      <p>This is the home page.</p>
      <p>loaderData: {loaderData}</p>
      {/* @ts-expect-error React types for the repo are set to v18 */}
      <form action={log}>
        <SubmitButton />
      </form>
      <ul>
        {items
          .sort(() => Math.random() - 0.5)
          .map((item) => (
            <ViewTransition key={item} name={item}>
              <div
                style={{
                  backgroundColor: item,
                  width: "100px",
                  height: "100px",
                }}
              />
            </ViewTransition>
          ))}
      </ul>
    </main>
  );
}
