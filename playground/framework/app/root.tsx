import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import integrity from "virtual:react-router/sri-manifest";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              integrity,
            }),
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts integrity={integrity} />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
