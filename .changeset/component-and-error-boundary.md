---
"react-router": minor
"react-router-dom": minor
---

React Router now supports an alternative way to define your route `element` and `errorElement` fields as React Components instead of React Elements. You can instead pass a React Component to the new `Component` and `ErrorBoundary` fields if you choose. There is no functional difference between the two, so use whichever approach you prefer 😀. You shouldn't be defining both, but if you do `Component`/`ErrorBoundary` will "win".

**Example JSON Syntax**

```jsx
// Both of these work the same:
const elementRoutes = [{
  path: '/',
  element: <Home />,
  errorElement: <HomeError />,
}]

const componentRoutes = [{
  path: '/',
  Component: Home,
  ErrorBoundary: HomeError,
}]

function Home() { ... }
function HomeError() { ... }
```

**Example JSX Syntax**

```jsx
// Both of these work the same:
const elementRoutes = createRoutesFromElements(
  <Route path='/' element={<Home />} errorElement={<HomeError /> } />
);

const elementRoutes = createRoutesFromElements(
  <Route path='/' Component={Home} ErrorBoundary={HomeError} />
);

function Home() { ... }
function HomeError() { ... }
```
