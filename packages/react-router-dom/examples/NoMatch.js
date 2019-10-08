import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Link,
  Switch,
  Redirect,
  useLocation
} from "react-router-dom";

export default function NoMatchExample() {
  return (
    <Router>
      <div>
        <div>
          <p>
            There are a few useful things to note about this example:
          </p>

          <ol>
            <li>
              A <code>&lt;Switch&gt;</code> renders the first child{" "}
              <code>&lt;Route&gt;</code> that matches
            </li>
            <li>
              A <code>&lt;Redirect&gt;</code> may be used to redirect
              old URLs to new ones
            </li>
            <li>
              A <code>&lt;Route path=&quot;*&quot;&gt;</code> always
              matches
            </li>
          </ol>
        </div>

        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/old-match">Old Match, to be redirected</Link>
          </li>
          <li>
            <Link to="/will-match">Will Match</Link>
          </li>
          <li>
            <Link to="/will-not-match">Will Not Match</Link>
          </li>
          <li>
            <Link to="/also/will/not/match">Also Will Not Match</Link>
          </li>
        </ul>

        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/old-match">
            <Redirect to="/will-match" />
          </Route>
          <Route path="/will-match">
            <WillMatch />
          </Route>
          <Route path="*">
            <NoMatch />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function Home() {
  return <h3>Home</h3>;
}

function WillMatch() {
  return <h3>Matched!</h3>;
}

function NoMatch() {
  let location = useLocation();

  return (
    <div>
      <h3>
        No match for <code>{location.pathname}</code>
      </h3>
    </div>
  );
}
