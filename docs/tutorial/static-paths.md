# Static Paths with Element Prop

This tutorial shows how to render static paths with the new `element` prop.

## TODO

Add description for the tutorial outline.

## Code Example

[CodeSandbox](https://codesandbox.io/s/react-router-v6-tutorial-2-vcr98?file=/src/App.js)

```js
// src/App.js

import React from 'react';
import Home from './components/Home';
import { Route, Link, Routes } from 'react-router-dom';

const App = () => {
  return (
    <div className="App">
      <nav>
        <h1 className="store-header">Christina's Nursery</h1>
        <div className="nav-links">
          <Link to="/">Home</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
};
export default App;
```

![Screenshot of the store app we will be building](https://user-images.githubusercontent.com/21039864/81329703-2af03e00-905c-11ea-9cac-ceec123b4c72.png)
