import * as React from "react";
import { Link, Outlet, useNavigate, useNavigation } from "react-router";

export default function Transitions() {
  let navigate = useNavigate();
  let navigation = useNavigation();
  let [pending, startTransition] = React.useTransition();
  let [count, setCount] = React.useState(0);
  let [count2, setCount2] = React.useState(0);
  return (
    <>
      <h1>Transitions</h1>
      <nav>
        Start Over:{" "}
        <a href="/transitions">
          <code>unstable_transitions=undefined</code>
        </a>
        {" | "}
        <a href="/transitions?transitions=true">
          <code>unstable_transitions=true</code>
        </a>
        {" | "}
        <a href="/transitions?transitions=false">
          <code>unstable_transitions=false</code>
        </a>
      </nav>
      <ul style={{ maxWidth: "600px" }}>
        <li>
          <button onClick={() => navigate("/transitions/slow")}>
            Slow navigation with <code>navigate</code>
          </button>
          <ul>
            <li>
              In the current state, <code>useNavigate</code> navigations are not
              wrapped in <code>startTransition</code>, so they don't play nice
              with other transition-aware state updates
            </li>
            <li>
              Fixed by{" "}
              <code>
                &lt;HydrateRouter unstable_transitions={"{"}true{"}"} /&gt;
              </code>
            </li>
          </ul>
        </li>

        <li>
          <button
            onClick={() => navigate("/transitions/slow", { flushSync: true })}
          >
            Slow navigation with <code>navigate + flushSync</code>
          </button>
          <ul>
            <li>
              With the new flag, useNavigate automatically wraps the navigation
              in <code>React.startTransition</code>. Passing the{" "}
              <code>flushSync</code> option will opt out of that and apply
              <code>React.flushSync</code> to the underlying state update
            </li>
          </ul>
        </li>

        <li>
          <button
            onClick={() => startTransition(() => navigate("/transitions/slow"))}
          >
            Slow navigation with local <code>startTransition + navigate</code>
          </button>
          <ul>
            <li>
              Once you wrap them in <code>startTransition</code>, they play
              nicely with those updates but they prevent our internal
              mid-navigation state updates from surfacing
            </li>
            <li>
              Fixed by{" "}
              <code>
                &lt;HydrateRouter unstable_transitions={"{"}true{"}"} /&gt;
              </code>
            </li>
          </ul>
        </li>

        <li>
          <Link to="/transitions/slow">Slow Navigation via &lt;Link&gt;</Link>
          <ul>
            <li>
              In the current state, <code>&lt;Link&gt;</code> navigations are
              not wrapped in startTransition, so they don't play nice with other
              transition-aware state updates
            </li>
            <li>
              Fixed by{" "}
              <code>
                &lt;HydrateRouter unstable_transitions={"{"}true{"}"} /&gt;
              </code>
            </li>
          </ul>
        </li>

        <li>
          <Link to="/transitions/parent">/transitions/parent</Link>
        </li>
        <li>
          <Link to="/transitions/parent/child">/transitions/parent/child</Link>
        </li>
      </ul>
      <div>
        <p
          style={{
            color: pending ? "green" : "black",
            fontWeight: pending ? "bold" : "normal",
          }}
        >
          React Transition: {pending ? "Pending" : "Idle"}
        </p>
        <p
          style={{
            color: navigation.state !== "idle" ? "green" : "black",
            fontWeight: navigation.state !== "idle" ? "bold" : "normal",
          }}
        >
          React Router Navigation State: {navigation.state}
        </p>
      </div>
      <button onClick={() => setCount((c) => c + 1)}>
        Increment counter w/o transition {count}
      </button>{" "}
      <button
        onClick={() => React.startTransition(() => setCount2((c) => c + 1))}
      >
        Increment counter w/transition {count2}
      </button>
      <Outlet />
      <p>
        TODO: Is it possible to demonstrate the issue with
        <code>React.useSyncExternalStore</code> where the global opt-out is
        needed?
      </p>
    </>
  );
}
