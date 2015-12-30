import assert from 'assert'
import expect from 'expect'
import useRouterHistory from '../useRouterHistory'
import createHistory from 'history/lib/createMemoryHistory'

describe('useRouterHistory', function () {
  it('adds backwards compatibility flag', function () {
    const history = useRouterHistory(createHistory)()
    expect(history.__v2_compatible__).toBe(true)
  })

  it('passes along options, especially query parsing', function (done) {
    const history = useRouterHistory(createHistory)({
      stringifyQuery() {
        assert(true)
        done()
      }
    })

    history.push({ pathname: '/', query: { test: true } })
  })
})

