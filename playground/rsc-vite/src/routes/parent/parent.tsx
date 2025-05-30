import { Outlet } from "react-router";

export function loader() {
  return {
    message: `Parent route loader ran at ${new Date().toISOString()}`,
  };
}

export default function Component({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h2>Parent Route</h2>
      <p>Loader data: {loaderData.message}</p>
      <Outlet />
    </div>
  );
}
