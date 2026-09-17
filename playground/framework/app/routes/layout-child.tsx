import * as React from "react";
import type { Route } from "./+types/layout-child";

function getData(): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve("hello from promise"), 1500));
}

export function loader() {
  return { data: getData() };
}

export function Layout({ children }: Route.LayoutProps) {
  return (
    <div>
      <p>Child Layout</p>
      <React.Suspense fallback={<p>Loading...</p>}>
        {children}
      </React.Suspense>
    </div>
  );
}

export default function Component({ loaderData }: Route.ComponentProps) {
  // We can call React.use directly in the Component as it's wrapped in Suspense boundary
  let data = React.use(loaderData.data);
  return <p>Data: {data}</p>;
}
