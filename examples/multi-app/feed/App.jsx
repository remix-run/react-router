import { Routes, Route, Outlet, Link } from "react-router-dom";
import "./index.css";

export default function FeedApp() {
  return (
    <div>
      <h1>Welcome to the Feed app!</h1>

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Feed />} />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
  );
}

function Layout() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <a href="/profile">Profile (different app)</a>
          </li>
        </ul>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
}

let data = [
 {
    id: "1",
    username: "mjackson",
    repo: "remix-run/react-router",
    action: "commented on pull request",
    text: "Let's keep the catch-all route too!",
    timestamp: "7 hours ago",
 },
 {
    id: "2",
    username: "jacob-ebey",
    repo: "remix-run/remix",
    action: "opened a pull request",
    text: "feat: throw invalid request methods to catch boundary #299",
    timestamp: "15 hours ago"
 }
]

function Feed() {
  return (
    <div>
      <h2>Feed</h2>

      {data.map(item => (
        <div key={item.id} style={{borderBottom: '1px solid #eaeaea'}}>
          <span style={{fontWeight: 600}}>{item.username}</span> {item.action} <span style={{fontWeight: 600}}>{item.repo}</span>

        <div>
  <span><span style={{fontWeight: 600}}>{item.username}</span> {item.action} {item.timestamp}</span>
  <span>{item.text}</span>
</div>
        </div>
      ))}
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
