import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import routes from './config/routes'
import { createHistory, useBasename } from 'history'

const history = useBasename(createHistory)({
  basename: '/auth-with-shared-root'
})

render(<Router history={history} routes={routes}/>, document.getElementById('example'))
