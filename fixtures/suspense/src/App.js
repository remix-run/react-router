// A few new API ideas:
import React, { Suspense, useState, useEffect } from "react";
import {
  Switch,
  Route,
  Link,
  useRouteMatch,
  useResource,
  useResourcesPending
} from "react-router-dom";

import fakeFetch from "./fakeFetch";

export default function App() {
  // we can know if resources are pending
  const isPending = useResourcesPending();

  return (
    <div
      style={{
        opacity: isPending ? 0.5 : 1,
        transition: "opacity 100ms",
        transitionDelay: isPending ? "1000ms" : ""
      }}
    >
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/topics">Topics</Link>
        </li>
      </ul>

      <hr />

      <Suspense fallback={<h1>Loading...</h1>}>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/topics" preload={() => fakeFetch("/topics")}>
            <Topics />
          </Route>
        </Switch>
      </Suspense>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}

function Topics() {
  // The `path` lets us build <Route> paths that are
  // relative to the parent route, while the `url` lets
  // us build relative links.
  let { path, url } = useRouteMatch();
  let topics = useResource().read();

  return (
    <div>
      <h2>Topics</h2>
      <ul>
        {topics.map(topic => (
          <li key={topic.id}>
            <Link to={`${url}/${topic.id}`}>{topic.title}</Link>
          </li>
        ))}
      </ul>

      <Switch>
        <Route exact path={path}>
          <h3>Please select a topic.</h3>
        </Route>
        <Route
          path={`${path}/:topicId`}
          preload={params => fakeFetch(`/topics/${params.topicId}`)}
        >
          <Topic />
        </Route>
      </Switch>
    </div>
  );
}

function Topic() {
  let topic = useResource().read();

  return (
    <div>
      <h3>{topic.title}</h3>
    </div>
  );
}
