# React Router [![Travis][build-badge]][build]

[build-badge]: https://img.shields.io/travis/ReactTraining/react-router/v4.svg?style=flat-square
[build]: https://travis-ci.org/ReactTraining/react-router

Declarative routing for [React](https://facebook.github.io/react).

## Docs

[View the docs here](https://reacttraining.com/react-router)

## Packages

This repository is a monorepo that we manage using [Lerna](https://github.com/lerna/lerna). That means that we actually publish [several packages](https://github.com/ReactTraining/react-router/tree/v4/packages) to npm from the same codebase, including: 

- `react-router` - The core of React Router ([API docs](packages/react-router/docs))
- `react-router-dom` - DOM bindings for React Router ([API docs](packages/react-router-dom/docs))
- `react-router-native` - [React Native](https://facebook.github.io/react-native/) bindings for React Router ([API docs](packages/react-router-native/docs))
- `react-router-redux` - [React Router Redux](packages/react-router-config) Integration with React Router and Redux
- `react-router-config` - [React Router Config](packages/react-router-config) static route config helpers

## Thanks

Thanks to [our sponsors](/SPONSORS.md) for supporting the development of React Router.

Also, thanks to [BrowserStack](https://www.browserstack.com/) for providing the infrastructure that allows us to run our build in real browsers.
