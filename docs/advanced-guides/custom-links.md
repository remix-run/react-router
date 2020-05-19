# Creating your own custom link

Very often you need to track the current active route and apply some styling to show it. 
With the new `useMatch` hook you can create a component and check whether a given path matches the current url.
You can use `useMatch` hook anywhere you need to match a given path to url.


```js
import React from "react";
import { Routes, Route, useMatch, Link } from "react-router-dom";

function App() {
  return (
    <div>
      <CustomLink label="Home" path="/" />
      <CustomLink label="About" path="/about" />
      <hr />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

interface CustomLinkProps {
  path: string;
  label: React.ReactNode;
}

function CustomLink({ path, label }: CustomLinkProps) {
// useMatch hook accepts a path argument which return true if it matches the url and false otherwise
  const isActiveRoute = useMatch(path);

  return (
    <div className={isActiveRoute ? "active-class" : ""}>
      {isActiveRoute && "->"} <Link to={path}>{label}</Link>
    </div>
  );
}

function Home() {
  return (
    <div>
       <h1>Home</h1>
    </div>
  );
}

function About() {
  return (
    <div>
      <h1>About</h1>
    </div>
  );
}
```
