import { useState } from "react";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
  useNavigation,
  useRevalidator,
} from "react-router";
import { usePlaygroundDiscovery } from "./use-playground-discovery";
import type { Route } from "./+types/root";
import "./style.css";

export function loader({ request }: Route.LoaderArgs) {
  let cookies = (request.headers.get("Cookie") || "").split(/;\s*/);
  return {
    mismatch: cookies.includes("discovery-mismatch=1"),
    delay: cookies.includes("discovery-delay=1"),
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Route discovery playground</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  let discovery = usePlaygroundDiscovery();
  let navigation = useNavigation();
  let revalidator = useRevalidator();
  let fetcher = useFetcher<typeof import("./routes/b").loader>();
  let [mismatch, setMismatch] = useState(loaderData.mismatch);
  let [delay, setDelay] = useState(loaderData.delay);

  function setSimulation(name: string, enabled: boolean) {
    document.cookie = `discovery-${name}=${enabled ? "1" : "0"}; Path=/; SameSite=Lax`;
    if (name === "mismatch") setMismatch(enabled);
    else setDelay(enabled);
  }

  return (
    <main>
      <h1>Route discovery playground</h1>
      <p>
        Simulate a deployment mismatch without rebuilding. Reset to /a between
        scenarios to start with a partial manifest again.
      </p>
      {import.meta.env.DEV ? (
        <p role="alert">
          Dev mode includes the complete manifest. Use the production build to
          exercise discovery and mismatches (see README).
        </p>
      ) : null}

      <fieldset>
        <legend>Discovery controls</legend>
        <label>
          <input
            type="checkbox"
            checked={mismatch}
            onChange={(event) =>
              setSimulation("mismatch", event.target.checked)
            }
          />
          Simulate manifest mismatch
        </label>
        <label>
          <input
            type="checkbox"
            checked={delay}
            onChange={(event) => setSimulation("delay", event.target.checked)}
          />
          Delay manifest requests by 1.5 seconds
        </label>
        <label>
          On mismatch
          <select
            value={discovery.behavior}
            onChange={(event) => discovery.setBehavior(event.target.value)}
          >
            <option value="cancel">Cancel</option>
            <option value="load-all">Load all routes and continue</option>
            <option value="default">
              Default behavior (reload for navigation/fetcher)
            </option>
          </select>
        </label>
        <div className="row">
          <button
            onClick={() =>
              discovery.loadAllRoutes().then(
                () => discovery.log("loadAllRoutes: complete"),
                (error) => discovery.log(String(error)),
              )
            }
          >
            Load all routes
          </button>
          <button
            onClick={() =>
              discovery.discoverRoutes(["/b"]).then(
                (result) => discovery.log(`discoverRoutes: ${result.type}`),
                (error) => discovery.log(String(error)),
              )
            }
          >
            Discover /b
          </button>
          <a href="/a">Reset to /a (document reload)</a>
        </div>
      </fieldset>

      <dl className="states">
        <div>
          <dt>Discovery</dt>
          <dd data-testid="discovery-state">{discovery.state}</dd>
        </div>
        <div>
          <dt>Navigation</dt>
          <dd data-testid="navigation-state">{navigation.state}</dd>
        </div>
        <div>
          <dt>Revalidation</dt>
          <dd data-testid="revalidation-state">{revalidator.state}</dd>
        </div>
        <div>
          <dt>Fetcher</dt>
          <dd data-testid="fetcher-state">{fetcher.state}</dd>
        </div>
      </dl>
      <p>
        Client version: <code>{discovery.version}</code>
      </p>
      <nav className="row">
        <Link to="/a" discover="none">
          Navigate to /a
        </Link>
        <Link to="/b" discover="none">
          Navigate to /b
        </Link>
        <button
          onClick={() =>
            revalidator.revalidate().then(
              () => discovery.log("Revalidation settled"),
              (error) => discovery.log(String(error)),
            )
          }
        >
          Revalidate
        </button>
        <button onClick={() => fetcher.load("/b")}>Fetch /b</button>
      </nav>
      <button
        onClick={() => fetcher.submit(null, { method: "post", action: "/a" })}
      >
        Fetcher: increment counter and redirect to /b
      </button>
      <p>
        Fetcher data: <code>{JSON.stringify(fetcher.data) ?? "none"}</code>
      </p>

      <Outlet />

      <section>
        <h2>Discovery events</h2>
        <pre data-testid="events">
          {discovery.events.join("\n") || "No discovery yet"}
        </pre>
      </section>
    </main>
  );
}
