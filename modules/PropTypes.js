import { PropTypes } from 'react'

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
  go: PropTypes.func.isRequired
})
