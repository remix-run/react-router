# React Router DOM Compat v5

This package enables React Router web apps to incrementally migrate to the latest API in v6 by running it in parallel with v5.

## Incremental Migration

Instead of upgrading and updating all of your code at once (which is incredibly difficult and prone to bugs), this strategy enables you to opt-in one component, one hook, and one route at a time. It's running both v5 and v6 in parallel. Any code you haven't touched is still running the very same code it was before. Once all components are exclusively using the v6 APIs, your app no longer needs the compatibility package and is running on v6.

It looks something like this:

- Update an existing v5 `<Route>` to render a v6 `<Routes><Route/></Routes>`, the components in this route now have both v5 and v6 contexts.
- Go into the descendent components of this route and update the route data access and manipulation (i.e. `props.match.params` -> `useParams()`) until they no longer access any v5 APIs.
- Repeat for each sibling of the `<Route>`
- Once all sibling routes' descendants are migrated, convert the `<Switch>` to a `<Routes>`
- Repeat for all ancestor `<Switch>`s
- Once all `<Switch>` occurrences are converted to `<Routes>`, optionally replace each `<Routes>` with an `<Outlet>` and aggregate all routes to the top of the component tree (you will want this to take advantage of data loading/mutations APIs that are coming soon).

## Setting up

### 1) Upgrade your app to React 16.8+

React Router v6 has been rewritten with React Hooks, significantly improving bundle sizes and composition. You will need to upgrade to 16.8+ in order to migrate to React Router v6.

