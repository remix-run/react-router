---
title: Contributing
order: 8
---

# Contributing to React Router

Thanks for contributing, you rock!

When it comes to open source, there are many different kinds of contributions that can be made, all of which are valuable. Here are a few guidelines that should help you as you prepare your contribution.

## Setup

Before you can contribute to the codebase, you will need to fork the repo. This will look a bit different depending on what type of contribution you are making:

- All new features, bug-fixes, or **anything that touches `react-router` code** should be branched off of and merged into the `dev` branch
- Changes that only touch documentation can be branched off of and merged into the `main` branch

The following steps will get you setup to contribute changes to this repo:

1. Fork the repo (click the <kbd>Fork</kbd> button at the top right of [this
   page](https://github.com/remix-run/react-router))
2. Clone your fork locally

```bash
# in a terminal, cd to parent directory where you want your clone to be, then
git clone https://github.com/<your_github_username>/react-router.git
cd react-router

# if you are making *any* code changes, make sure to checkout the dev branch
git checkout dev
```

3. Install dependencies and build. React Router uses [`yarn` (version 1)](https://classic.yarnpkg.com/lang/en/docs/install), so you
   should too. If you install using `npm`, unnecessary `package-lock.json` files
   will be generated.

## Think You Found a Bug?

Please conform to the issue template and provide a clear path to reproduction with a code example. Best is a pull request with a failing test. Next best is a link to CodeSandbox or repository that illustrates the bug.

## Proposing New or Changed API?

Please provide thoughtful comments and some sample code that show what you'd like to do with React Router in your app. It helps the conversation if you can show us how you're limited by the current API first before jumping to a conclusion about what needs to be changed and/or added.

We have learned by experience that small APIs are usually better, so we may be a little reluctant to add something new unless there's an obvious limitation with the current API. That being said, we are always anxious to hear about cases that we just haven't considered before, so please don't be shy! :)

## Issue Not Getting Attention?

If you need a bug fixed and nobody is fixing it, your best bet is to provide a fix for it and make a [pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request). Open source code belongs to all of us, and it's all of our responsibility to push it forward.

## Making a Pull Request?

Pull requests need only the approval of two or more collaborators to be merged; when the PR author is a collaborator, that counts as one.

> **Important:** When creating the PR in GitHub, make sure that you set the base to the correct branch. If you are submitting a PR that touches any code, this should be the `dev` branch. You set the base in GitHub when authoring the PR with the dropdown below the "Compare changes" heading:
>
> <img src="../static/base-branch.png" alt="" width="460" height="350" />

### Tests

All commits that fix bugs or add features need a test.

`<blink>`Do not merge code without tests!`</blink>`

### Docs + Examples

All commits that change or add to the API must be done in a pull request that also updates all relevant examples and docs.

## Development

### Packages

React Router uses a monorepo to host code for multiple packages. These packages live in the `packages` directory.

We use [Yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) to manage installation of dependencies and running various scripts. To get everything installed, make sure you have [Yarn (version 1) installed](https://classic.yarnpkg.com/lang/en/docs/install), and then run `yarn` or `yarn install` from the repo root.

### Building

Calling `yarn build` from the root directory will run the build, which should take only a few seconds. It's important to build all the packages together because `react-router-dom` and `react-router-native` both use `react-router` as a dependency.

### Testing

Before running the tests, you need to run a build. After you build, running `yarn test` from the root directory will run **every** package's tests. If you want to run tests for a specific package, use `yarn test --projects packages/<package-name>`:

```bash
# Test all packages
yarn test

# Test only react-router-dom
yarn test --projects packages/react-router-dom
```
