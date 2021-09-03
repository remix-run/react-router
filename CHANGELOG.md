# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).  
Every release is documented on the Github [Releases](https://github.com/ReactTraining/react-router/releases) page.

---

# v5.3.0

This release of `react-router-dom` adds support for passing a function to either the `className` or `style` props to conditionally apply values based on the link's `active` state.

This provides similar functionality as the existing `activeClassName` and `activeStyle` props, but is a bit more powerful. For example, you can now easily apply styles exclusively to an inactive `NavLink` as well. This offers a nicer experience for folks who use utility class-based CSS tools such as Tailwind.

```tsx
function Comp() {
  return (
    <NavLink
      to="/"
      className={({ isActive }) =>
        `px-3 py-2 text-gray-${isActive ? 200 : 800}`
      }
    >
      Home
    </NavLink>
  );
}
```

Note that as of `v6.0.0-beta.3`, the `activeClassName` and `activeStyle` props are removed completely. Adding support for functional className and style props to both v5 and v6 will give v5 users an easier upgrade path.

Thanks to @tim-phillips for raising the issue that inspired the change! 🥳

# v6.0.0-beta.3

Loads of goodies for you this week, as well as a few breaking changes for all of you eager beavers who are brave enough to use beta software in production! 🦫 (seriously, thank you all for helping us tighten up our APIs and fix nasty 🐛s!)

## 💔 Breaking Changes!

- `NavLink` no longer supports the `activeClassName` or `activeStyle` props. Instead, we provide a more powerful API that allows you to pass functions to either the `className` or `style` props to conditionally apply values based on the link's `active` state. This offers a nicer experience for folks who use utility class-based CSS tools such as Tailwind, but you can always abstract over this feature in a custom `NavLink` if you prefer the old v5 API. (#7194)
- The `useRoutes` API has changed slightly. Instead of passing a basename as the second argument, you should instead pass it as a named property in an object:

```tsx
// Before
useRoutes([...routes], basename);

// After
useRoutes([...routes], { basename });
```

## 🐛 Bugfixes

- The `basename` prop on `Routes` is treated as case-insensitive (#7997)
- `useNavigate` previously used the incorrect `pathname` when called from parent routes when the URL matches one of its children. This fix also applies to `useSearchParams` (#7880)

## ✨ Enhancements

- `Routes` and `useRoutes` now allow you to override the `location`, which may be useful when building some modal interfaces and route transition animations. We are working hard to update our docs to include examples for advanced patterns where this might be useful, but in the mean time this also brings `Routes` closer to feature parity with v5's `Switch` via the `location` prop. (#7117)
- Provided new hooks `useClickHandler` and `usePressHandler` to make customizing `Links` a bit easier. (#7998)
  - **Please note:** with great power comes great responsibility. If you create a custom `Link`, be sure to render an actual HTML anchor element, otherwise your app will likely be inaccessible without a significant amount of additional work which, I assure you, you don't want to do!

## 💻 Installing

Development for v6 is chugging along [on the `dev` branch](https://github.com/remix-run/react-router/tree/dev).

If you'd like to test it out, install from npm:

```bash
$ npm install history react-router-dom@next
```

## 🙏 Credits

Thanks to [@andrelandgraf](https://github.com/andrelandgraf), [@dhulme](https://github.com/dhulme), [@fgatti675](https://github.com/fgatti675), [@hugmanrique](https://github.com/hugmanrique), [@MeiKatz](https://github.com/MeiKatz), [@chaance](https://github.com/chaance) and [@mjackson](https://github.com/mjackson) for your contributions!
