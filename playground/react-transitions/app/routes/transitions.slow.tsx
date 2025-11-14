export async function clientLoader() {
  await new Promise((r) => setTimeout(() => r("PARENT DATA"), 3000));
  return null;
}

export default function Transitions() {
  return <h2>Slow Page</h2>;
}
