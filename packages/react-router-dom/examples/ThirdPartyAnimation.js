// Basic transitions with react-tiger-transition
//
// Check the docs and demo:
// https://pedrobern.github.io/react-tiger-transition/
//
// This example illustrates:
// - default transitions
// - transitions on <Link /> (on login and menu component)
// - transiitons on <Route /> (on menu component)
// - reaching a path with different transitions (the home path),
//   based from which path did you come from.

import React from "react";

import { BrowserRouter as Router, Switch } from "react-router-dom";

import {
  Route as TigerRoute,
  Link as TigerLink,
  Navigation,
  shuffle,
  fade
} from "react-tiger-transition";

import "react-tiger-transition/styles/main.min.css";

// inject transitions css
shuffle({
  name: "shuffle-top",
  direction: "top"
});
shuffle({
  name: "shuffle-bottom",
  direction: "bottom",
  easing: "easeInOutCubic"
});
fade({
  name: "fade",
  easing: "easeInOutCubic"
});

const menuStyle = { style: { height: 100 } };
const loginStyle = { style: { backgroundColor: "#9e9e9e" } };
const pagesStyle = color => ({
  style: {
    top: 100,
    backgroundColor: color
  }
});

const pages = [
  {
    path: "/",
    backgroundColor: "#2196f3",
    component: <Home />
  },
  {
    path: "/about",
    backgroundColor: "#8bc34a",
    component: <About />
  },
  {
    path: "/dashboard",
    backgroundColor: "#ff9800",
    component: <Dashboard />
  },
  {
    path: "/login",
    component: <Login />
  }
];

// set the height of <Navigation /> (better to do this on your stylesheet)
document.getElementById("root").style.height = "100vh";

export default function BasicExample() {
  return (
    <Router>
      <Navigation
        globalTransitionProps={{
          classNames: "fade" // defining default transition
          // default timeout is 600ms
        }}
      >
        <TigerRoute
          path={["/", "/about", "/dashboard"]}
          exact
          screen
          containerProps={{ ...menuStyle }}
          transitionProps={{
            classNames: "shuffle-bottom"
          }}
        >
          <Menu />
        </TigerRoute>
        {pages.map(page => (
          <TigerRoute
            key={page.path}
            exact
            path={page.path}
            screen
            containerProps={
              page.path === "/login"
                ? { ...loginStyle }
                : pagesStyle(page.backgroundColor)
            }
          >
            {page.component}
          </TigerRoute>
        ))}
      </Navigation>
    </Router>
  );
}

function Menu() {
  return (
    <div>
      <ul>
        <li>
          <TigerLink to="/">Home</TigerLink>
        </li>
        <li>
          <TigerLink to="/about">About</TigerLink>
        </li>
        <li>
          <TigerLink to="/dashboard">Dashboard</TigerLink>
        </li>
        <li>
          <TigerLink to="/login" transition="shuffle-top">
            Login*
          </TigerLink>
        </li>
      </ul>

      <hr />
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

function About() {
  return (
    <div>
      <h2>About</h2>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
    </div>
  );
}

function Login() {
  return (
    <div>
      <h2>Login</h2>
      <TigerLink to="/" transition="shuffle-top">
        Home
      </TigerLink>
    </div>
  );
}
