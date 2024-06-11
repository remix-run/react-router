---
title: OpenTelemetry
new: true
---

# OpenTelemetry

React-router is instrumented to track routing events using OpenTelemetry. This allows you to automatically see them in your observability platform. For each route transition, a span named `route-change` is created with the following attributes:
* `react_router.current.url.path` - the path of the current URL
* `react_router.current.url.query` - the query string of the current URL
* `react_router.next.url.path` - the path of the next URL
* `react_router.next.url.query` - the query string of the next URL
* `react_router.history_action.path` - type of change in the history stack (push, replace, pop)

## Providing Span Context

Context is important to understand the relationship between spans. To provide context, you can set up a `spanContext` in the location state. This context will be attached to the span created for the route change. Here is an example of how you can set up the context:

```jsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/new-route', { state: { spanContext: { traceId: '1234', spanId: '5678' } } });
  }

  return <button onClick={handleClick}>Go to new route</button>;
}
```

or directly in the `Link` component:

```jsx
import { Link } from 'react-router-dom';

const MyComponent = () => {
  return <Link to="/new-route" state={{ spanContext: { traceId: '1234', spanId: '5678' }}}>Go to new route</Link>;
}
```