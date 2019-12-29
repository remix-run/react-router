# Deep Redux Integration

Redux is an important part of the React ecosystem. We want to make the integration of React Router and Redux as seamless as possible for people wanting to use both. To that end, some folks want to:

1. Synchronize the routing data with, and accessed from, the store.
2. Be able to navigate by dispatching actions.
3. Have support for time travel debugging for route changes in the Redux devtools.

All of this requires deeper integration.

Our recommendation is **not to keep your routes in your Redux store at all**. Here's our reasoning:

1. Routing data is already a prop of most of your components that care about it. Whether it comes from the store or the router, your component's code is largely the same.
2. In most cases, you can use `Link`, `NavLink` and `Redirect` to perform navigation actions. Sometimes you might also need to navigate programmatically, after some asynchronous task that was originally initiated by an action. For example, you might dispatch an action when the user submits a login form. Your [thunk](https://github.com/reduxjs/redux-thunk), [saga](https://redux-saga.js.org/) or other async handler then authenticates the credentials, _then_ it needs to somehow navigate to a new page if successful. The solution here is simply to include the `history` object (provided to all route components) in the payload of the action, and your async handler can use this to navigate when appropriate.
3. Route changes are unlikely to matter for time travel debugging. The only obvious case is to debug issues with your router/store synchronization, and this problem goes away if you don't synchronize them at all.

But if you feel strongly about synchronizing your routes with your store, you may want to try [Connected React Router](https://github.com/supasate/connected-react-router), a third party binding for React Router and Redux.
