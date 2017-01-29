import React from 'react'

// We have to import this one using a relative path because we
// shim <BrowserRouter> in our webpack config to use <ExampleRouter>
import BrowserRouter from '../../../react-router-dom/BrowserRouter'

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
