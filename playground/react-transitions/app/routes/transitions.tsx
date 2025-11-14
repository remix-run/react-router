import * as React from "react";
import {
  Link,
  Outlet,
  useFetcher,
  useNavigate,
  useNavigation,
} from "react-router";
import type { loader as randomNumberLoader } from "./api.random";

export default function Transitions() {
  let navigate = useNavigate();
  let fetcher = useFetcher<typeof randomNumberLoader>();
  let navigation = useNavigation();
  let [pending, startTransition] = React.useTransition();
  let [count, setCount] = React.useState(0);
  let [count2, setCount2] = React.useState(0);
  let [random, setRandom] = React.useState(0);

  React.useEffect(() => {
    if (fetcher.data) {
      let { randomNumber } = fetcher.data;
      startTransition(() => setRandom(randomNumber));
    }
  }, [fetcher.data]);

  return (
    <>
      <h1>Transitions</h1>
      <nav>
        Start Over:{" "}
        <a href="/transitions">
          <code>unstable_useTransitions=undefined</code>
        </a>
        {" | "}
        <a href="/transitions?transitions=true">
          <code>unstable_useTransitions=true</code>
        </a>
        {" | "}
        <a href="/transitions?transitions=false">
          <code>unstable_useTransitions=false</code>
        </a>
      </nav>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          marginTop: "1rem",
          border: "1px solid #ccc",
        }}
      >
        <div style={{ padding: "1rem" }}>
          <h2>Navigations</h2>

          <div>
            <p
              style={{
                color: pending ? "green" : "lightgrey",
                fontWeight: pending ? "bold" : "normal",
              }}
            >
              Local React Transition: {pending ? "Pending" : "Idle"}
            </p>
            <p
              style={{
                color: navigation.state !== "idle" ? "green" : "lightgrey",
                fontWeight: navigation.state !== "idle" ? "bold" : "normal",
              }}
            >
              React Router Navigation State: {navigation.state}
            </p>
          </div>

          <ul style={{ maxWidth: "600px" }}>
            <li>
              <Link to="/transitions/slow">
                &lt;Link to="/transitions/slow" /&gt;
              </Link>
              <ul>
                <li>
                  In the current state, <code>&lt;Link&gt;</code> navigations
                  are not wrapped in <code>startTransition</code>, so they don't
                  play nice with other transition-aware state updates
                </li>
                <li>
                  Navigate and increment the transition-enabled counter during
                  the navigation. We should not see the counter updates
                  reflected until the navigation ends in a "suspense enabled"
                  router
                </li>
                <li>
                  With the new flag, they are wrapped in{" "}
                  <code>startTransition</code> and the count syncs up properly
                </li>
              </ul>
            </li>

            <li>
              <button onClick={() => navigate("/transitions/slow")}>
                <code>navigate("/transitions/slow")</code>
              </button>
              <ul>
                <li>
                  <code>useNavigate</code> is is not wrapped in startTransitoion
                  with or without the enw flag, so it should never sync with the
                  transition-enabled counter
                </li>
              </ul>
            </li>

            <li>
              <button
                onClick={() =>
                  // @ts-expect-error Needs React 19 types
                  startTransition(() => navigate("/transitions/slow"))
                }
              >
                <code>
                  startTransition(() =&gt; navigate("/transitions/slow")
                </code>
              </button>
              <ul>
                <li>
                  If you wrap <code>useNavigate</code> in{" "}
                  <code>startTransition</code> manually, then it syncs with the
                  counter.
                </li>
                <li>
                  Without the flag, our router state updates don't surface
                  during the navigation. Enabling the flag wraps out internal
                  updates with <code>useOptimistic</code> to allow them to
                  surface
                </li>
              </ul>
            </li>

            <li>
              Nested Parent/Child Await:
              <ul>
                <li>
                  Should not re-fallback when going from parent -&gt; child
                </li>
                <li>
                  <Link to="/transitions/parent">/transitions/parent</Link>
                </li>
                <li>
                  <Link to="/transitions/parent/child">
                    /transitions/parent/child
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div style={{ padding: "1rem" }}>
          <div>
            <h2>Fetchers</h2>
            <button onClick={() => fetcher.load("/api/random")}>
              fetcher.load("/api/random")
            </button>
            <br />
            <br />
            <button
              // @ts-expect-error Needs React 19 types
              onClick={() => startTransition(() => fetcher.load("/api/random"))}
            >
              startTransition(() =&gt; fetcher.load("/api/random"))
            </button>
            <p
              style={{
                color: fetcher.state !== "idle" ? "green" : "lightgrey",
                fontWeight: fetcher.state !== "idle" ? "bold" : "normal",
              }}
            >
              Fetcher State: <strong>{fetcher.state}</strong>
            </p>
            <p
              style={{
                color: fetcher.data != null ? "green" : "lightgrey",
                fontWeight: fetcher.data != null ? "bold" : "normal",
              }}
            >
              Fetcher Data:{" "}
              {fetcher.data ? JSON.stringify(fetcher.data) : "null"}
            </p>
            <p
              style={{
                color: random !== 0 ? "green" : "lightgrey",
                fontWeight: random !== 0 ? "bold" : "normal",
              }}
            >
              Transition-aware fetcher data: {random}
            </p>
          </div>

          <div>
            <h2>Counters</h2>
            <button onClick={() => setCount((c) => c + 1)}>
              <code>setCount(c =&gt; c + 1)</code>
            </button>{" "}
            <span>Count = {count}</span>
            <br />
            <br />
            <button
              onClick={() =>
                React.startTransition(() => setCount2((c) => c + 1))
              }
            >
              <code>startTransition(() =&gt; setCount2(c =&gt; c + 1))</code>
            </button>{" "}
            <span>Count2 = {count2}</span>
          </div>
        </div>
      </div>

      <Outlet />
      <p>
        TODO: Is it possible to demonstrate the issue with{" "}
        <code>React.useSyncExternalStore</code> where the global opt-out is
        needed?
      </p>
    </>
  );
}
