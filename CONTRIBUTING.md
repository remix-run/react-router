### Tests

All commits that fix bugs or add features need a test.

`<blink>` Do not merge code without tests.`</blink>`

### Commit Subjects for Public API Changes

If your patch **changes the API or fixes a bug** please use one of the
following prefixes in your commit subject:

- `[fixed] ...`
- `[changed] ...`
- `[added] ...`
- `[removed] ...`

That ensures the subject line of your commit makes it into the
auto-generated changelog. Do not use these tags if your change doesn't
fix a bug and doesn't change the public API.

Commits with changed, added, or removed, should probably be reviewed by
another collaborator.

#### When using `[changed]` or `[removed]`...

Please include an upgrade path with example code in the commit message.
If it doesn't make sense to do this, then it doesn't make sense to use
`[changed]` or `[removed]` :)

### Docs

Please update the docs with any API changes, the code and docs should
always be in sync.

### Development

- `npm test` will fire up a karma test runner and watch for changes
- `npm run examples` fires up a webpack dev server that will watch
  for changes and build the examples

### Hacking

The best way to hack on the router is to symlink it into your project
using [`npm link`](https://docs.npmjs.com/cli/link). Then, use `npm run watch`
to automatically watch the `modules` directory and output a new `build`
every time something changes.
