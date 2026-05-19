Remove `react-router-dom` package

- In v7 everything DOM-specific was collapsed into `react-router/dom`
  - `react-router-dom` was kept around as a convenience so existing v6 app imports would still work
- For v8, you will need to swap `react-router-dom` imports:
  - `RouterProvider`/`HydratedRouter` should be imported from `react-router/dom`
  - Everything else should be imported from `react-router`
