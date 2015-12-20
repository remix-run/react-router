import useQueries from 'history/lib/useQueries'
import baseCreateMemoryHistory from 'history/lib/createMemoryHistory'

export default function createMemoryHistory(options) {
  // signatures and type checking differ between `useRoutes` and
  // `createMemoryHistory`, have to create `memoryHistory` first because
  // `useQueries` doesn't understand the signature
  const memoryHistory = baseCreateMemoryHistory(options)
  const createHistory = () => memoryHistory
  const history = useQueries(createHistory)(options)
  history.__v2_compatible__ = true
  return history
}

