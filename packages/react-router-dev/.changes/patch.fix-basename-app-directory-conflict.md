Fix `basename` conflicting with `app` directory name when Vite `base` is set

When the Vite `base` config and React Router `basename` both match the
app directory name (e.g. `base: "/app/"`, `basename: "/app/"`), Vite would
strip the base prefix from server-build virtual module import paths, causing
"Failed to load url /root.tsx" errors. The fix uses `/@fs/` absolute paths
for those imports to bypass Vite's base-stripping logic.
