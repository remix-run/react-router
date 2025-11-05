import { useTransition } from "react";
import {
  useNavigate,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "react-router";

export function Layout({ children }: { children: React.ReactNode }) {
  const [pending, startTransition] = useTransition();
  const navigate = useNavigate();
  const navigation = useNavigation();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <Meta />
        <Links />
      </head>
      <body>
        <ul>
          <li>
            <Link prefetch="intent" to="/">
              Home
            </Link>
          </li>
          <li>
            <Link prefetch="intent" to="/products/abc">
              Product
            </Link>
          </li>
          <li>
            <button
              onClick={() => {
                // @ts-expect-error - Needs React 19 types
                startTransition(() => navigate("/"));
              }}
            >
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                // @ts-expect-error - Needs React 19 types
                startTransition(() => navigate("/products/abc"));
              }}
            >
              Product
            </button>
          </li>
          <li>{pending ? "Loading..." : "Idle"}</li>
        </ul>
        <pre>
          <p>{JSON.stringify(navigation)}</p>
        </pre>
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
