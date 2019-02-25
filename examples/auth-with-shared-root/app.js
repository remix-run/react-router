import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router } from '@americanexpress/one-app-router'

import withExampleBasename from '../withExampleBasename'
import routes from './config/routes'

render((
  <React.StrictMode>
    <Router
      history={withExampleBasename(browserHistory, __dirname)}
      routes={routes}
    />
  </React.StrictMode>
), document.getElementById('example'))
