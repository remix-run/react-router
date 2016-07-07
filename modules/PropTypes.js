import { PropTypes } from 'react'

export const location = PropTypes.object

export const router = PropTypes.shape({
  createHref: PropTypes.func.isRequired,
  transitionTo: PropTypes.func.isRequired,
  replaceWith: PropTypes.func.isRequired,
  go: PropTypes.func.isRequired
})
