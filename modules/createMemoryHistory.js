import baseCreateMemoryHistory from 'history/lib/createMemoryHistory'

export default function createMemoryHistory(...args) {
  const history = baseCreateMemoryHistory(...args)
  history.__v2_compatible__ = true
  return history
}

