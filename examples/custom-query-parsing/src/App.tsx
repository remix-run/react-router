import * as React from "react";
import { Routes, Route, Link, useSearchParams } from "react-router-dom";
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

function useQuery<T>(key: string): [T | undefined, (newQuery: T) => void] {
  let [search, setSearch] = useSearchParams();
  let searchValue = search.get(key);

  let query = React.useMemo(() => {
    let parsed = JSURL.parse(searchValue);
    return parsed;
  }, [searchValue]);

  let setQuery = React.useCallback(
    (newQuery: T) => {
      setSearch(
        {
          ...search,
          [key]: JSURL.stringify(newQuery)
        },
        { replace: true }
      );
    },
    [key, search, setSearch]
  );

  return [query, setQuery];
}

interface Pizza {
  toppings: string[];
  crust: string;
  extraSauce: boolean;
}

function Home() {
  let [pizza, setPizza] = useQuery<Pizza>("pizza");

  function change(event: React.ChangeEvent<HTMLFormElement>) {
    let form = event.currentTarget;
    let formData = new FormData(form);

    let pizza: Pizza = {
      toppings: formData.getAll("toppings") as string[],
      crust: formData.get("crust") as string,
      extraSauce: formData.get("extraSauce") === "on"
    };

    setPizza(pizza);
  }

  return (
    <div>
      <h1>Custom Query Parse Serialization Example</h1>
      <form onChange={change}>
        <p>
          <label>
            Pepperoni
            <input
              defaultChecked={pizza?.toppings.includes("pepperoni")}
              type="checkbox"
              name="toppings"
              value="pepperoni"
            />
          </label>
          <label>
            Olives
            <input
              type="checkbox"
              name="toppings"
              value="olives"
              defaultChecked={pizza?.toppings.includes("olives")}
            />
          </label>
        </p>
        <p>
          <label>
            Thin Crust
            <input
              type="radio"
              name="crust"
              value="thin"
              defaultChecked={pizza?.crust === "thin"}
            />
          </label>
          <label>
            Regular Crust
            <input
              type="radio"
              name="crust"
              value="regular"
              defaultChecked={pizza?.crust === "regular"}
            />
          </label>
          <label>
            Deep Dish
            <input
              type="radio"
              name="crust"
              value="deep-dish"
              defaultChecked={pizza?.crust === "dish-dish"}
            />
          </label>
        </p>
        <p>
          <label>
            Extra Sauce
            <input
              type="checkbox"
              name="extraSauce"
              defaultChecked={pizza?.extraSauce}
            />
          </label>
        </p>
      </form>

      {pizza && <pre>{JSON.stringify(pizza, null, 2)}</pre>}
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
