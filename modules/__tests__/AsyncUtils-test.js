import expect from 'expect'
import { loopAsync, mapAsync } from '../AsyncUtils'

describe('loopAsync', function () {
  it('should support calling done() and then next()', function (done) {
    const callback = (turn, next, done) => {
      done('foo')
      next()
    }

    const callbackSpy = expect.createSpy().andCall(callback)
    const doneSpy = expect.createSpy()

    loopAsync(10, callbackSpy, doneSpy)
    setTimeout(function () {
      expect(callbackSpy.calls.length).toBe(1)
      expect(doneSpy.calls.length).toBe(1)

      expect(doneSpy).toHaveBeenCalledWith('foo')

      done()
    })
  })
})


describe('mapAsync', function () {
  it('should support zero-length inputs', function (done) {
    mapAsync(
      [],
      () => null,
      (_, values) => {
        expect(values).toEqual([])
        done()
      }
    )
  })

  it('should only invoke callback once on multiple errors', function (done) {
    const error = new Error()
    const work = (item, index, callback) => {
      callback(error)
    }

    const workSpy = expect.createSpy().andCall(work)
    const doneSpy = expect.createSpy()

    mapAsync([ null, null, null ], workSpy, doneSpy)
    setTimeout(function () {
      expect(workSpy.calls.length).toBe(3)
      expect(doneSpy.calls.length).toBe(1)

      expect(doneSpy).toHaveBeenCalledWith(error)

      done()
    })
  })
})
