---
"@react-router/dev": patch
---

Simplify the type declaration for the virtual module `virtual:react-router/server-build`. Previously, we exported each property of the `ServerBuild` interface individually, but now we export the entire `ServerBuild` interface, making the type declaration simpler and easier to maintain. This ensures that any future updates to the `ServerBuild` interface will be automatically reflected in the type definition.
