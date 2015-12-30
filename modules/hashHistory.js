import useRouterHistory from './useRouterHistory'
import createHashHistory from 'history/lib/createHashHistory'

const canUseDOM = !!(
  typeof window !== 'undefined' && window.document && window.document.createElement
)

let history

if (canUseDOM) {
  history = useRouterHistory(createHashHistory)()
}

export default history

