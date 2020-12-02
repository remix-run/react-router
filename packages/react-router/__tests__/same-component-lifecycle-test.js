import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter as Router, Routes, Route } from "react-router";

describe("when the same component is mounted by two different routes", () => {
  let node;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null;
  });

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

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="another-home" element={<Home />} />
          </Routes>
        </Router>,
        node
      );
    });

    expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
    expect(mountCount).toBe(1);

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/another-home"]}>
          <Routes>
            <Route path="home" element={<Home />} />
            <Route path="another-home" element={<Home />} />
          </Routes>
        </Router>,
        node
      );
    });

    expect(node.innerHTML).toMatchInlineSnapshot(`"<h1>Home</h1>"`);
    expect(mountCount).toBe(1);
  });
});
