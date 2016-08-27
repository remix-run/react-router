import React from 'react'
import Redirect from '../Redirect'
import { renderToString } from 'react-dom/server'

describe('Redirect', () => {
  it('does not freak out when rendered out of context', () => {
    const div = document.createElement('div')
    renderToString(<Redirect to="/nowhere"/>, div)
  })
})

