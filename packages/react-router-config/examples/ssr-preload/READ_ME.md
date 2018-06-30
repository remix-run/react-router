## to run

```
yarn install && yarn start
```

Description.
1. Request hits node server
2. Node server passes url to loadBranchData();
3. loadBranchData inspects routes for preLoad functions and resolves them all.
4. data is injected into App component, and attached to window object of dom.
5. on initial load, window.__PRELOADED_STATE__ is extracted from dom to use in app.
