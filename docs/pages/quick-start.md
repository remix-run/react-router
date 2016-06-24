# Quick Start

First, install it:

```
npm install react-router history
```

Now do some stuff

```js
// import a couple components
import { Router, Match } from 'react-router'

// render a router
const App = () => (
  <Router>
    <h1>React Router App</h1>
    {/* create some links */}

    {/* match some patterns, we use path-to-regexp for the patterns */}
    <Match pattern="/" exactly component={Home}/>
    <Match pattern="/about" component={About}/>
    <Match pattern="/users/:name" component={User}/>
  </Router>
)
```

```markup
<lol>
  <this>
   is cool
  </this>
</lol>
```

