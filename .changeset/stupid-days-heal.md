---
"@react-router/dev": major
---

Update default `isbot` version to v5 and drop support for `isbot@3`

- If you have `isbot@4` or `isbot@5` in your `package.json`:
  - You do not need to make any changes
- If you have `isbot@3` in your `package.json` and you have your own `entry.server.tsx` file in your repo
  - You do not need to make any changes
  - You can upgrade to `isbot@5` independent of the React Router v7 upgrade
- If you have `isbot@3` in your `package.json` and you do not have your own `entry.server.tsx` file in your repo
  - You are using the internal default entry provided by React Router v7 and you will need to upgrade to `isbot@5` in your `package.json`
