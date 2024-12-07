import useRouterHistory from './useRouterHistory'

const canUseDOM = !!(
  typeof window !== 'undefined' && window.document && window.document.createElement
)

export default function createRouterHistory(createHistory) {
  let history
  if (canUseDOM)
    history = useRouterHistory(createHistory)()
  return history
}
