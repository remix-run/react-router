import { Routes, Route } from "react-router-dom";
import {Layout} from '../shared/layout'
import {NoMatch} from '../shared/no-match'
import "../shared/index.css";

export default function HomeApp() {
  return (
    <div>
      <h1>Welcome to the Home app!</h1>

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
  );
}

function Home() {
  return <p>Not much going on in this one, checkout the <a href="/feed">feed</a> or the <a href="/profile">profile</a> apps</p>
}
