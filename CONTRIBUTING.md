### Commit subjects

If your patch changes the API or fixes a bug please use one of the
following prefixes in your commit subject:

- `[fixed] ...`
- `[changed] ...`
- `[added] ...`
- `[removed] ...`

That ensures the subject line of your commit makes it into the
auto-generated changelog.

### README

Please update the readme with any API changes, the code and docs should
always be in sync.

### Development

- `script/test` will fire up a karma runner and watch for changes in the
  specs directory.
- `npm test` will do the same but doesn't watch, just runs the tests.
- `script/build-examples` does exactly that.
- `script/build-examples --watch` is a little more useful.

### Build

Please do not include the output of `script/build` in your commits, we
only do this when we release. (Also, you probably don't need to build
anyway unless you are fixing something around our global build.)

