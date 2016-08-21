import expect from 'expect'
import { renderToString } from 'react-dom/server'
import React from 'react'
import MemoryRouter from '../MemoryRouter'
import Match from '../Match'

describe('MemoryHistory', () => {

  it('works', () => {
    const markup = renderToString(
      <MemoryRouter location="/foo">
        <Match pattern="/foo" render={() => (
          <div>matched</div>
        )}/>
      </MemoryRouter>
    )

    expect(markup).toMatch(/matched/)
  })

})
