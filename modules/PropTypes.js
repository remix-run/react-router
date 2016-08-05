import { PropTypes } from 'react'

export const counter = PropTypes.shape({
  increment: PropTypes.func.isRequired,
  decrement: PropTypes.func.isRequired
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
  state: PropTypes.any
})

export const router = PropTypes.shape({
  createHref: PropTypes.func.isRequired,
  transitionTo: PropTypes.func.isRequired,
  replaceWith: PropTypes.func.isRequired,
  blockTransitions: PropTypes.func.isRequired
})

// TODO: Replace the "location" prop type with this one?
export const historyLocation = PropTypes.shape({
  path: PropTypes.string.isRequired,
  state: PropTypes.object,
  key: PropTypes.string
})

export const historyContext = PropTypes.shape({
  push: PropTypes.func.isRequired,
  replace: PropTypes.func.isRequired,
  pop: PropTypes.func.isRequired
})

export const stateStorage = PropTypes.shape({
  readState: PropTypes.func.isRequired,
  saveState: PropTypes.func.isRequired
})
