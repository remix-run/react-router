import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { act } from "react-dom/test-utils";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";

describe("navigate with params", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    global.history.pushState({}, "", "/");
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  describe("when navigate params are not already encoded", () => {
    it("correctly encodes the param in the URL and decodes the param when it is used", () => {
      function Start() {
        let navigate = useNavigate();

        React.useEffect(() => {
          navigate("/blog/react router");
        });

        return null;
      }

      function Blog() {
        let params = useParams();
        return <h1>Blog: {params.slug}</h1>;
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Start />} />
              <Route path="blog/:slug" element={<Blog />} />
            </Routes>
          </BrowserRouter>
        );
      });

      expect(window.location.pathname).toEqual("/blog/react%20router");
      expect(node.innerHTML).toMatch(/react router/);
    });
  });

  describe("when navigate params are encoded using +", () => {
    it("does not alter the param encoding in the URL and decodes the param when it is used", () => {
      function Start() {
        let navigate = useNavigate();

        React.useEffect(() => {
          navigate("/blog/react+router");
        });

        return null;
      }

      function Blog() {
        let params = useParams();
        return <h1>Blog: {params.slug}</h1>;
      }

      act(() => {
        ReactDOM.createRoot(node).render(
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Start />} />
              <Route path="blog/:slug" element={<Blog />} />
            </Routes>
          </BrowserRouter>
        );
      });

      // Need to add the + back for JSDom, but normal browsers leave
      // the + in the URL pathname. Should probably report this as a
      // bug in JSDom...
      let pathname = window.location.pathname.replace(/%20/g, "+");
      expect(pathname).toEqual("/blog/react+router");

      // Note decodeURIComponent doesn't decode +
      expect(node.innerHTML).toMatch(/react\+router/);
    });
  });
});
