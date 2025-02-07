## TODO

- [x] generate types for route manifest
  - [x] name for generated file?
        `.react-router/types/+register.ts`
  - [x] refactor: babel.ts outside of `vite`
- [ ] reimplement route info from `Routes`
  - [ ] react-router/types
  - [ ] update `generate`
- [ ] reimplement route exports from `Routes`
  - [ ] deprecate react-router/route-module?

## @react-router/dev cleanup

- [ ] top-level files/dirs should correspond to package.json exports
- [ ] move shared stuff out of entries

##

- hmr: combine into one plugin!
- rename virtual modules to have `react-router:` prefix
  - but provide back-compat for old stuff
- tidier server entry
- react refresh! update it!

##

- single virtual-module plugin
- no enforce:pre
- move into base plugin!

##

- content collections
- custom dev server setup (+ typesafe build?)
- include `server.ts` in bundle?
  - or just let them run a `server.ts` themselves...
  - no server bundling!

## todo

- [ ] test props (instead of useLoaderData, etc..)

## later

- [ ] more robust error handling for typegen
  - can we have a nicer error when routes don't exist?
