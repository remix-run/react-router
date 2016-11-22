import React from 'react'
import Examples from './Examples'
import Header from './Header'
import APIDocs from './APIDocs'
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
      <APIDocs/>
      <Footer/>
    </B>
  </BrowserRouter>
)

export default App
