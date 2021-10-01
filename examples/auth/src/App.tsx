import * as React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  RouteProps,
  useLocation,
  Navigate
} from "react-router-dom";

/*
This example has 3 pages: a public page, a protected
page, and a login screen. In order to see the protected
page, you must first login. Pretty standard stuff.

First, visit the public page. Then, visit the protected
page. You're not yet logged in, so you are redirected
to the login page. After you login, you are redirected
back to the protected page.

Notice the URL change each time. If you click the back
button at this point, would you expect to go back to the
login page? No! You're already logged in. Try it out,
and you'll see you go back to the page you visited
just *before* logging in, the public page.
*/
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <AuthButton />

          <ul>
            <li>
              <Link to="/public">Public Page</Link>
            </li>
            <li>
              <Link to="/protected">Protected Page</Link>
            </li>
          </ul>

          <Routes>
            <Route index />
            <Route path="/public" element={<PublicPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={<PrivateRoute element={<ProtectedPage />} />}
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

const fakeAuth = {
  isAuthenticated: false,
  signin(cb: VoidFunction) {
    fakeAuth.isAuthenticated = true;
    setTimeout(cb, 100); // fake async
  },
  signout(cb: VoidFunction) {
    fakeAuth.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

/** For more details on
 * `AuthContext`, `AuthProvider`, `useAuth` and `useAuthProvider`
 * refer to: https://usehooks.com/useAuth/
 */
interface AuthContextType {
  user: "user" | null;
  signin: (cb: VoidFunction) => void;
  signout: (cb: VoidFunction) => void;
}

let AuthContext = React.createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  let auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function useAuth() {
  let context = React.useContext(AuthContext);
  if (!context) {
    throw new Error(`useAuth must be wrapped in an AuthProvider`);
  }
  return context;
}

function useAuthProvider() {
  let [user, setUser] = React.useState<AuthContextType["user"]>(null);

  let signin = (cb: VoidFunction) => {
    return fakeAuth.signin(() => {
      setUser("user");
      cb();
    });
  };

  let signout = (cb: VoidFunction) => {
    return fakeAuth.signout(() => {
      setUser(null);
      cb();
    });
  };

  return { user, signin, signout };
}

function AuthButton() {
  let navigate = useNavigate();
  let auth = useAuth();

  if (!auth.user) {
    return <p>You are not logged in.</p>;
  }

  return (
    <p>
      Welcome!{" "}
      <button
        onClick={() => {
          auth.signout(() => navigate("/"));
        }}
      >
        Sign out
      </button>
    </p>
  );
}

function PrivateRoute({ element }: RouteProps) {
  let auth = useAuth();
  let location = useLocation();

  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return <>{element}</>;
}

function PublicPage() {
  return <h3>Public</h3>;
}

function ProtectedPage() {
  return <h3>Protected</h3>;
}

function LoginPage() {
  let navigate = useNavigate();
  let location = useLocation();
  let auth = useAuth();

  let from = (location.state as { from?: Location })?.from?.pathname ?? "/";

  let login = () => {
    auth.signin(() => {
      navigate(from, { replace: true });
    });
  };

  return (
    <div>
      <p>You must log in to view the page at {from}</p>
      <button onClick={login}>Log in</button>
    </div>
  );
}
