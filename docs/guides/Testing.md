React Router Testing With Jest
====================
Testing has become much easier since React Router version 1.x. For Testing prior React Router versions, see   [Old testing docs](https://github.com/ReactTraining/react-router/blob/57543eb41ce45b994a29792d77c86cc10b51eac9/docs/guides/testing.md).

It is recommended that you read the following two tutorials prior:
- [Jest Getting Started docs](https://facebook.github.io/jest/docs/getting-started.html)
- [Jest ReactJS docs](https://facebook.github.io/jest/docs/tutorial-react.html)
- [ReactJS TestUtils docs](https://facebook.github.io/react/docs/test-utils.html)

Testing with React-Router 1.x should just work. But if you are having issues see the following. Many users had issues when upgrading prior setups from react-router 0.x.

Updating from testing setup from React-Router 0.x to 1.x
----------------------------------------------
Firstly, ensure you are using at least the following versions of each package.
- `"react": "^0.14.0"`
- `"react-dom": "^0.14.0"`
- `"react-router": "^1.0.0"`
- `"react-addons-test-utils": "^0.14.0"`
- `"jest": "^0.1.40"`
- `"jest-cli": "^0.10.0"`
- `"babel-jest": "^10.0.1"`

Also, make sure you are using node 4.x

In prior setups, react-tools was needed. This is no longer the case. You will need to remove it from your package.json and environment.

```json
"react-tools": "~0.13.3",
```

Lastly, anywhere you have the following:

```js
var React = require('react/addons')
var TestUtils = React.addons.TestUtils
```

needs to be replaced with this:

```js
import React from 'react'
import { render } from 'react-dom'
import TestUtils from 'react-addons-test-utils'
```

Make sure you do an npm clean, install, etc. and make sure you add react-addons-test-utils and react-dom to your unmocked paths.

```json
  ...
  "unmockedModulePathPatterns": [
    "./node_modules/react",
    "./node_modules/react-dom",
    "./node_modules/react-addons-test-utils",
  ],
  ...

```

Lastly ensure you are using babel-jest for the script preproccessor:

```js
  ...
  "scriptPreprocessor": "./node_modules/babel-jest",
  ...
```


Example:
----------------------------------------------

A component:

```js
//../components/BasicPage.js

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router'


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

jest.unmock('../BasicPage')

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
