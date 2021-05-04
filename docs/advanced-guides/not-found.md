Before reading this guide, read the [layouts](layouts.md) guide first as the code will pick up where that guide left off.


Change the app component from the layout guide to add an additional Route as shown below, inside of the Route-Layout grouping, so that your 404 page will 
still render via the Outlet component inside of your layout. If you don't want your 404 inside of your layout, then place the NotFound Route outside of this 
tree.

```
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Other Routes */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
};
```
