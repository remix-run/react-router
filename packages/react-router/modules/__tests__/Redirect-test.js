import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from '../MemoryRouter'
import Redirect from '../Redirect'
import Route from '../Route'
import Switch from '../Switch'

describe('A <Redirect>', () => {
  describe('inside a <Switch>', () => {
    it('automatically interpolates params', () => {
      const node = document.createElement('div')

      let params

      ReactDOM.render((
        <MemoryRouter initialEntries={[ '/users/mjackson/messages/123' ]}>
          <Switch>
            <Redirect
              from="/users/:username/messages/:messageId"
              to="/:username/messages/:messageId"
            />
            <Route path="/:username/messages/:messageId" render={({ match }) => {
              params = match.params
              return null
            }}/>
          </Switch>
        </MemoryRouter>
      ), node)

      expect(params).toMatchObject({
        username: 'mjackson',
        messageId: '123'
      })
    })
  })
})
