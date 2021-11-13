import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { MemoryRouter, Routes, Route } from "react-router";

describe("when the same component is mounted by two different routes", () => {
  it("mounts only once", () => {
    let mountCount = 0;

    class Home extends React.Component {
      componentDidMount() {
        mountCount += 1;
      }
      render() {
        return <h1>Home</h1>;
      }
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="another-home" element={<Home />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);

    expect(mountCount).toBe(1);

    TestRenderer.act(() => {
      renderer.update(
        <MemoryRouter initialEntries={["/another-home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="another-home" element={<Home />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        Home
      </h1>
    `);

    expect(mountCount).toBe(1);
  });
});
