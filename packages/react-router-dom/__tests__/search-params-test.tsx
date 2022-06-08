import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom";

describe("useSearchParams", () => {
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

  function SearchPageFunctionalUpdate() {
    let queryRef = React.useRef<HTMLInputElement>(null);
    let [searchParams, setSearchParams] = useSearchParams({
      d: "Ryan",
    });
    let queryD = searchParams.get("d")!;
    let queryQ = searchParams.get("q")!;

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (queryRef.current) {
        setSearchParams((cur) => {
          let d = cur.get("d");
          cur.set("d", d + " Florence");
          cur.delete("q");
          return cur;
        });
      }
    }

    return (
      <div>
        <p>
          d: {queryD}, q: {queryQ}
        </p>
        <form onSubmit={handleSubmit}>
          <input name="q" defaultValue={queryQ} ref={queryRef} />
        </form>
      </div>
    );
  }

  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

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
      queryInput.value = " Florence";
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    });

    expect(node.innerHTML).toMatch(/The current query is "Ryan Florence"/);
  });

  it("updates searchParams when a function is provided to setSearchParams (functional updates)", () => {
    act(() => {
      ReactDOM.render(
        <MemoryRouter initialEntries={["/search?q=UrlValue"]}>
          <Routes>
            <Route path="search" element={<SearchPageFunctionalUpdate />} />
          </Routes>
        </MemoryRouter>,
        node
      );
    });

    let form = node.querySelector("form")!;
    expect(form).toBeDefined();

    let queryInput = node.querySelector<HTMLInputElement>("input[name=q]")!;
    expect(queryInput).toBeDefined();

    expect(node.innerHTML).toMatch(/d: Ryan, q: UrlValue/);

    act(() => {
      queryInput.value = "Ryan Florence";
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    });

    expect(node.innerHTML).toMatch(/d: Ryan Florence, q: /);
  });
});
