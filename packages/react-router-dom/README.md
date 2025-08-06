This package simply re-exports everything from `react-router` to smooth the upgrade path for v6 applications. Once upgraded you can change all of your imports and remove it from your dependencies:

```diff
-import { Routes } from "react-router-dom"
+import { Routes } from "react-router"
```
