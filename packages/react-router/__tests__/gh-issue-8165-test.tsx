import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
  useParams,
  useNavigate,
  Navigate,
} from "react-router-dom";

describe("GH Issue #8165", () => {
  it("works", () => {
    const Content = () => {
      return (
        <div>
          <h3>Level 2</h3>
          <Routes>
            <Route path="tab" element={<span>TAB TEST</span>} />
            <Route index element={<Navigate to="tab" />} />
          </Routes>
          <div>Other:</div>
          <Routes>
            <Route path="*" element={<span>TAB TEST</span>} />
          </Routes>
        </div>
      );
    };

    const Root = () => {
      const { lang } = useParams();
      const nav = useNavigate();
      React.useEffect(() => {
        if (lang !== "en") {
          nav("en");
        }
      }, [lang, nav]);

      return (
        <>
          <h2>Level 1</h2>
          <Routes>
            <Route path="*" element={<Content />} />
          </Routes>
        </>
      );
    };

    function App() {
      return (
        <div className="App">
          <h1>Level 0</h1>
          <Routes>
            <Route path="*" element={<Root />} />
            <Route path=":lang/*" element={<Root />} />
          </Routes>
        </div>
      );
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/en/tab"]}>
          <App />
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div
        className="App"
      >
        <h1>
          Level 0
        </h1>
        <h2>
          Level 1
        </h2>
        <div>
          <h3>
            Level 2
          </h3>
          <span>
            TAB TEST
          </span>
          <div>
            Other:
          </div>
          <span>
            TAB TEST
          </span>
        </div>
      </div>
    `);
  });
});
