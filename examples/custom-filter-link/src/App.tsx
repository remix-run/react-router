import * as React from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useSearchParams,
  useParams
} from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import VisuallyHidden from "@reach/visually-hidden";

import { brands, filterByBrand, getSneakerById } from "./snkrs";

export default function App() {
  return (
    <div>
      <h1>Welcome to the app!</h1>

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SneakerGrid />} />
          <Route path="/sneakers/:id" element={<SneakerView />} />
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
        <h3>Filter by brand</h3>
        <ul>
          <li>
            <Link to="/">All</Link>
          </li>
          {brands.map(brand => (
            <li key={brand}>
              <BrandLink brand={brand}>{brand}</BrandLink>
            </li>
          ))}
        </ul>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
}

function SneakerGrid() {
  let [searchParams] = useSearchParams();
  let brand = searchParams.get("brand");
  return (
    <main>
      <h2>Sneakers</h2>

      <div>
        {filterByBrand(brand).map(snkr => {
          let name = `${snkr.brand} ${snkr.model} ${snkr.colorway}`;
          return (
            <div key={snkr.id} style={{ position: "relative" }}>
              <img width={200} height={200} src={snkr.imageUrl} alt={name} />
              <Link
                style={{ position: "absolute", inset: 0 }}
                to={`/sneakers/${snkr.id}`}
              >
                <VisuallyHidden>{name}</VisuallyHidden>
              </Link>
              <div>
                <p>{name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

interface BrandLinkProps extends Omit<LinkProps, "to"> {
  brand: string;
}

const BrandLink: React.FC<BrandLinkProps> = ({ brand, children, ...props }) => {
  let [searchParams] = useSearchParams();
  let isActive = searchParams.get("brand") === brand;

  return (
    <Link
      to={`?brand=${brand}`}
      {...props}
      style={{
        ...props.style,
        color: isActive ? "red" : "black"
      }}
    >
      {children}
    </Link>
  );
};

function SneakerView() {
  let { id } = useParams<"id">();

  if (!id) {
    return <NoMatch />;
  }

  let snkr = getSneakerById(id);

  if (!snkr) {
    return <NoMatch />;
  }

  let name = `${snkr.brand} ${snkr.model} ${snkr.colorway}`;

  return (
    <div>
      <h2>{name}</h2>
      <img width={200} height={200} src={snkr.imageUrl} alt={name} />
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
