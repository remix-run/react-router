import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import type { NavigateFunction } from "react-router";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router";

describe("useNavigate", () => {
  it("returns the navigate function", () => {
    let navigate!: NavigateFunction;
    function Home() {
      navigate = useNavigate();
      return null;
    }

    createTestRenderer(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </MemoryRouter>
    );

    expect(navigate).toBeInstanceOf(Function);
  });
});
