import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import { Simulate } from 'react-addons-test-utils'
import createMemoryHistory from 'history/createMemoryHistory'
import MemoryRouter from '../MemoryRouter'
import Router from '../Router'
import BrowserPrompt from '../BrowserPrompt'
import Redirect from '../Redirect'
import Route from '../Route'
import Link from '../Link'
import Switch from '../Switch'

describe('<BrowserPrompt>', () => {

  it('renders BrowserPrompt', () => {

    const div = document.createElement('div')
    const TEXT = 'Mrs. Kato'
    let browserPrompt = <BrowserPrompt 
      beforeUnload={true} 
      when={true} />

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => (
          <div>
            <h1>{TEXT}</h1>
            {browserPrompt}
        </div>
        )}/>
      </MemoryRouter>
    ), div)
    expect(div.innerHTML).toContain(TEXT)
    expect(browserPrompt.props).toEqual({ beforeUnload: true, when: true })
  })
});