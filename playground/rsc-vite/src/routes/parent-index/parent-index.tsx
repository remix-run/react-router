export async function loader() {
  await new Promise((r) => setTimeout(r, 500));
  return {
    message: `Parent Index route loader ran at ${new Date().toISOString()}`,
  };
}

export function Component({
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
