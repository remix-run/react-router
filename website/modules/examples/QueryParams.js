import React from "react";
import { BrowserRouter as Router, Link } from "react-router-dom";
import { parse as Parse, stringify as Stringify } from "query-string";

const ParamsExample = props => {
  const urlParams = Parse(props.location.search);

  return (
    <Router>
      <p>
        React Router v4 no longer includes its own query parameter
        functionality. Instead you will want to include a library that provides
        the functionality that you need. Below is an example using the{" "}
        <a
          href="https://github.com/sindresorhus/query-string"
          target="_blank"
          rel="noreferrer noopener"
        >
          query-string
        </a>{" "}
        library.
      </p>
      <p>
        <em>
          Again, this is only an example! You are free to use any library for
          working with URL parameters that provides the functionality you are
          looking for!
        </em>
      </p>
      <div>
        <h2>Accounts</h2>
        <ul>
          <li>
            <Link
              to={{
                pathname: "/account",
                search: Stringify({ name: "netflix" })
              }}
            >
              Netflix
            </Link>
          </li>
          <li>
            <Link
              to={{
                pathname: "/account",
                search: Stringify({ name: "zillow-group" })
              }}
            >
              Zillow Group
            </Link>
          </li>
          <li>
            <Link
              to={{
                pathname: "/account",
                search: Stringify({ name: "yahoo" })
              }}
            >
              Yahoo
            </Link>
          </li>
          <li>
            <Link
              to={{
                pathname: "/account",
                search: Stringify({ name: "modus-create" })
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
