import React from 'react'
import Examples from './Examples'
import Header from './Header'
import loadAPIDocs from 'bundle?lazy!./APIDocs' // eslint-disable-line
import Video from './Video'
import Footer from './Footer'
import LoadBundle from './LoadBundle'
import { B } from './bricks'
import BrowserRouter from '../../modules/BrowserRouter'

const App = () => (
  <BrowserRouter>
    <B>
      <Header/>
      <Examples/>
      <Video/>
      <LoadBundle load={loadAPIDocs}>
        {({ mod }) => <mod.default/>}
      </LoadBundle>
      <Footer/>
    </B>
  </BrowserRouter>
)

export default App
