# Quick Start

If you've got a build, install React Router from npm:

```
npm install react-router history
```

If you're just screwing around, use a script tag, you'll find the lib on
`window.ReactRouter`.

```html
<script src="https://npmcdn.com/react-router/4.0.0"></script>
```

## First Principles

The first principles of React Router are components, `location`, and `Match`.

- Everything is a component; so, if you know React, you know React Router.
- A `location` is data that represents where a visitor is--or wants to
  go--in your app.
- `<Match/>` turns a `location` into UI.

## Copy Paste

```js
import React from 'react'
import { render } from 'react-dom'

// 1. import a few components
import { Router, Match, Miss, Link } from 'react-router'

const App = () => (
  // 2. render a `Router`
  <Router>
    <ul>
      {/* 3. Link to some paths with `Link` */}
      <li><Link to="/">Home</Link></li>
      <li><Link to="/about">About</Link></li>
      <li><Link to="/topics">Topics</Link></li>
    </ul>

    <hr/>

    {/* 4. Render a `Match`. When the current location matches
           the `pattern` then the `component` will render.
    */}
    <Match exactly pattern="/" component={Home} />
    <Match pattern="/about" component={About} />
    <Match pattern="/topics" component={Topics} />

    {/* `Miss` will render when none of it's siblings match */}
    <Miss component={NoMatch}/>
  </Router>
)

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
)

const About = () => (
  <div>
    <h2>About</h2>
  </div>
)

const Miss = ({ location }) => (
  <div>
    <h2>Whoops</h2>
    <p>Sorry but {location.pathname} didn’t match any pages</p>
  </div>
)

const Topics = ({ pathname, pattern }) => (
  // 5. Components rendered by a `Match` get some routing-specific
  //    props, like the portion of the parent `pattern` that was
  //    matched against the current `location.pathname`, in this case
  //    `/topics`
  <div>
    <h2>Topics</h2>
    <ul>
      {/* 6. Use the parent's matched pathname to link relatively */}
      <li><Link to={`${pathname}/rendering`}>Rendering with React</Link></li>
      <li><Link to={`${pathname}/components`}>Components</Link></li>
      <li><Link to={`${pathname}/props-v-state`}>Props v. State</Link></li>
    </ul>

    {/* 7. Render more `Match` components to get nesting naturally
           within the render lifecycle. Use the parent's matched
           pathname to nest the url.
    */}
    <Match pattern={`${pathname}/:topicId`} component={Topic}/>

    {/* 8. use the `render` prop to conveniently inline rendering */}
    <Match pattern={pathname} exactly render={() => (
      <h3>Please select a topic</h3>
    )}/>
  </div>
)

const Topic = ({ params }) => (
  // 9. the dynamic segments of a `pattern` (in this case `:topicId`)
  //    are parsed and sent to the component from `Match`.
  <div>
    <h3>{params.topicId}</h3>
  </div>
)

ReactDOM.render(<App/>)
```

That should get you started. We encourage you to review the examples and
read the API docs for more inspiration.

Happy routing!

