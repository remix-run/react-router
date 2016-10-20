import { PropTypes } from 'react'

const placeholder = function() {}
placeholder.isRequired = function() {}

export let action = placeholder
export let history = placeholder
export let location = placeholder
export let matchContext = placeholder
export let historyContext = placeholder
export let routerContext = placeholder

if (__DEV__) {

  action = PropTypes.oneOf([
    'PUSH',
    'REPLACE',
    'POP'
  ])

  history = PropTypes.shape({
    listen: PropTypes.func.isRequired,
    listenBefore: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
    go: PropTypes.func.isRequired
  })

  location = PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired,
    hash: PropTypes.string.isRequired,
    state: PropTypes.any,
    key: PropTypes.string
  })

  matchContext = PropTypes.shape({
    addMatch: PropTypes.func.isRequired,
    removeMatch: PropTypes.func.isRequired
  })

  historyContext = PropTypes.shape({
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

  routerContext = PropTypes.shape({
    transitionTo: PropTypes.func.isRequired,
    replaceWith: PropTypes.func.isRequired,
    blockTransitions: PropTypes.func.isRequired,
    createHref: PropTypes.func.isRequired
  })

}
