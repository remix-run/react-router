import * as React from "react";
import type { Route } from "./+types/layout-suspense";

function getData(): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve("hello from promise"), 500));
}

export function loader() {
  return { data: getData() };
}

export function Layout({ children }: Route.LayoutProps) {
  return (
    <div>
      <p>Layout Header</p>
      <React.Suspense fallback={<p>Loading...</p>}>
        {children}
      </React.Suspense>
    </div>
  );
}

export default function Component({ loaderData }: Route.ComponentProps) {
  let data = React.use(loaderData.data);
  return <p>Data: {data}</p>;
}
