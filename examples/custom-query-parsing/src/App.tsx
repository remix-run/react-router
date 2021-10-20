import * as React from "react";
import { Routes, Route, Outlet, Link, useSearchParams } from "react-router-dom";
import * as JSURL from "jsurl";

export default function App() {
  return (
    <div>
      <Routes>
        <Route index element={<Home />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </div>
  );
}

function useQuery(): [
  { get(key: string): any },
  (key: string, newQuery: any) => void
] {
  let [search, setSearch] = useSearchParams();

  let query = {
    get(key: string) {
      let searchValue = search.get(key);
      // if (!searchValue) return null;
      return JSURL.parse(searchValue);
    }
  };

  let setQuery = React.useCallback(
    (key: string, newQuery: any) => {
      setSearch({
        ...search,
        [key]: JSURL.stringify(newQuery)
      });
    },
    [search, setSearch]
  );

  return [query, setQuery];
}

function Home() {
  let [query, setQuery] = useQuery();
  let data = query.get("data");

  return (
    <div>
      <h1>Custom Query Parse Serialization Example</h1>
      <button
        type="button"
        onClick={() => {
          setQuery("data", {
            name: "John Doe",
            age: 42,
            children: ["Mary", "Bill"]
          });
        }}
      >
        Stringify data
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
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
