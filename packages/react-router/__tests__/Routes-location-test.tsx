import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter, Route, Routes, useParams } from "react-router";

describe("<Routes> with a location", () => {
  function Home() {
    return <h1>Home</h1>;
  }

  function User() {
    let { userId } = useParams();
    return (
      <div>
        <h1>User: {userId}</h1>
      </div>
    );
  }

  it("matches when the location is overridden", () => {
    const location = {
      pathname: "/home",
      search: "",
      hash: "",
      state: null,
      key: "r9qntrej"
    };

    const renderer = createTestRenderer(
      <MemoryRouter initialEntries={["/users/michael"]}>
        <Routes location={location}>
          <Route path="home" element={<Home />} />
          <Route path="users/:userId" element={<User />} />
        </Routes>
      </MemoryRouter>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
     <h1>
       Home
     </h1>
    `);
  });

  it("matches when the location is not overridden", () => {
    const renderer = createTestRenderer(
      <MemoryRouter initialEntries={["/users/michael"]}>
        <Routes>
          <Route path="home" element={<Home />} />
          <Route path="users/:userId" element={<User />} />
        </Routes>
      </MemoryRouter>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <h1>
          User: 
          michael
        </h1>
      </div>
    `);
  });
});
