import React from "react";
import ReactDOM from "react-dom";
import { kebabCase } from "lodash";
import { resolvePath } from "react-router";
import { createBrowserHistory } from "history";
import type { BrowserHistory } from "history";
import "./index.css";

const apps = ["Basic", "Animation"] as const;
type ExampleApp = typeof apps[number];

const Ctx = React.createContext<any>(null);

function Main() {
  let [app, setApp] = React.useState<ExampleApp | null>(null);
  let historyRef = React.useRef<BrowserHistory>();
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window });
  }

  return (
    <Ctx.Provider value={{ setApp, app }}>
      <Layout>
        {app ? (
          <React.Suspense fallback={null}>
            <React.Fragment key={app}>
              {React.createElement(
                React.lazy(() =>
                  app
                    ? import(`./apps/${kebabCase(app)}/app`)
                    : Promise.reject("wtf!")
                )
              )}
            </React.Fragment>
          </React.Suspense>
        ) : null}
      </Layout>
    </Ctx.Provider>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="root-layout">
      <header className="root-layout__header">
        <div className="root-layout__header-inner">
          <ExampleList />
        </div>
      </header>
      <main className="root-layout__main">
        <div className="root-layout__inner">{children}</div>
      </main>
    </div>
  );
}

function ExampleList() {
  let { setApp, app: selectedApp } = React.useContext(Ctx);
  let isWideScreen = useMediaQuery("screen and (min-width: 600px)");
  let navigate = useNavigate(selectedApp);

  function handleAppSelect(nextApp: ExampleApp) {
    setApp((previousApp: any) => {
      if (previousApp !== nextApp) {
        navigate("/");
      }
      return nextApp;
    });
  }

  return (
    <div>
      {isWideScreen ? (
        <ul>
          {apps.map(app => {
            return (
              <li key={app}>
                <button
                  style={{
                    outline:
                      app === selectedApp ? `2px solid crimson` : undefined
                  }}
                  onClick={() => {
                    handleAppSelect(app);
                  }}
                >
                  {app}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <select
          value={selectedApp || "none"}
          onChange={event => {
            let value = event.target.value as any;
            if (apps.includes(value)) {
              handleAppSelect(value);
            }
          }}
        >
          <option value="none" disabled>
            Please select an app
          </option>
          {apps.map(app => (
            <option value={app} key={app}>
              {app}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
  document.getElementById("root")
);

function useMediaQuery(query: string) {
  let [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    let mql = window.matchMedia(query);
    mql.addEventListener("change", listener);
    setMatches(mql.matches);
    return () => {
      mql.removeEventListener("change", listener);
    };
    function listener(event: MediaQueryListEvent) {
      setMatches(event.matches);
    }
  }, [query]);
  return matches;
}

function useNavigate(app: ExampleApp) {
  let historyRef = React.useRef<BrowserHistory>();
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window });
  }
  let navigator = historyRef.current;

  let activeRef = React.useRef(false);
  React.useEffect(() => {
    activeRef.current = true;
  });

  let navigate = React.useCallback(
    (to: string) => {
      if (activeRef.current) {
        let path = resolvePath(to);
        navigator.push(path, { state: { app } });
      }
    },
    [navigator, app]
  );

  return navigate;
}
