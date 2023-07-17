export default async function tick() {
  await new Promise((r) => setTimeout(r, 0));
}
