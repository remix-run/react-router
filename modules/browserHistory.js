import useRouterHistory from './useRouterHistory'
import createBrowserHistory from 'history/lib/createBrowserHistory'

const canUseDOM = !!(
  typeof window !== 'undefined' && window.document && window.document.createElement
)

let history

if (canUseDOM) {
  history = useRouterHistory(createBrowserHistory)()
}

export default history
