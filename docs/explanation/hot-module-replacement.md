---
title: Hot Module Replacement
---

# Hot Module Replacement

[MODES: framework]

Hot Module Replacement is a technique for updating modules in your app without needing to reload the page.
It's a great developer experience, and React Router supports it when using Vite.

HMR does its best to preserve browser state across updates.
For example, let's say you have form within a modal and you fill out all the fields.
As soon as you save any changes to the code, traditional live reload would hard refresh the page causing all of those fields to be reset.
Every time you make a change, you'd have to open up the modal _again_ and fill out the form _again_.

But with HMR, all of that state is preserved _across updates_.

## React Fast Refresh

React already has mechanisms for updating the DOM via its [virtual DOM][virtual-dom] in response to user interactions like clicking a button.
Wouldn't it be great if React could handle updating the DOM in response to code changes too?

That's exactly what [React Fast Refresh][react-refresh] is all about!
Of course, React is all about components, not general JavaScript code, so React Fast Refresh only handles hot updates for exported React components.

### Configuring the React Plugin

To configure React Compiler or other React plugin options, enable the experimental [`future.unstable_externalReactPlugin`](../upgrading/future#futureunstable_externalreactplugin) flag and add `@vitejs/plugin-react` after `reactRouter()`. This opts your app into the external React plugin integration, replacing React Router's built-in Fast Refresh implementation.

```ts filename=vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter(), react()],
});
```

Use a version of `@vitejs/plugin-react` compatible with your Vite version. Version 5.2 supports Vite 7 and 8, while version 6 requires Vite 8 and provides a `compiler` option for enabling [React Compiler](https://react.dev/learn/react-compiler).

With version 5, you can configure the Babel-based React Compiler:

```sh
npm install -D babel-plugin-react-compiler
```

```ts filename=vite.config.ts
export default defineConfig({
  plugins: [
    reactRouter(),
    react({
      babel: { plugins: ["babel-plugin-react-compiler"] },
    }),
  ],
});
```

Version 6's experimental native compiler option requires `oxc-transform-react`:

```sh
npm install -D @vitejs/plugin-react@^6 oxc-transform-react
```

```ts filename=vite.config.ts
export default defineConfig({
  plugins: [reactRouter(), react({ compiler: true })],
});
```

If your app uses MDX, add Vite's `enforce: "pre"` property to the plugin returned by `mdx()` and place it before `reactRouter()` so MDX is compiled before route transforms and React Fast Refresh. Include those files in your React plugin configuration too:

```ts filename=vite.config.ts
export default defineConfig({
  plugins: [
    { enforce: "pre", ...mdx() },
    reactRouter(),
    react({ include: /\.(mdx?|[jt]sx?)$/ }),
  ],
});
```

Route modules excluded by your React plugin will reload the page when their components change. React Router continues to handle updates to route APIs such as `loader`, `clientLoader`, and `meta`.

But React Fast Refresh does have some limitations that you should be aware of.

### Class Component State

React Fast Refresh does not preserve state for class components.
This includes higher-order components that internally return classes:

```tsx
export class ComponentA extends Component {} // ❌

export const ComponentB = HOC(ComponentC); // ❌ Won't work if HOC returns a class component

export function ComponentD() {} // ✅
export const ComponentE = () => {}; // ✅
export default function ComponentF() {} // ✅
```

### Named Function Components

Function components must be named, not anonymous, for React Fast Refresh to track changes. The experimental external React plugin integration gives anonymous default components in route modules a name automatically. Otherwise, name your components explicitly:

```tsx
export default () => {}; // ❌
export default function () {} // ❌

const ComponentA = () => {};
export default ComponentA; // ✅

export default function ComponentB() {} // ✅
```

### Supported Exports

React Fast Refresh can only handle component exports. While React Router manages [route exports like `action`, ` headers`, `links`, `loader`, and `meta`][route-module] for you, any user-defined exports will cause full reloads:

```tsx
// These exports are handled by the React Router Vite plugin
// to be HMR-compatible
export const meta = { title: "Home" }; // ✅
export const links = [
  { rel: "stylesheet", href: "style.css" },
]; // ✅

// These exports are removed by the React Router Vite plugin
// so they never affect HMR
export const headers = { "Cache-Control": "max-age=3600" }; // ✅
export const loader = async () => {}; // ✅
export const action = async () => {}; // ✅

// This is not a route module export, nor a component export,
// so it will cause a full reload for this route
export const myValue = "some value"; // ❌

export default function Route() {} // ✅
```

👆 Routes probably shouldn't be exporting random values like that anyway.
If you want to reuse values across routes, stick them in their own non-route module:

```ts filename=my-custom-value.ts
export const myValue = "some value";
```

### Changing Hooks

React Fast Refresh cannot track changes for a component when hooks are being added or removed from it, causing full reloads just for the next render. After the hooks have been updated, changes should result in hot updates again. For example, if you add a `useState` to your component, you may lose that component's local state for the next render.

Additionally, if you are destructuring a hook's return value, React Fast Refresh will not be able to preserve state for the component if the destructured key is removed or renamed.
For example:

```tsx
export default function Component({ loaderData }) {
  const { pet } = useMyCustomHook();
  return (
    <div>
      <input />
      <p>My dog's name is {pet.name}!</p>
    </div>
  );
}
```

If you change the key `pet` to `dog`:

```tsx diff
 export default function Component() {
-  const { pet } = useMyCustomHook();
+  const { dog } = useMyCustomHook();
   return (
     <div>
       <input />
-      <p>My dog's name is {pet.name}!</p>
+      <p>My dog's name is {dog.name}!</p>
     </div>
   );
 }
```

then React Fast Refresh will not be able to preserve state `<input />` ❌.

### Component Keys

In some cases, React cannot distinguish between existing components being changed and new components being added. [React needs `key`s][react-keys] to disambiguate these cases and track changes when sibling elements are modified.

[virtual-dom]: https://reactjs.org/docs/faq-internals.html#what-is-the-virtual-dom
[react-refresh]: https://github.com/facebook/react/tree/main/packages/react-refresh
[react-keys]: https://react.dev/learn/rendering-lists#why-does-react-need-keys
[route-module]: ../start/framework/route-module
