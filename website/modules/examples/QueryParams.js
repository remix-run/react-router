import React from "react";
import { BrowserRouter as Router, Link } from "react-router-dom";
import { parse, stringify } from "query-string";

const ParamsExample = props => {
  const urlParams = parse(props.location.search);

  return (
    <Router>
      <p>
        React Router no longer handles query parameters in URLs. You will need
        to use a 3rd-party library to handle them. Below is an example using the{" "}
        <a href="https://github.com/sindresorhus/query-string">query-string</a>{" "}
        library.
      </p>
      <p>
        <em>
          This is only an example of one such library. You are free to use any
          library for working with query parameters that provides the
          functionality you are looking for.
        </em>
      </p>
      <div>
        <h2>Accounts</h2>
        <ul>
          <li>
            <Link
              to={{
                pathname: "/account",
                search: stringify({ name: "netflix" })
              }}
            >
              Netflix
            </Link>
          </li>
          <li>
            <Link
              to={{
                pathname: "/account",
                search: stringify({ name: "zillow-group" })
              }}
            >
              Zillow Group
            </Link>
          </li>
          <li>
            <Link
              to={{
                pathname: "/account",
                search: stringify({ name: "yahoo" })
              }}
            >
              Yahoo
            </Link>
          </li>
          <li>
            <Link
              to={{
                pathname: "/account",
                search: stringify({ name: "modus-create" })
              }}
            >
              Modus Create
            </Link>
          </li>
        </ul>

        {urlParams && urlParams.name && <Child name={urlParams.name} />}
      </div>
    </Router>
  );
};

const Child = ({ name }) => (
  <div>
    <h3>NAME: {name}</h3>
  </div>
);

export default ParamsExample;
