### Commit Subjects

If your patch **changes the API or fixes a bug** please use one of the
following prefixes in your commit subject:

- `[fixed] ...`
- `[changed] ...`
- `[added] ...`
- `[removed] ...`

That ensures the subject line of your commit makes it into the
auto-generated changelog. Do not use these tags if your change doesn't
fix a bug and doesn't change the public API.

Commits with changed, added, or removed, must be reviewed by another
collaborator.

#### When using `[changed]` or `[removed]`...

Please include an upgrade path with example code in the commit message.
If it doesn't make sense to do this, then it doesn't make sense to use
`[changed]` or `[removed]` :)

### Docs

Please update the docs with any API changes, the code and docs should
always be in sync.

### Development

- `script/test` will fire up a karma runner and watch for changes in the
  specs directory.
- `npm test` will do the same but doesn't watch, just runs the tests.
- `script/build-examples` does exactly that.

### Build

Please do not include the output of `script/build` in your commits, we
only do this when we release. (Also, you probably don't need to build
anyway unless you are fixing something around our global build.)

