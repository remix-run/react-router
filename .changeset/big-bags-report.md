---
"react-router": patch
"react-router-dom": patch
"react-router-native": patch
---

feat: add `relative=path` option for url-relative routing (#9160)

Adds a `relative=path` option to navigation aspects to allow users to opt-into paths behaving relative to the current URL instead of the current route hierarchy. This is useful if you're sharing route patterns in a non-nested for UI reasons:

```jsx
// Contact and EditContact do not share UI layout
<Route path="contacts/:id" element={<Contact />} />
<Route path="contacts:id/edit" element={<EditContact />} />

function EditContact() {
  return <Link to=".." relative="path">Cancel</Link>
}
```

Without this, the user would need to reconstruct the contacts/:id url using useParams and either hardcoding the /contacts prefix or parsing it from useLocation.

This applies to all path-related hooks and components:

- `react-router`: `useHref`, `useResolvedPath`, `useNavigate`, `Navigate`
- `react-router-dom`: `useLinkClickHandler`, `useFormAction`, `useSubmit`, `Link`, `Form`
- `react-router-native`: `useLinkPressHandler`, `Link`
