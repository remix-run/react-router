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
