import { href, Link } from "react-router";

export default function UserManagementHomePage() {
  return (
    <div>
      <h1>User Management Home page</h1>
      <Link to={href("/")}>Root Route</Link>
    </div>
  );
}
