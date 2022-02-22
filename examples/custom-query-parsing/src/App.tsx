import * as React from "react";
import * as JSURL from "jsurl";
import type { NavigateOptions } from "react-router-dom";
import { Routes, Route, Link, useSearchParams } from "react-router-dom";

export default function App() {
  return (
    <div>
      <h1>Custom Query Parsing Example</h1>

      <p>
        This example demonstrates how to store a complex data structure in a URL
        query parameter.
      </p>

      <p>
        Each time a field in the form below changes, the URL is updated with a
        serialized version of the form's values. To see the effect this has,
        manipulate some fields in the form. Then, copy the URL in the address
        bar and paste it into a new tab in your browser to see the form in the
        exact same state as when you left it!
      </p>

      <Routes>
        <Route index element={<Home />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </div>
  );
}

/**
 * This custom hook is a wrapper around `useSearchParams()` that parses and
 * serializes the search param value using the JSURL library, which permits any
 * JavaScript value to be safely URL-encoded.
 *
 * It's a good example of how React hooks offer a great deal of flexibility when
 * you compose them together!
 *
 * TODO: rethink the generic type here, users can put whatever they want in the
 * URL, probably best to use runtime validation with a type predicate:
 * https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 */
function useQueryParam<T>(
  key: string
): [T | undefined, (newQuery: T, options?: NavigateOptions) => void] {
  let [searchParams, setSearchParams] = useSearchParams();
  let paramValue = searchParams.get(key);

  let value = React.useMemo(() => JSURL.parse(paramValue), [paramValue]);

  let setValue = React.useCallback(
    (newValue: T, options?: NavigateOptions) => {
      let newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(key, JSURL.stringify(newValue));
      setSearchParams(newSearchParams, options);
    },
    [key, searchParams, setSearchParams]
  );

  return [value, setValue];
}

interface Pizza {
  toppings: string[];
  crust: string;
  extraSauce: boolean;
}

function Home() {
  let [pizza, setPizza] = useQueryParam<Pizza>("pizza");

  if (!pizza) {
    pizza = { toppings: [], crust: "regular", extraSauce: false };
  }

  function handleChange(event: React.ChangeEvent<HTMLFormElement>) {
    let form = event.currentTarget;
    let formData = new FormData(form);

    // This complex data structure is preserved in the URL in the
    // `pizza` query parameter each time a value in the form changes!
    let pizza: Pizza = {
      toppings: formData.getAll("toppings") as string[],
      crust: formData.get("crust") as string,
      extraSauce: formData.get("extraSauce") === "on",
    };

    setPizza(pizza, { replace: true });
  }

  return (
    <div>
      <form onChange={handleChange}>
        <p>What would you like on your pizza?</p>

        <p>
          <label>
            <input
              defaultChecked={pizza.toppings.includes("pepperoni")}
              type="checkbox"
              name="toppings"
              value="pepperoni"
            />{" "}
            Pepperoni
          </label>
          <br />
          <label>
            <input
              defaultChecked={pizza.toppings.includes("bell-peppers")}
              type="checkbox"
              name="toppings"
              value="bell-peppers"
            />{" "}
            Bell Peppers
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              name="toppings"
              value="olives"
              defaultChecked={pizza.toppings.includes("olives")}
            />{" "}
            Olives
          </label>
        </p>

        <p>
          <label>
            <input
              type="radio"
              name="crust"
              value="regular"
              defaultChecked={pizza.crust === "regular"}
            />{" "}
            Regular Crust
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="crust"
              value="thin"
              defaultChecked={pizza.crust === "thin"}
            />{" "}
            Thin Crust
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="crust"
              value="deep-dish"
              defaultChecked={pizza.crust === "deep-dish"}
            />{" "}
            Deep Dish
          </label>
        </p>

        <p>
          <label>
            <input
              type="checkbox"
              name="extraSauce"
              defaultChecked={pizza.extraSauce}
            />{" "}
            Extra Sauce
          </label>
        </p>
      </form>

      <hr />

      <p>The current form values are:</p>

      <pre>{JSON.stringify(pizza || {}, null, 2)}</pre>
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
