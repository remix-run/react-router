import { PropTypes } from 'react'

export const action = PropTypes.oneOf([
  'PUSH',
  'REPLACE',
  'POP'
])

export const matchContext = PropTypes.shape({
  addMatch: PropTypes.func.isRequired,
  removeMatch: PropTypes.func.isRequired
})

export const history = PropTypes.shape({
  listen: PropTypes.func.isRequired,
  listenBefore: PropTypes.func.isRequired,
  push: PropTypes.func.isRequired,
  replace: PropTypes.func.isRequired,
  go: PropTypes.func.isRequired
})

export const location = PropTypes.shape({
  pathname: PropTypes.string.isRequired,
  search: PropTypes.string.isRequired,
  hash: PropTypes.string.isRequired,
  state: PropTypes.any,
  key: PropTypes.string
})

export const historyContext = PropTypes.shape({
  action: action.isRequired,
  location: location.isRequired,
  push: PropTypes.func.isRequired,
  replace: PropTypes.func.isRequired,
  go: PropTypes.func.isRequired,
  goBack: PropTypes.func.isRequired,
  goForward: PropTypes.func.isRequired,
  canGo: PropTypes.func,
  block: PropTypes.func.isRequired
})

export const routerContext = PropTypes.shape({
  transitionTo: PropTypes.func.isRequired,
  replaceWith: PropTypes.func.isRequired,
  blockTransitions: PropTypes.func.isRequired,
  createHref: PropTypes.func.isRequired
})

