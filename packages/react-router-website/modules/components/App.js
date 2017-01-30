import React from 'react'

// We have to import this one using a relative path because we
// shim <BrowserRouter> in our webpack config to use <ExampleRouter>
import BrowserRouter from '../../../react-router-dom/BrowserRouter'

import { B } from './bricks'
import Header from './Header'
import Examples from './Examples'
import APIDocs from './APIDocs'
import NewsletterSignup from './NewsletterSignup'
import Footer from './Footer'

const base = document.querySelector('base')
const baseHref = base ? base.getAttribute('href') : '/'

const App = () => (
  <BrowserRouter basename={baseHref.replace(/\/$/, '')}>
    <B>
      <Header/>
      <Examples/>
      <APIDocs/>
      <NewsletterSignup/>
      <Footer/>
    </B>
  </BrowserRouter>
)

export default App
