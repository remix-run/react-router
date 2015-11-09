## Tests

All commits that fix bugs or add features need a test.

`<blink>` Do not merge code without tests.`</blink>`

## Changelog

All commits that change or add to the API must be done in a pull request
that also:

- Add an entry to `CHANGES.md` with clear steps for updating code for
  changed or removed API.
- Updates examples
- Updates the docs

### Development

- `npm test` will fire up a karma test runner and watch for changes
- `npm start` fires up a webpack dev server that will watch
  for changes and build the examples

### Hacking

The best way to hack on the router is to symlink it into your project
using [`npm link`](https://docs.npmjs.com/cli/link). Then, use `npm run watch`
to automatically watch the `modules` directory and output a new `build`
every time something changes.
