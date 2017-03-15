import expect from 'expect'

export default (history, done) => {
  expect(history.location).toMatch({
    pathname: '/'
  })

  history.push('/home')

  let transitionHookWasCalled = false
  const unblock = history.block(() => {
    transitionHookWasCalled = true
  })

  // These timeouts are a hack to allow for the time it takes
  // for histories to reflect the change in the URL. Normally
  // we could just listen and avoid the waiting time. But this
  // test is designed to test what happens when we don't listen(),
  // so that's not an option here.

  // Allow some time for history to detect the PUSH.
  setTimeout(() => {
    history.goBack()

    // Allow some time for history to detect the POP.
    setTimeout(() => {
      expect(transitionHookWasCalled).toBe(true)
      unblock()

      done()
    }, 100)
  }, 10)
}
