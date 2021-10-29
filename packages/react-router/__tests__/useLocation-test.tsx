import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";

describe("useLocation", () => {
  it("returns the current location object", () => {
    let location!: ReturnType<typeof useLocation>;
    function Home() {
      location = useLocation();
      return <h1>Home</h1>;
    }

    TestRenderer.act(() => {
      TestRenderer.create(
        <MemoryRouter initialEntries={["/home?the=search#the-hash"]}>
          <Routes>
            <Route path="/home" element={<Home />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(typeof location).toBe("object");
    expect(location).toMatchObject({
      pathname: "/home",
      search: "?the=search",
      hash: "#the-hash"
    });
  });
});
