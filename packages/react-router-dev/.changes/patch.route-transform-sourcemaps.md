Declare source maps from the route module transforms so split route chunks map back to the original file

- `react-router:split-route-modules` now generates a source map when it reprints a route through Babel, instead of returning `null`. Without it the reprinted chunk carried no mapping of its own, so a stack frame in a split route resolved against whatever mapping happened to survive - pointing at the wrong function in the route file.
- `react-router:build-client-route` now returns an empty mappings string. The re-export barrel it emits is generated code with no original behind it, so this says "deliberately not mappable" rather than leaving it to be treated as if it still lined up with the route module.
