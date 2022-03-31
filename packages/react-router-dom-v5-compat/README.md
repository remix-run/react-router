# React Router DOM Compat v5

This package enables React Router web apps to incrementally migrate to the latest API in v6 by running it in parallel with v5. It is a copy of v6 with an extra couple of components to keep the two in sync.

## Incremental Migration

Instead of upgrading and updating all of your code at once (which is incredibly difficult and prone to bugs), this strategy enables you to upgrade one component, one hook, and one route at a time by running both v5 and v6 in parallel. Any code you haven't touched is still running the very same code it was before. Once all components are exclusively using the v6 APIs, your app no longer needs the compatibility package and is running on v6.

It looks something like this:

- Setup the `CompatRouter`
- Change a `<Route>` inside of a `<Switch>` to a `<CompatRoute>`
- Update all APIs inside this route element tree to v6 APIs one at a time
- Repeat for all routes in the `<Switch>`
- Convert the `<Switch>` to a `<Routes>`
- Repeat for all ancestor `<Switch>`s
- Update `<Links>`
- You're done!

## Setting up

These are the most common cases, be sure to read the v6 docs to figure out how to do anything not shown here.

Please [open a discussion on GitHub][discussion] if you're stuck, we'll be happy to help. We would also love for this GitHub Q&A to fill up with migration tips for the entire community, so feel free to add your tips even when you're not stuck!

### 1) Upgrade your app to React 16.8+

React Router v6 has been rewritten with React Hooks, significantly improving bundle sizes and composition. You will need to upgrade to 16.8+ in order to migrate to React Router v6.

