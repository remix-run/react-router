import { Routes, Route, Link } from "react-router-dom";
import {Layout} from '../shared/layout'
import "../shared/index.css";

export default function ProfileApp() {
  return (
    <div>
      <h1>Welcome to the Profile app!</h1>

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Profile />} />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
  );
}

function Profile() {
  return (
    <div>
      <h2>My Profile</h2>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px"
      }}>

      <img
        style={{borderRadius: "50%"}}
        width={300}
        height={300}
        src="https://avatars.githubusercontent.com/u/11698668?v=4" alt="Logan McAnsh"
      />
      <div>

      <h1>Logan McAnsh</h1>
      <pre>Software Engineer @remix-run</pre>
      </div>
      </div>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
