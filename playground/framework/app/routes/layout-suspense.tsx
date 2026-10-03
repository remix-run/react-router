import * as React from "react";
import type { Route } from "./+types/layout-suspense";
import { useRouteLoaderData } from "react-router";
import { Outlet, Link } from "react-router";

function getData(): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve("hello from promise"), 500));
}

export function loader() {
  return { data: getData() };
}

export function Layout({ children }: Route.LayoutProps) {
  const data = useRouteLoaderData<typeof loader>("routes/layout-suspense");

  return (
    <div>
      <p>Layout Header</p>
      <React.Suspense fallback={<p>Loading...</p>}>
        {data ? <DataComponent promise={data.data} /> : null}
        {children}
      </React.Suspense>
    </div>
  );
}

export default function Component( _ : Route.ComponentProps) {
  return (
    <div>
      <Link to="child">
       Go to child Route with Layout
      </Link>
      <Outlet/>
    </div>
  );
}

function DataComponent({ promise }: { promise: Promise<string> }) {
  let data = React.use(promise);
  return <p>Data: {data}</p>;
}
