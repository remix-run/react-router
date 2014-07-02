### Commit subjects

If your patch changes the API or fixes a bug please use one of the
following prefixes in your commit subject:

- `[fixed] ...`
- `[changed] ...`
- `[added] ...`
- `[removed] ...`

When releasing, a changelog is created automatically, from these
commits.

### Development

- `script/test` will fire up a karma runner and watch for changes in the
  specs directory.
- `npm test` will do the same but doesn't watch, just runs the tests.
- `script/build-examples` does exactly that.
- `script/build-examples --watch` is a little more useful.

