import React from 'react'
import ReactDOM from 'react-dom'
import { createMemoryHistory as createHistory } from 'history'
import Router from '../Router'
import Switch from '../Switch'
import Route from '../Route'

describe('A <Switch>', () => {
  it('does not remount a <Route>', () => {
    const node = document.createElement('div')

    let mountCount = 0

    class App extends React.Component {
      componentWillMount() {
        mountCount++
      }

      render() {
        return <div/>
      }
    }

    const history = createHistory({
      initialEntries: [ '/one' ]
    })

    ReactDOM.render((
      <Router history={history}>
        <Switch>
          <Route path="/one" component={App}/>
          <Route path="/two" component={App}/>
        </Switch>
      </Router>
    ), node)

    expect(mountCount).toBe(1)
    history.push('/two')

    expect(mountCount).toBe(1)
    history.push('/one')

    expect(mountCount).toBe(1)
  })
})
