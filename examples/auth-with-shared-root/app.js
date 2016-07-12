import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router } from 'react-router'

import withExampleBasename from '../withExampleBasename'
import routes from './config/routes'

render((
  <Router
    history={withExampleBasename(browserHistory, __dirname)}
    routes={routes}
  />
), document.getElementById('example'))
