import expect from 'expect'

export default (history, done) => {
  const spy = expect.createSpy()
  const unlisten = history.listen(spy)

  expect(spy).toNotHaveBeenCalled()

  unlisten()
  done()
}
