import React from 'react'
import BrowserRouter from '../../react-router-dom/modules/BrowserRouter'

import { B } from './bricks'
import Examples from './Examples'
import Header from './Header'
import APIDocs from './APIDocs'
import Video from './Video'
import Footer from './Footer'
import LoadBundle from './LoadBundle'
import NewsletterSignup from './NewsletterSignup'

const App = () => (
  <BrowserRouter>
    <B>
      <Header/>
      <Examples/>
      <Video/>
      <APIDocs/>
      <NewsletterSignup/>
      <Footer/>
    </B>
  </BrowserRouter>
)

export default App
