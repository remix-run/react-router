async function loader() {
  await new Promise((r) => setTimeout(r, 500));
  return {
    message: `Child route loader ran at ${new Date().toISOString()}`,
  };
}

export async function Component() {
  let loaderData = await loader();
  return (
    <div style={{ border: "1px solid black", padding: "10px" }}>
      <h3>Child Route</h3>
      <p>Loader data: {loaderData.message}</p>
    </div>
  );
}
