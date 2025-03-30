import * as React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Blocker,
  Link,
  Outlet,
  RouterProvider,
  createHashRouter,
  useBlocker,
  useLocation,
} from "react-router";

const Confirm: React.FC<{ blocker: Blocker }> = ({ blocker }) => {
  const blocked = blocker.state === "blocked";
  return blocked ? (
    <div>
      <button onClick={() => blocker.reset()}>CANCEL</button>
      <button data-testid="bttnConfirm" onClick={() => blocker.proceed()}>
        CONFIRM
      </button>
    </div>
  ) : null;
};

describe("useBlocker", () => {
  it("is defensive against an unstable router object", async () => {
    const A: React.FC<{ foo: boolean }> = ({ foo }) => {
      return (
        <>
          <h2>A</h2>
          <Link to={"/"}>TO HOME</Link>
          <span data-testid="spanPageADisplayFoo">{`foo: ${foo}`}</span>
        </>
      );
    };

    const B: React.FC<{
      setFoo: React.Dispatch<React.SetStateAction<boolean>>;
    }> = ({ setFoo }) => {
      let blocker = useBlocker(true);
      return (
        <>
          <h2>B</h2>
          <Link data-testid="linkBToHome" to={"/"}>
            TO HOME
          </Link>
          <span
            data-testid="spanReconstructRouter"
            style={{
              color: "blue",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={() => setFoo((foo) => !foo)}
          >
            {"click to re-construct router"}
          </span>
          <Confirm blocker={blocker} />
        </>
      );
    };

    const Root: React.FC = () => {
      const location = useLocation();
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h1>ROOT</h1>
          <div data-testid="location">{location.pathname}</div>
          <Outlet />
        </div>
      );
    };

    const TestUnstableRouterObject: React.FC = () => {
      const [foo, setFoo] = React.useState<boolean>(false);
      const router = React.useMemo(() => {
        console.log("reconstructing router... foo is: ", foo);
        return createHashRouter([
          {
            path: "/",
            Component: Root,
            children: [
              {
                index: true,
                element: (
                  <>
                    <h1>HOME</h1>
                    <Link data-testid="linkToPageA" to={"/a"}>
                      TO PAGE A
                    </Link>
                    <Link data-testid="linkToPageB" to={"/b"}>
                      TO PAGE B
                    </Link>
                  </>
                ),
              },
              {
                path: "a",
                element: <A foo={foo} />,
              },
              {
                path: "b",
                element: <B setFoo={setFoo} />,
              },
            ],
          },
        ]);
      }, [foo]);

      return <RouterProvider router={router} />;
    };

    render(<TestUnstableRouterObject />);

    let expectLocation = (location: string) =>
      expect(
        screen.getByTestId<HTMLDivElement>("location").textContent
      ).toEqual(location);

    expectLocation("/");

    await userEvent.click(screen.getByTestId("linkToPageB"));
    expectLocation("/b");

    await userEvent.click(
      screen.getByTestId<HTMLSpanElement>("spanReconstructRouter")
    );
    await userEvent.click(screen.getByTestId("linkBToHome"));

    await userEvent.click(screen.getByTestId<HTMLButtonElement>("bttnConfirm"));
    expectLocation("/");

    await userEvent.click(screen.getByTestId("linkToPageA"));
    expectLocation("/a");

    expect(
      screen.getByTestId<HTMLSpanElement>("spanPageADisplayFoo").textContent
    ).toEqual("foo: true");
  });
});
