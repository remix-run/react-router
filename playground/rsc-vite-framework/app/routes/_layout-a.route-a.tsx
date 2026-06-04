import { Link } from "react-router";

export default function RouteA() {
  return (
    <div className="flex flex-col items-center">
      HERE IS ROUTE A!!!
      <Link to="/route-b" className="bg-blue-800 text-white px-8 py-1">
        Go to route B
      </Link>
    </div>
  );
}
