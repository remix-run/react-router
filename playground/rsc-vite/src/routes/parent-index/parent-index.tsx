import { Outlet } from "react-router";

export function loader() {
  return {
    message: `Parent Index route loader ran at ${new Date().toISOString()}`,
  };
}

export default function Component({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) {
  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h3>Parent Index Route</h3>
      <p>Loader data: {loaderData.message}</p>
    </div>
  );
}
