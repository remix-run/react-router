Thanks for contributing, you rock!

If you use our code, it is now *our* code.

Please read https://reactjs.org/ and the Code of Conduct before opening an
issue.

- [Think You Found a Bug?](#bug)
- [Proposing New or Changed API?](#api)
- [Issue Not Getting Attention?](#attention)
- [Making a Pull Request?](#pr)
- [Development](#development)
- [Hacking](#hacking)

<a name="bug"/>
## Think You Found a Bug?

Please provide a test case of some sort. Best is a pull request with a
failing test. Next is a link to codepen/jsbin or repository that
illustrates the bug. Finally, some copy/pastable code is acceptable.

If you don't provide a test case, the issue will be closed.

<a name="api"/>
## Proposing New or Changed API?

Please provide thoughtful comments and some sample code. Proposals
without substance will be closed.

<a name="attention"/>
## Issue Not Getting Attention?

If you need a bug fixed and nobody is fixing it, it is your
responsibility to fix it. Issues with no activity for 30 days may be
closed.

<a name="pr"/>
## Making a Pull Request?

### Tests

All commits that fix bugs or add features need a test.

`<blink>`Do not merge code without tests.`</blink>`

### Changelog

All commits that change or add to the API must be done in a pull request
that also:

- Add an entry to `CHANGES.md` with clear steps for updating code for
  changed or removed API.
- Updates examples
- Updates the docs

## Development

- `npm test` will fire up a karma test runner and watch for changes
- `npm start` fires up a webpack dev server that will watch
  for changes and build the examples

## Hacking

The best way to hack on the router is to symlink it into your project
using [`npm link`](https://docs.npmjs.com/cli/link). Then, use `npm run watch`
to automatically watch the `modules` directory and output a new `build`
every time something changes.
