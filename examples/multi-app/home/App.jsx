import { Routes, Route } from "react-router-dom";
import { Layout } from "../shared/layout";
import { NoMatch } from "../shared/no-match";
import "../shared/index.css";

export default function HomeApp() {
  return (
    <Routes>
      <Route path="/" element={<Layout app="Home" />}>
        <Route index element={<Home />} />
        <Route path="*" element={<NoMatch />} />
      </Route>
    </Routes>
  );
}

function Home() {
  return (
    <div>
      <p>This is the home page.</p>
    </div>
  );
}
