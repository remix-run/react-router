One App Router Testing With Jest
====================

Example:
----------------------------------------------

A component:

```js
//../components/BasicPage.js

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'
import { Link } from '@americanexpress/one-app-router'


export default class BasicPage extends Component {
  static propTypes = {
    authenticated: PropTypes.bool
  }

  render() {
    return (
      <div>
        { this.props.authenticated ? (
            <div>
              <Link to="/admin"><Button bsStyle="primary">Your account</Button></Link>
            </div>
          ) : (
            <div>
              <Link to="/admin"><Button bsStyle="primary">Login</Button></Link>
            </div>
          )
        }
      </div>
    )
  }
}
```

The test for that component:

```js
//../components/__tests__/BasicPage-test.js

import TestUtils from 'react-addons-test-utils'
import ReactDOM from 'react-dom'
import React from 'react'
import BasicPage from '../BasicPage'

describe('BasicPage', function() {

  it('renders the Login button if not logged in', function() {
    let page = TestUtils.renderIntoDocument(<BasicPage />)
    let button = TestUtils.findRenderedDOMComponentWithTag(page, 'button')
    expect(ReactDOM.findDOMNode(button).textContent).toBe('Login')
  })

  it('renders the Account button if logged in', function() {
    let page = TestUtils.renderIntoDocument(<BasicPage authenticated={true} />)
    let button = TestUtils.findRenderedDOMComponentWithTag(page, 'button')
    expect(ReactDOM.findDOMNode(button).textContent).toBe('Your Account')
  })
})
```
