import { PropTypes } from 'react'

export const action = PropTypes.oneOf([ 'PUSH', 'REPLACE', 'POP' ])

export const location = PropTypes.shape({
  pathname: PropTypes.string,
  search: PropTypes.string,
  hash: PropTypes.string
})

export const history = PropTypes.shape({
  createHref: PropTypes.func.isRequired,
  action: action.isRequired,
  location: location.isRequired,
  push: PropTypes.func.isRequired,
  replace: PropTypes.func.isRequired,
  listen: PropTypes.func.isRequired
})

export const to = PropTypes.oneOf([
  PropTypes.string
  PropTypes.object
])
