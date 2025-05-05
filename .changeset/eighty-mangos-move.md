---
"react-router": minor
---

Add support for route component props in `createRoutesStub`. This allows you to unit test your route components using the props instead of the hooks:

```tsx
let RoutesStub = createRoutesStub([
  {
    path: "/",
    Component({ loaderData }) {
      let data = loaderData as { message: string };
      return <pre data-testid="data">Message: {data.message}</pre>;
    },
    loader() {
      return { message: "hello" };
    },
  },
]);

render(<RoutesStub />);

await waitFor(() => screen.findByText("Message: hello"));
```
