import type { MiddlewareFunction } from "react-router";

let sleep = (ms: number = Math.max(100, Math.round(Math.random() * 500))) =>
  new Promise((r) => setTimeout(r, ms));

export const middleware = [
  async (_: unknown, next: Parameters<MiddlewareFunction<Response>>[1]) => {
    await sleep();
    await next();
    await sleep();
  },
];

export async function loader() {
  await sleep();
}

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to React Router</h1>
    </div>
  );
}
