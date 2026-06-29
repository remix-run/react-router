# `create-react-router`

## v8.1.0

### Minor Changes

- Add a default-on CLI option to include the official React Router agent skill in generated projects ([#15213](https://github.com/remix-run/react-router/pull/15213))
  - New projects include `.agents/skills/react-router` by default when running with `--yes` or in non-interactive shells
  - Interactive runs prompt to include the skill, defaulting to yes
  - Use `--no-agent-skills` to skip copying the skill

### Patch Changes

- Use Node's built-in utilities for CLI argument parsing, ANSI-stripping, and child process execution to remove the `arg`, `strip-ansi`, and `execa` dependencies ([#15231](https://github.com/remix-run/react-router/pull/15231))

## v8.0.1

### Patch Changes

- _No changes_

## v8.0.0

### Major Changes

- Switch from `@remix-run/web-fetch` to native `fetch` internally. ([#14929](https://github.com/remix-run/react-router/pull/14929))
  - This removes the underlying `HTTPS_PROXY` support that `node-fetch` and subsequently `@remix-run/web-fetch` supported
- Update minimum Node version to 22.22.0 ([#15143](https://github.com/remix-run/react-router/pull/15143))

### Minor Changes

- Bump dependencies ([#15080](https://github.com/remix-run/react-router/pull/15080))
  - Bumped `execa` from `5.1.1` to `9.6.1`
  - Bumped `log-update` from `^5.0.1` to `^8.0.0`
  - Bumped `semver` from `^7.3.7` to `^7.8.1`
  - Bumped `sort-package-json` from `^1.55.0` to `^3.6.1`
  - Bumped `strip-ansi` from `^6.0.1` to `^7.2.0`
  - Bumped `tar-fs` from `^2.1.3` to `^3.1.2`

## v7.18.0

### Patch Changes

- _No changes_

## v7.17.0

### Patch Changes

- _No changes_

## v7.16.0

### Patch Changes

- _No changes_

## v7.15.1

### Patch Changes

- _No changes_

## v7.15.0

### Patch Changes

- _No changes_

## v7.14.2

### Patch Changes

- _No changes_

## v7.14.1

### Patch Changes

- _No changes_

## 7.14.0

## 7.13.2

### Patch Changes

- chore: replace chalk with picocolors ([#14837](https://github.com/remix-run/react-router/pull/14837))

## 7.13.1

## 7.13.0

_No changes_

## 7.12.0

_No changes_

## 7.11.0

_No changes_

## 7.10.1

_No changes_

## 7.10.0

_No changes_

## 7.9.6

_No changes_

## 7.9.5

_No changes_

## 7.9.4

_No changes_

## 7.9.3

_No changes_

## 7.9.2

_No changes_

## 7.9.1

_No changes_

## 7.9.0

_No changes_

## 7.8.2

_No changes_

## 7.8.1

_No changes_

## 7.8.0

_No changes_

## 7.7.1

_No changes_

## 7.7.0

### Minor Changes

- Add Deno as a supported and detectable package manager. Note that this detection will only work with Deno versions 2.0.5 and above. If you are using an older version version of Deno then you must specify the --package-manager CLI flag set to `deno`. ([#12327](https://github.com/remix-run/react-router/pull/12327))

## 7.6.3

_No changes_

## 7.6.2

### Patch Changes

- Update `tar-fs` ([#13675](https://github.com/remix-run/react-router/pull/13675))

## 7.6.1

_No changes_

## 7.6.0

_No changes_

## 7.5.3

_No changes_

## 7.5.2

_No changes_

## 7.5.1

_No changes_

## 7.5.0

_No changes_

## 7.4.1

_No changes_

## 7.4.0

_No changes_

## 7.3.0

_No changes_

## 7.2.0

_No changes_

## 7.1.5

_No changes_

## 7.1.4

_No changes_

## 7.1.3

_No changes_

## 7.1.2

_No changes_

## 7.1.1

_No changes_

## 7.1.0

### Patch Changes

- Fix missing `fs-extra` dependency ([#12556](https://github.com/remix-run/react-router/pull/12556))

## 7.0.2

_No changes_

## 7.0.1

_No changes_

## 7.0.0

Initial release.
