export async function loader() {
  await new Promise((r) => setTimeout(r, 1000));
  return { randomNumber: Math.round(Math.random() * 100) };
}
