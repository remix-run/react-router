import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router } from 'react-router'

import withBasename from '../withBasename'
import routes from './config/routes'

render((
  <Router history={withBasename(browserHistory, __dirname)} routes={routes}/>
), document.getElementById('example'))
