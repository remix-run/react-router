import expect from 'expect'
import React from 'react'

import { match, Route } from '../index'

function App(props) {
  return (
    <div>
      {props.children}
    </div>
  )
}

function Test() {
  return (
    <div>
      Test App
    </div>
  )
}

const onEnter = function (nextState, replace, cb) {
  setTimeout(() => {
    cb()
  }, Math.ceil(Math.random() * 800))
}

const AppRoute = (<Route path="/" component={App} onEnter={onEnter}>
  <Route path="test" component={Test} />
</Route>)


describe('Test async route hooks on server', () => {
  it('handles multiple request simultaneously', (done) => {
    let callCount = 0

    for (let i = 0; i < 100; i++) {
      match({
        routes: AppRoute,
        location: '/'
      }, () => {
        callCount += 1
      })
    }

    setTimeout (() => {
      expect(callCount).toEqual(100)
      done()
    }, 1900)
  })
})
