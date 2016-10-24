import { PropTypes } from 'react'
const { func, string, any, oneOf, shape } = PropTypes

const FuncReq = func.isRequired
const StrReq = string.isRequired
export const action = oneOf([
  'PUSH',
  'REPLACE',
  'POP'
])

export const matchContext = shape({
  addMatch: FuncReq,
  removeMatch: FuncReq
})

export const history = shape({
  listen: FuncReq,
  listenBefore: FuncReq,
  push: FuncReq,
  replace: FuncReq,
  go: FuncReq
})

export const location = shape({
  pathname: StrReq,
  search: StrReq,
  hash: StrReq,
  state: any,
  key: string
})

export const historyContext = shape({
  action: action.isRequired,
  location: location.isRequired,
  push: FuncReq,
  replace: FuncReq,
  go: FuncReq,
  goBack: FuncReq,
  goForward: FuncReq,
  canGo: func,
  block: FuncReq
})

export const routerContext = shape({
  transitionTo: FuncReq,
  replaceWith: FuncReq,
  blockTransitions: FuncReq,
  createHref: FuncReq
})
