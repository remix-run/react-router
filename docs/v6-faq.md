# Frequently Asked Questions About React Router v6

Here are some questions that people commonly have about React Router v6:

## What happened to withRouter? I need it!

This question usually stems from the fact that you're using React class
components, which don't support hooks. In React Router v6, we fully embraced
hooks and use them to share all the router's internal state. But that doesn't
mean you can't use the router. You just need a wrapper.

```js
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function withRouter(Component) {
   function ComponentWithRouterProp(props) {
     let location = useLocation();
     let navigate = useNavigate();
     let params = useParams();
     return (
       <Component
         {...props}
         router={{ location, navigate, params }}
       />
     );
   }

   return ComponentWithRouterProp;
}
```
