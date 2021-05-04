*\**Warning this guide assumes you are using Typescript*

Working with layouts is not that different from previous versions. Here is a shortened Layout.tsx to get you started:

```
import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div>
      <h2>Layout</h2>
      {/* Instead of passing children, use the Outlet component and react-router-dom will do the rest! */}
      <Outlet />
    </div>
  );
};

export default Layout;
```

Next, import the Layout.tsx into your App.tsx and set up the Router as shown below:

```
import React from 'react';
import Layout from './components/Layout';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path='/' element={<div>Home</div>} />
          <Route path='/invoices' element={<div>Invoices</div>} />
          <Route path='/dashboard' element={<div>Dashboard</div>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
```

Notices that at the '/' path the layout is loaded and there is also another nested route to load the home page content. 
This ensures that the Layout is always loaded, but only the current page is visible as well. If you navigate to '/invoices', you will not see the home component
or the dashboard.
