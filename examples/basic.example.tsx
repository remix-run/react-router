import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Outlet,
  useParams,
} from "react-router-dom";

export function Example() {
  return (
    <div className="App">
      <Router>
        <nav aria-label="Navigation">
          <ul>
            <li>
              <NavLink to="/blog">Blog</NavLink>
            </li>
            <li>
              <NavLink to="/blog/welcome">Welcome</NavLink>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="blog" element={<Blog />}>
            <Route path=":id" element={<BlogPost />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

function Blog() {
  const { id } = useParams();

  return (
    <div>
      <h1>{id || "Blog"}</h1>
      <hr />
      <Outlet />
    </div>
  );
}

function BlogPost() {
  return (
    <div>
      <p>This is the post</p>
    </div>
  );
}
