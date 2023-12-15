import { Routes, Route, Outlet, Link, useParams } from "react-router-dom";

export default function App() {
  return (
    <div>
      <h1>Basic Example</h1>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path=":id" element={<About />} />
        </Route>
      </Routes>
    </div>
  );
}

function Layout() {
  // let encoded = "a#b%c".replace(/#/g, "%23");
  let encoded = encodeURIComponent("a#b%c");
  return (
    <div>
      <Link to="/">Home</Link>
      <br />
      <Link to={encoded}>/{encoded}</Link>
      <br />
      <Link to="/bad%20%26%20encoding%20%25%20here">
        /bad%20%26%20encoding%20%25%20here
      </Link>
      <Outlet />
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
  let params = useParams();
  return (
    <div>
      <h2>About</h2>
      <p>{params.id}</p>
      <p>{params.id?.replace(/%23/g, "#")}</p>
    </div>
  );
}
