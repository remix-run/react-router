/**
 * Just copied over the link click test as a quick smoke test that it's working
 * the same as v6 proper.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Switch, MemoryRouter, Link } from "react-router-dom";
import { useNavigate } from "../index";

import { act } from "react-dom/test-utils";
import { CompatRoute, CompatRouter } from "../index";

function click(anchor: HTMLAnchorElement, eventInit?: MouseEventInit) {
  let event = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
    ...eventInit,
  });
  anchor.dispatchEvent(event);
  return event;
}

describe("A compat route <Link> click", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  it("navigates to the new page", () => {
    function Home() {
      
      const navigate = useNavigate();
      const onAboutClick = () => {
        navigate("/details/about");
      }
      return (
        <div>
          <h1>Home</h1>
          <Link to='/details/about'>About</Link>
        </div>
      );
    };

    function Details() {
      return (
        <div>
          <h1>Details</h1>
          <CompatRoute path='/details/about' render={() => <h2>About</h2>}/>
        </div>
      );
    };
  
    act(() => {
      ReactDOM.render(
        <MemoryRouter initialEntries={["/home"]}>
          <CompatRouter>
            <Switch>
              <CompatRoute path="/home" render={(props) => <Home {...props}/>} />
              <CompatRoute path="/details" render={(props) => <Details {...props}/>} />
            </Switch>
          </CompatRouter>
        </MemoryRouter>,
        node
      );
    });

    let anchor = node.querySelector("a");
    expect(anchor).not.toBeNull();

    let event: MouseEvent;
    act(() => {
      event = click(anchor);
    });

    expect(event.defaultPrevented).toBe(true);
    let h1 = node.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toEqual("Details");

    let h2 = node.querySelector("h2");
    expect(h2).not.toBeNull();
    expect(h2?.textContent).toEqual("About");
  });
});
