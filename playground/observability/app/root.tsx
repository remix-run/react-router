import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type MiddlewareFunction,
} from "react-router";

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

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <nav>
          <Link to="/">Home</Link>
          <br />
          <Link to="/foo">Foo</Link>
          <br />
          <Link to="/bar">Bar</Link>
          <br />
          <Link to="/baz">Baz</Link>
          <br />
        </nav>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
