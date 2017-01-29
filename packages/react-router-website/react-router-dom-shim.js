export * from 'react-router-dom'

// Need to shim <BrowserRouter> so people can copy/paste
// examples into create-react-app but our docs site already
// has a <BrowserRouter> rendered up top!
export BrowserRouter from './components/ExampleRouter'