You can read the [Hooks Adoption Strategy](https://reactjs.org/docs/hooks-faq.html#adoption-strategy) from the React docs for help there.

### 2) Install Compatibility Package

👉 Install the package

```sh
npm install react-router-dom-v5-compat
```

This package includes the v6 API so that you can run it in parallel with v5.

### 3) Render the Compatibility Router

The compatibility package includes a special `CompatRouter` that synchronizes the v5 and v6 APIs state so that both APIs are available.

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

You can start at the top, too, but then you can't migrate an entire branch of your UI to v6 completely which makes it tempting to keep using v5 APIs when working in any part of your app: "two steps forward, one step back". By migrating an entire Route's element tree to v6, new feature work there is less likely to pull in the v5 APIs.

### 1) Render CompatRoute elements inside of Switch

👉 Change `<Route>` to `<CompatRoute>`

```diff
  import { Route } from "react-router-dom";
+ import { CompatRoute } from "react-router-dom-v5-compat";

  export function SomComp() {
    return (
      <Switch>
-       <Route path="/project/:id" component={Project} />
+       <CompatRoute path="/project/:id" component={Project} />
      </Switch>
    )
  }
```

`<CompatRoute>` renders a v5 `<Route>` wrapped inside of a v6 context. This is the special sauce that makes both APIs available to the component tree inside of this route.

⚠️️ You can only use `CompatRoute` inside of a `Switch`, it will not work for Routes that are rendered outside of `<Switch>`. Depending on the use case, there will be a hook in v6 to meet it.

⚠️ You can't use regular expressions or optional params in v6 route paths. Instead, repeat the route with the extra params/regex patterns you're trying to match.

```diff
- <Route path="/one/:two?" element={Comp} />
+ <CompatRoute path="/one/:two" element={Comp} />
+ <CompatRoute path="/one" element={Comp} />
```

### 2) Change component code use v6 instead of v5 APIs

This route now has both v5 and v6 routing contexts, so we can start migrating component code to v6.

If the component is a class component, you'll need to convert it to a function component first so that you can use hooks.

👉 Read from v6 `useParams()` instead of v5 `props.match`

```diff
+ import { useParams } from "react-router-dom-v5-compat";

  function Project(props) {
-    const { params } = props.match;
+    const params = useParams();
     // ...
  }
```

👉 Commit and ship!

```sh
git add .
git commit -m "chore: RR v5 props.match -> v6 useParams"
git push origin main
```

This component is now using both APIs at the same time. Every small change can be committed and shipped. No need for a long running branch that makes you want to quit your job, build a cabin in the woods, and live off of squirrels and papago lilies.

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

There are more APIs you may be accessing, but these are the most common. Again, [open a discussion on GitHub][discussion] if you're stuck and we'll do our best to help out.

### 3) (Maybe) Update Links and NavLinks

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

Once every descendant component in a `<Switch>` has been migrated to v6, you can convert the `<Switch>` to `<Routes>` and change the `<CompatRoute>` elements to v6 `<Route>` elements.

👉 Convert `<Switch>` to `<Routes>` and `<CompatRoute>` to v6 `<Route>`

```diff
  import { Routes, Route } from "react-router-dom-v5-compat";
- import { Switch, Route } from "react-router-dom"

- <Switch>
-  <CompatRoute path="/" exact component={Home} />
-  <CompatRoute path="/projects/:projectId" component={Project} />
- </Switch>
+ <Routes>
+   <Route path="/" element={<Home />} />
+   <Route path="projects/:projectId" element={<Project />} />
+ </Routes>
```

BAM 💥 This entire branch of your UI is migrated to v6!

### 5) Rinse and Repeat up the tree

Once your deepest `Switch` components are converted, go up to their parent `<Switch>` and repeat the process. Keep doing this all the way up the tree until all components are migrated to v6 APIs.

When you convert a `<Switch>` to `<Routes>` that has descendant `<Routes>` deeper in its tree, there are a couple things you need to do in both places for everything to continue matching correctly.

👉️ Add splat paths to any `<Route>` with a **descendant** `<Routes>`

```diff
  function Root() {
    return (
      <Routes>
-       <Route path="/projects" element={<Projects />} />
+       <Route path="/projects/*" element={<Projects />} />
      </Routes>
    );
  }
```

This ensures deeper URLs like `/projects/123` continue to match that route. Note that this isn't needed if the route doesn't have any descendant `<Routes>`.

👉 Convert route paths from absolute to relative paths

```diff
- function Projects(props) {
-   let { match } = props
  function Projects() {
    return (
      <div>
        <h1>Projects</h1>
        <Routes>
-         <Route path={match.path + "/activity"} element={<ProjectsActivity />} />
-         <Route path={match.path + "/:projectId"} element={<Project />} />
-         <Route path={match.path + "/:projectId/edit"} element={<EditProject />} />
+         <Route path="activity" element={<ProjectsActivity />} />
+         <Route path=":projectId" element={<Project />} />
+         <Route path=":projectId/edit" element={<EditProject />} />
        </Routes>
      </div>
    );
  }
```

Usually descendant Switch (and now Routes) were using the ancestor `match.path` to build their entire path. When the ancestor Switch is converted to `<Routes>` you no longer need to do this this manually, it happens automatically. Also, if you don't change them to relative paths, they will no longer match, so you need to do this step.

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

This part is optional (but you'll want it when the React Router data APIs ship).

Once you've converted all of your app to v6, you can lift every `<Routes>` to the top of the app and replace it with an `<Outlet>`. React Router v6 has a concept of "nested routes".

👉 Replace descendant `<Routes>` with `<Outlet/>`

```diff
- <Routes>
-   <Route path="one" />
-   <Route path="two" />
- </Routes>
+ <Outlet />
```

👉 Lift the `<Route>` elements to the ancestor `<Routes>`

```diff
 <Routes>
   <Route path="three" />
   <Route path="four" />
+  <Route path="one" />
+  <Route path="two" />
 </Routes>
```

If you had splat paths for descendant routes, you can remove them when the descendant routes lift up to the same route configuration:

```diff
  <Routes>
-   <Route path="projects/*">
+   <Route path="projects">
      <Route path="activity" element={<ProjectsActivity />} />
      <Route path=":projectId" element={<Project />} />
      <Route path=":projectId/edit" element={<EditProject />} />
    </Route>
  </Routes>
```

That's it, you're done 🙌

Don't forget to [open a discussion on GitHub][discussion] if you're stuck, add your own tips, and help others with their questions 🙏

[discussion]: https://github.com/remix-run/react-router/discussions/new?category=v5-to-v6-migration
