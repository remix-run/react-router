import React from "react";
import { BrowserRouter as Router, Link, Route } from "react-router-dom";

export default function QueryParamsExample() {
  return (
    <Router>
      <Route component={QueryParamsDemo} />
    </Router>
  );
}

function QueryParamsDemo({ location }) {
  let params = new URLSearchParams(location.search);

  return (
    <div>
      <p>
        React Router does not have any opinions about how your parse URL query
        strings. Some applications use simple key=value query strings, but
        others embed arrays and objects in the query string. So it's up to you
        to parse the search string yourself.
      </p>
      <p>
        In modern browsers that support{" "}
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/URL">
          the URL API
        </a>
        , you can instantiate a <code>URLSearchParams</code> object from{" "}
        <code>location.search</code> and use that.
      </p>
      <p>
        In{" "}
        <a href="https://caniuse.com/#feat=url">
          browsers that do not support the URL API (read: IE)
        </a>{" "}
        you can use a 3rd party library such as{" "}
        <a href="https://github.com/sindresorhus/query-string">query-string</a>.
      </p>
      <div>
        <h2>Accounts</h2>
        <ul>
          <li>
            <Link to={{ pathname: "/account", search: "?name=netflix" }}>
              Netflix
            </Link>
          </li>
          <li>
            <Link to={{ pathname: "/account", search: "?name=zillow-group" }}>
              Zillow Group
            </Link>
          </li>
          <li>
            <Link to={{ pathname: "/account", search: "?name=yahoo" }}>
              Yahoo
            </Link>
          </li>
          <li>
            <Link to={{ pathname: "/account", search: "?name=modus-create" }}>
              Modus Create
            </Link>
          </li>
        </ul>

        <Child name={params.get("name")} />
      </div>
    </div>
  );
}

function Child({ name }) {
  return (
    <div>
      {name ? (
        <h3>
          The <code>name</code> in the query string is "{name}"
        </h3>
      ) : (
        <h3>There is no name in the query string</h3>
      )}
    </div>
  );
}
