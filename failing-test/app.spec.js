import { hashHistory } from '../lib' // simulate react-router as a package
import expect, { spyOn } from 'expect'
import app from './app'

describe('hashHistory: failing test', () => {
  it('should call hashHistory.push(./foo)', () => {
    const spy = spyOn(hashHistory, 'push')
    app()
    expect(spy).toHaveBeenCalled()
  })
})
