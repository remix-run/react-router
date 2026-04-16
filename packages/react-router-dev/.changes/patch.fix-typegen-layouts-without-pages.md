Fix typegen for layouts without pages

Previously, typegen could produce `pages: ;` in `.react-router/types/+routes.ts` when a route corresponded to 0 pages.
Now, `pages: never;` is correctly generated for those cases.