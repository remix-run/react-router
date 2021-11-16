import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom";

describe("useSearchParams", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  describe("get and set", () => {
    function SearchPage() {
      let queryRef = React.useRef<HTMLInputElement>(null);
      let [searchParams, setSearchParams] = useSearchParams({ q: "" });
      let query = searchParams.get("q")!;

      function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (queryRef.current) {
          setSearchParams({ q: queryRef.current.value });
        }
      }

      return (
        <div>
          <p>The current query is "{query}".</p>
          <form onSubmit={handleSubmit}>
            <input name="q" defaultValue={query} ref={queryRef} />
          </form>
        </div>
      );
    }

    it("reads and writes the search string", () => {
      act(() => {
        ReactDOM.render(
          <MemoryRouter initialEntries={["/search?q=Michael+Jackson"]}>
            <Routes>
              <Route path="search" element={<SearchPage />} />
            </Routes>
          </MemoryRouter>,
          node
        );
      });

      let form = node.querySelector("form")!;
      expect(form).toBeDefined();

      let queryInput = node.querySelector<HTMLInputElement>("input[name=q]")!;
      expect(queryInput).toBeDefined();

      expect(node.innerHTML).toMatch(/The current query is "Michael Jackson"/);

      act(() => {
        queryInput.value = "Ryan Florence";
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      });

      expect(node.innerHTML).toMatch(/The current query is "Ryan Florence"/);
    });
  });

  describe("update function", () => {
    function ParamsPage() {
      let aRef = React.useRef<HTMLInputElement>(null);
      let bRef = React.useRef<HTMLInputElement>(null);
      let [searchParams, setSearchParams] = useSearchParams();
      let a = searchParams.get("a")!;
      let b = searchParams.get("b")!;

      const handleSubmit = React.useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (aRef.current) {
            setSearchParams(params => params.set("a", aRef.current.value));
          }
          if (bRef.current) {
            setSearchParams(params => ({
              a: params.get("a"),
              b: bRef.current.value
            }));
          }
        },
        [setSearchParams]
      );

      return (
        <div>
          <p>
            The current params are "{a}" and "{b}".
          </p>
          <form onSubmit={handleSubmit}>
            <input name="a" defaultValue={a} ref={aRef} />
            <input name="b" defaultValue={b} ref={bRef} />
          </form>
        </div>
      );
    }

    it("writes search string with correctly updated state", () => {
      act(() => {
        ReactDOM.render(
          <MemoryRouter initialEntries={["/params?a=Simon&b=Garfunkel"]}>
            <Routes>
              <Route path="params" element={<ParamsPage />} />
            </Routes>
          </MemoryRouter>,
          node
        );
      });

      let form = node.querySelector("form")!;
      expect(form).toBeDefined();

      let aInput = node.querySelector<HTMLInputElement>("input[name=a]")!;
      expect(aInput).toBeDefined();

      let bInput = node.querySelector<HTMLInputElement>("input[name=b]")!;
      expect(bInput).toBeDefined();

      expect(node.innerHTML).toMatch(
        /The current params are "Simon" and "Garfunkel"/
      );

      act(() => {
        aInput.value = "Bert";
        bInput.value = "Ernie";
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      });

      expect(node.innerHTML).toMatch(
        /The current params are "Bert" and "Ernie"/
      );
    });
  });
});
