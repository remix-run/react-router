import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory } from "history";
import MemoryRouter from "../MemoryRouter";
import Router from "../Router";
import Route from "../Route";

describe("A <Route>", () => {
  it("renders at the root", () => {
    const TEXT = "Mrs. Kato";
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/"]}>
        <Route path="/" render={() => <h1>{TEXT}</h1>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

  it("does not render when it does not match", () => {
    const TEXT = "bubblegum";
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/bunnies"]}>
        <Route path="/flowers" render={() => <h1>{TEXT}</h1>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain(TEXT);
  });

  it("can use a `location` prop instead of `context.router.route.location`", () => {
    const TEXT = "tamarind chutney";
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/mint"]}>
        <Route
          location={{ pathname: "/tamarind" }}
          path="/tamarind"
          render={() => <h1>{TEXT}</h1>}
        />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

  it("supports preact by nulling out children prop when empty array is passed", () => {
    const TEXT = "Mrs. Kato";
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/"]}>
        <Route path="/" render={() => <h1>{TEXT}</h1>}>
          {[]}
        </Route>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

  it("matches using nextContext when updating", () => {
    const node = document.createElement("div");

    let push;
    ReactDOM.render(
      <MemoryRouter initialEntries={["/sushi/california"]}>
        <Route
          path="/sushi/:roll"
          render={({ history, match }) => {
            push = history.push;
            return <div>{match.url}</div>;
          }}
        />
      </MemoryRouter>,
      node
    );
    push("/sushi/spicy-tuna");
    expect(node.innerHTML).toContain("/sushi/spicy-tuna");
  });

  it("throws with no <Router>", () => {
    const node = document.createElement("div");

    spyOn(console, "error");

    expect(() => {
      ReactDOM.render(<Route path="/" render={() => null} />, node);
    }).toThrow(
      /You should not use <Route> or withRouter\(\) outside a <Router>/
    );
  });
});

describe("A <Route> with dynamic segments in the path", () => {
  it("decodes them", () => {
    const node = document.createElement("div");
    ReactDOM.render(
      <MemoryRouter initialEntries={["/a%20dynamic%20segment"]}>
        <Route
          path="/:id"
          render={({ match }) => <div>{match.params.id}</div>}
        />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("a dynamic segment");
  });
});

describe("A unicode <Route>", () => {
  it("is able to match", () => {
    const node = document.createElement("div");
    ReactDOM.render(
      <MemoryRouter initialEntries={["/パス名"]}>
        <Route path="/パス名" render={({ match }) => <div>{match.url}</div>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain("/パス名");
  });
});

describe("<Route render>", () => {
  const history = createMemoryHistory();
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("renders its return value", () => {
    const TEXT = "Mrs. Kato";
    const node = document.createElement("div");
    ReactDOM.render(
      <MemoryRouter initialEntries={["/"]}>
        <Route path="/" render={() => <div>{TEXT}</div>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

  it("receives { match, location, history } props", () => {
    let actual = null;

    ReactDOM.render(
      <Router history={history}>
        <Route path="/" render={props => (actual = props) && null} />
      </Router>,
      node
    );

    expect(actual.history).toBe(history);
    expect(typeof actual.match).toBe("object");
    expect(typeof actual.location).toBe("object");
  });
});

describe("<Route component>", () => {
  const history = createMemoryHistory();
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("renders the component", () => {
    const TEXT = "Mrs. Kato";
    const node = document.createElement("div");
    const Home = () => <div>{TEXT}</div>;
    ReactDOM.render(
      <MemoryRouter initialEntries={["/"]}>
        <Route path="/" component={Home} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

  it("receives { match, location, history } props", () => {
    let actual = null;
    const Component = props => (actual = props) && null;

    ReactDOM.render(
      <Router history={history}>
        <Route path="/" component={Component} />
      </Router>,
      node
    );

    expect(actual.history).toBe(history);
    expect(typeof actual.match).toBe("object");
    expect(typeof actual.location).toBe("object");
  });
});

describe("<Route children>", () => {
  const history = createMemoryHistory();
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("renders a function", () => {
    const TEXT = "Mrs. Kato";
    const node = document.createElement("div");
    ReactDOM.render(
      <MemoryRouter initialEntries={["/"]}>
        <Route path="/" children={() => <div>{TEXT}</div>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

  it("renders a child element", () => {
    const TEXT = "Mrs. Kato";
    const node = document.createElement("div");
    ReactDOM.render(
      <MemoryRouter initialEntries={["/"]}>
        <Route path="/">
          <div>{TEXT}</div>
        </Route>
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

  it("receives { match, location, history } props", () => {
    let actual = null;

    ReactDOM.render(
      <Router history={history}>
        <Route path="/" children={props => (actual = props) && null} />
      </Router>,
      node
    );

    expect(actual.history).toBe(history);
    expect(typeof actual.match).toBe("object");
    expect(typeof actual.location).toBe("object");
  });
});

describe("A <Route exact>", () => {
  it("renders when the URL does not have a trailing slash", () => {
    const TEXT = "bubblegum";
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/somepath/"]}>
        <Route exact path="/somepath" render={() => <h1>{TEXT}</h1>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

});

describe("A <Route exact strict>", () => {
  it("does not render when the URL has a trailing slash", () => {
    const TEXT = "bubblegum";
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/somepath/"]}>
        <Route exact strict path="/somepath" render={() => <h1>{TEXT}</h1>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain(TEXT);
  });

  it("does not render when the URL does not have a trailing slash", () => {
    const TEXT = "bubblegum";
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/somepath"]}>
        <Route exact strict path="/somepath/" render={() => <h1>{TEXT}</h1>} />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).not.toContain(TEXT);
  });
});

describe("with <Route args>", () => {
  const TEXT = "dragon snot";
  const roomTemp = "roomTemp"
  const ARGS = {
    spicy: 0,
    stable: { 
      default: roomTemp,
      required: true,
    },
    sort: {
      pattern: '(stable|spicy|rating)',
    }
  }
  const yesSpicy="ohYesSpicy"
  const testWithArgs = ({path:testPath, ...settings}) => {
    const node = document.createElement("div");
    const renderSettings = settings.render || {};
    	
    if (settings.debug) {
      console.log(`testing route for url: ${testPath}`);
      console.log({renderSettings});
    }
    ReactDOM.render(
      <MemoryRouter initialEntries={[testPath]}>
        <Route
          args={ARGS}
          path="/sauces"
          render={({update,location,history,match,match:{params:{spicy,stable,sort}}}) => {
            if(renderSettings.updater) renderSettings.updater(update)
            return <h1>spicy={spicy}, stable={stable}, sort={sort}</h1>
          }}
        />
      </MemoryRouter>,
      node
    );
    return node;
  }
  it("supports args", () => {
    let node = testWithArgs({path:`/sauces.spicy-${yesSpicy}`});
    expect(node.innerHTML).toContain(yesSpicy);
  });

  it("exposes default args", () => { 
    let node = testWithArgs({path:`/sauces`});
    expect(node.innerHTML).toContain(roomTemp);
    expect(node.innerHTML).toContain("spicy=0");
  });
  
  it("allows defaults to be overridden to empty, unless required", () => {
    let node = testWithArgs({path:`/sauces.spicy-,stable-`});
    expect(node.innerHTML).toContain("spicy=,");
    expect(node.innerHTML).toContain(roomTemp);
  })
  
  describe("args updater", () => {
    it("is supported", () => {
      let updater;
      let node = testWithArgs({path:`/sauces`, render: {updater: (updateFn) => {
        updater = updateFn
      }}});
      expect(updater).toBeTruthy();
      let newPath = updater({spicy:yesSpicy,sort:"rating"})
      expect(newPath).toMatch(`spicy-${yesSpicy}`);
      expect(newPath).toMatch(`sort-rating`);
    });
  })

  describe("with surrounding route context", () => {
    it("exposes args", () => {
      const TEXT = "seafood gumbo";
  
      const node = document.createElement("div");
      let updater;
      let hist;
      ReactDOM.render(
        <MemoryRouter initialEntries={[`/seafood/gumbo.spicy-${yesSpicy}/instance/42`]}>
            <Route
              path="/seafood"
              render={({match:m1}) => <h1>Seafood...
                <Route
                  args={{okra: "true", spicy: "false"}}
                  path={`${m1.url}/gumbo`}
                  render={({match:m2}) => <div>
                    {TEXT} - okra:{m2.params.okra} - spicy:{m2.params.spicy}
                    <Route
                      path={`${m2.url}/instance/:instanceId`}
                      render={({match:m3}) => <ul><li>instance {m3.params.instanceId}</li></ul>}
                    />
                  </div>}
                />
              </h1>}
            />

          </MemoryRouter>,
          node
        );
      expect(node.innerHTML).toContain(TEXT);
      expect(node.innerHTML).toContain("okra:true");
      expect(node.innerHTML).toContain(`spicy:${yesSpicy}`);
      expect(node.innerHTML).toContain(`instance 42`);
    });

    it("supports incremental update() function for args", () => {
      const TEXT = "seafood soup";
  
      const node = document.createElement("div");
      let updater;
      let hist;
      ReactDOM.render(
        <MemoryRouter initialEntries={[`/sea[f]ood/cioppino.spicy-${yesSpicy}/instance/21`]}>
            <Route
              path="/sea[f]ood"
              render={({match:m1, history}) => { hist=history; return <h1>Seafood...
                <Route
                  args={{octopus: "true", spicy: "false"}}
                  path={`${m1.url}/cioppino`}
                  render={({match:m2,update}) => { updater = update; return <div>
                    {TEXT} - octopus:{m2.params.octopus} - spicy:{m2.params.spicy}
                    <Route
                      path={`${m2.url}/instance/:instanceId`}
                      render={({match:m3}) => <ul><li>instance {m3.params.instanceId}</li></ul>}
                    />
                  </div> }}
                />
              </h1> }}
            />

          </MemoryRouter>,
          node
        );
      expect(node.innerHTML).toContain(TEXT);
      expect(node.innerHTML).toContain(`instance 21`);
      expect(node.innerHTML).toContain("octopus:true");

      const newUrl = updater({octopus:"false"});
      expect(newUrl).toMatch("/sea[f]ood")
      expect(newUrl).toMatch('/cioppino')
      expect(newUrl).toMatch(`octopus-false`)
      expect(newUrl).toMatch(`spicy-${yesSpicy}`)
      expect(newUrl).toMatch("instance/21")

      hist.push(newUrl)
      expect(node.innerHTML).toContain(`spicy:${yesSpicy}`);
      expect(node.innerHTML).toContain("octopus:false");
      expect(node.innerHTML).toContain(`instance 21`);
    });

  });

})

describe("A <Route location>", () => {
  it("can use a `location` prop instead of `router.location`", () => {
    const TEXT = "tamarind chutney";
    const node = document.createElement("div");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/mint"]}>
        <Route
          location={{ pathname: "/tamarind" }}
          path="/tamarind"
          render={() => <h1>{TEXT}</h1>}
        />
      </MemoryRouter>,
      node
    );

    expect(node.innerHTML).toContain(TEXT);
  });

  describe("children", () => {
    it("uses parent's prop location", () => {
      const TEXT = "cheddar pretzel";
      const node = document.createElement("div");

      ReactDOM.render(
        <MemoryRouter initialEntries={["/popcorn"]}>
          <Route
            location={{ pathname: "/pretzels/cheddar" }}
            path="/pretzels"
            render={() => (
              <Route path="/pretzels/cheddar" render={() => <h1>{TEXT}</h1>} />
            )}
          />
        </MemoryRouter>,
        node
      );

      expect(node.innerHTML).toContain(TEXT);
    });

    it("continues to use parent's prop location after navigation", () => {
      const TEXT = "cheddar pretzel";
      const node = document.createElement("div");
      let push;
      ReactDOM.render(
        <MemoryRouter initialEntries={["/popcorn"]}>
          <Route
            location={{ pathname: "/pretzels/cheddar" }}
            path="/pretzels"
            render={({ history }) => {
              push = history.push;
              return (
                <Route
                  path="/pretzels/cheddar"
                  render={() => <h1>{TEXT}</h1>}
                />
              );
            }}
          />
        </MemoryRouter>,
        node
      );
      expect(node.innerHTML).toContain(TEXT);
      push("/chips");
      expect(node.innerHTML).toContain(TEXT);
    });
  });
});
