import useRouterHistory from './useRouterHistory'

const canUseDOM = !!(
  typeof window !== 'undefined' && window.document && window.document.createElement
)

const HISTORY_METHODS = [
  'listenBefore',
  'listen',
  'transitionTo',
  'push',
  'replace',
  'go',
  'goBack',
  'goForward',
  'createKey',
  'createPath',
  'createHref',
  'createLocation'
]

export default function (createHistory) {
  if (!canUseDOM) {
    return undefined
  }

  let history

  function ensureHistory() {
    if (!history) {
      history = useRouterHistory(createHistory)()
    }

    return history
  }

  const shim = {
    __v2_compatible__: true
  }

  HISTORY_METHODS.forEach(method => {
    shim[method] = (...args) => ensureHistory()[method](...args)
  })

  return shim
}
