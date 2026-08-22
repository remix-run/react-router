import { href, Link } from "react-router";

export default function TransactionHomePage() {
  return (
    <div>
      <h1>Transactions Home page</h1>
      <Link to={href("/")}>Root Route</Link>
    </div>
  );
}
