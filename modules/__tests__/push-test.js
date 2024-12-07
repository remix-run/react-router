import expect from 'expect'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import createHistory from '../createMemoryHistory'
import execSteps from './execSteps'
import Router from '../Router'
import Route from '../Route'

describe('push', () => {
  const Index = () => <h1>Index</h1>

  const Home = () => <h1>Home</h1>

  afterEach(() => {
    cleanup()
  })

  describe('when the target path contains a colon', () => {
    it('works', (done) => {
      const history = createHistory('/')
      const steps = [
        ({ location }) => {
          expect(location.pathname).toEqual('/')
          history.push('/home/hi:there')
        },
        ({ location }) => {
          expect(location.pathname).toEqual('/home/hi:there')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render(
        <Router history={history} onUpdate={execNextStep}>
          <Route path="/" component={Index} />
          <Route path="/home/hi:there" component={Home} />
        </Router>
      )
    })
  })
})
