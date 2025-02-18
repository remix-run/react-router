import { Link, type MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <ul>
        <li>
          <Link to="/splittable">Splittable route</Link>
        </li>
        <li>
          <Link to="/unsplittable">Unsplittable route</Link>
        </li>
        <li>
          <Link to="/semi-splittable">Semi-splittable route</Link>
        </li>
      </ul>
    </div>
  );
}