You can read the [Hooks Adoption Strategy](https://reactjs.org/docs/hooks-faq.html#adoption-strategy) from the React docs for help there.

### 2) Install Compatibility Package

👉 Install the package

```sh
npm install react-router-dom-v5-compat
```

This package includes the v6 API so that you can run it in parallel with v5 (you can't install and run two versions of the same package in your package.json, so we needed to publish it as a separate package).

### 3) Render the Compatibility Router

The compatibility package includes a special `CompatRouter` that synchronizes the v5 and v6 APIs state. For example, whether a v5 or a v6 link is clicked, both contexts will update the UI.

👉 Render the `<CompatRouter>` directly below your v5 `<BrowserRouter>`.

```diff
 import { BrowserRouter } from "react-router-dom";
+import { CompatRouter } from "react-router-dom-v5-compat";

 export function App() {
   return (
     <BrowserRouter>
+      <CompatRouter>
         <Switch>
           <Route path="/" exact component={Home} />
           {/* ... */}
         </Switch>
+      </CompatRouter>
     </BrowserRouter>
   );
 }
```

For the curious, this component accesses the `history` from v5, sets up a listener, and then renders a "controlled" v6 `<Router>`. This way both v5 and v6 APIs are talking to the same `history` instance.

### 4) Commit and Ship!

The whole point of this package is to allow you to incrementally migrate your code instead of a giant, risky upgrade that often halts any other feature work.

👉 Commit the changes and ship!

```sh
git add .
git commit -m 'setup router compatibility package'
# of course this may be different for you
git push origin main
```

It's not much yet, but now you're ready.

## Migration Strategy

The migration is easiest if you start from the bottom of your component tree and climb up each branch to the top.

You can start at the top, too, but then you can't migrate an entire branch of your UI to v6 completely. This is a problem because you'll be using both APIs inside a single component for the duration of the migration. This can make the migration more difficult because developers doing feature work in that part of the code will likely use the v5 APIs, increasing v5 usage and delaying the migration.

By migrating an entire branch completely from the bottom up, it would be more difficult to go rummage up the v5 APIs than to use the v6 APIs right there in front of them. In other words, migrating from the bottom up makes The Right Way The Easy Way™.

### 1) Render a v6 Routes for a v5 Route

👉 Rename `<Route>` to `<RouteV5>`

```diff
- import { Route } from "react-router-dom";
+ import { Route as RouteV5 } from "react-router-dom";

  export function SomComp() {
    return (
      <Switch>
-       <Route />
+       <RouteV5 />
      </Switch>
    )
  }
```

If you're using VSCode, you can right click the `Route` and choose "Rename". This step makes it easier to use both `<Route>` components in the same file.

👉 Render a v6 `<Routes><Route/></Routes>` inside of `<RouteV5>`

```diff
+ import { Route } from "react-router-dom-v5-compat";
  import { Route as RouteV5 } from "react-router-dom";

  export function SomComp() {
    return (
      <Switch>
-       <RouteV5 path="/project/:projectId" component={Project} />
+       <RouteV5
+         path="/project/:projectId"
+         render={(props) => (
+           <Routes>
+             <Route path="/project/:projectId" element={<Project {...props}>}>
+           </Routes>
+         )}
+       />
      </Switch>
    )
  }
```

Yeah, it's gonna get a bit ugly during the migration 😐

Notice how we pass all the props from the render prop callback to the element. This is critical for the `Project` component to continue to have access to v5 APIs props like `props.match` and `props.history`.

### 2) Change component code to v6 hooks from v5 props

This route now has both v5 and v6 routing contexts, so we can start migrating component code to v6.

If the component is a class component, you'll need to convert it to a function component first so that you can use hooks.

👉 Read from v6 `useParams()` instead of v5 `props.match`

```diff
+ import { useParams } from "react-router-dom-v5-compat";

  function Project(props) {
-    const { params } = props.match;
+    const { params } = useParams();
     // ...
  }
```

👉 Commit and ship!

```sh
git add .
git commit -m "chore: RR v5 props.match -> v6 useParams"
git push origin main
```

This component can now use both v5 and v6 APIs. Every small change can be committed and shipped. No need for a long running branch that makes you want to quit your job, build a cabin in the woods, and live off of squirrels and papago lilies.

👉 Read from v6 `useLocation()` instead of v5 `props.location`

```diff
+ import { useLocation } from "react-router-dom-v5-compat";

  function Project(props) {
-    const location = props.location;
+    const location = useLocation();
     // ...
  }
```

👉 Use `navigate` instead of `history`

```diff
+ import { useNavigate } from "react-router-dom-v5-compat";

  function Project(props) {
-    const history = props.history;
+    const navigate = useNavigate();

     return (
       <div>
         <MenuList>
           <MenuItem onClick={() => {
-            history.push("/elsewhere");
+            navigate("/elsewhere");

-            history.replace("/elsewhere");
+            navigate("/elsewhere", { replace: true });

-            history.go(-1);
+            navigate(-1);
           }} />
         </MenuList>
       </div>
     )
  }
```

### 3) Update Links and NavLinks

Note that you can only update links that are inside of v6 `<Routes>`.

Some links may be building on `match.url` to link to deeper URLs without needing to know the portion of the URL before them. You no longer need to build the path manually, React Router v6 supports relative links.

👉 Update links to use relative `to` values

```diff
- import { Link } from "react-router-dom";
+ import { Link } from "react-router-dom-v5-compat";

  function Project(props) {
     return (
       <div>
-        <Link to={`${props.match.url}/edit`} />
+        <Link to="edit" />
       </div>
     )
  }
```

The way to define active className and style props has been simplified to a callback to avoid specificity issues with CSS:

👉 Update nav links

```diff
- import { NavLink } from "react-router-dom";
+ import { NavLink } from "react-router-dom-v5-compat";

  function Project(props) {
     return (
       <div>
-        <NavLink exact to="/dashboard" />
+        <NavLink end to="/dashboard" />

-        <NavLink activeClassName="blue" className="red" />
+        <NavLink className={({ isActive }) => isActive ? "blue" : "red" } />

-        <NavLink activeStyle={{ color: "blue" }} style={{ color: "red" }} />
+        <NavLink style={({ isActive }) => ({ color: isActive ? "blue" : "red" }) />
       </div>
     )
  }
```

### 4) Convert `Switch` to `Routes`

Once every descendant component in a `<Switch>` has been migrated to v6, you can convert the `<Switch>` to `<Routes>` and get rid of the uh ... mess.

👉 Convert `Switch` to `Routes`

```diff
  import { Routes, Route } from "react-router-dom-v5-compat";
- import { Switch, Route as RouteV5 } from "react-router-dom"

- <Switch>
-  <RouteV5
-    path="/"
-    exact
-    render={(props) => (
-      <Routes>
-        <Route path="/" element={<Home {...props} />} />
-      </Routes>
-    )}
-  />
-  <RouteV5
-    path="/projects/:projectId"
-    render={(props) => (
-      <Routes>
-        <Route path="/projects/:projectId" element={<Project {...props} />} />
-      </Routes>
-    )}
-  />
- </Switch>

+ <Routes>
+   <Route path="/" element={<Home />} />
+   <Route path="projects/:projectId" element={<Project />} />
+ </Routes>
```

BAM 💥 This entire branch of your UI is migrated to v6!

### 5) Rinse and Repeat up the tree

Once your deepest `Switch` components are converted, go up to their parent `<Switch>` and repeat the process.

You will need to add "splat" paths to any route with a descendant `<Routes>` inside of it.

```jsx
<RouteV5
  // router v5 matched partially, so /some/path is really /some/path/*
  path="/some/path"
  render={(props) => (
    // v6 matches "to the end" of the path, so to get this to
    // render descendant `<Routes>` we need to use "*"
    <Routes>
      <Route path="/some/path/*" element={<SomeComp {...props} />} />
    </Routes>
  )}
/>
```

Keep doing this all the way up the tree until all components are migrated to v6 APIs.

### 6) Remove the compatibility package!

Once you've converted all of your code you can remove the compatibility package and install React Router DOM v6 directly. We have to do a few things all at once to finish this off.

👉 Remove the compatibility package

```sh
npm uninstall react-router-dom-v5-compat
```

👉 Uninstall `react-router` and `history`

v6 no longer requires history or react-router to be peer dependencies (they're normal dependencies now), so you'll need to uninstall them

```
npm uninstall react-router history
```

👉 Install React Router v6

```sh
npm install react-router-dom@6
```

👉 Remove the `CompatRouter`

```diff
  import { BrowserRouter } from "react-router-dom";
- import { CompatRouter } from "react-router-dom-v5-compat";

  export function App() {
    return (
      <BrowserRouter>
-       <CompatRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* ... */}
        </Routes>
-       </CompatRouter>
      </BrowserRouter>
    );
  }
```

Note that `BrowserRouter` is now the v6 browser router.

👉 Change all compat imports to "react-router-dom"

You should be able to a find/replace across the project to change all instances of "react-router-dom-v5-compat" to "react-router-dom"

```sh
# Change `src` to wherever your source modules live
# Also strap on a fake neckbeard cause it's shell scripting time
git grep -lz src | xargs -0 sed -i '' -e 's/react-router-dom-v5-compat/react-router-dom/g'
```

### 7) Optional: lift `Routes` up to single route config

This part is optional. Once you've converted all of your app to v6, you can lift every `<Routes>` to the top of the app and replace it with an `<Outlet>`. React Router v6 has a concept of "nested routes".

```diff
- <Routes>
-   <Route path="one" />
-   <Route path="two" />
- </Routes>
+ <Outlet />
```

Then add the `Route` elements (but not the `Routes`) to the parent Routes

```diff
 <Routes>
   <Route path="three" />
   <Route path="four" />
+  <Route path="one" />
+  <Route path="two" />
 </Routes>
```

That's it, you're done 🙌

These are the most common cases, be sure to read the v6 docs to figure out how to do anything not shown here. Also, please [open a discussion on GitHub](https://github.com/remix-run/react-router/discussions/new?category=q-a) if you're stuck and we'll be happy to help and update this document with more cases!
