import { Outlet } from "react-router";
import { Square } from "../../square";
import { Suspense } from "react";

export function loader() {
  return {
    message: `Parent route loader ran at ${new Date().toISOString()}`,
  };
}

export default function ParentRoute({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <p>Parent Route</p>
      <p>Loader data: {loaderData.message}</p>
      <Square />
      <Suspense fallback={<p>Loading...</p>}>
        <Outlet />
      </Suspense>
    </div>
  );
}
