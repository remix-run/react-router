import compose from '../compose';

export default function composeMiddleware(...middlewares) {
  return routes => {
    middlewares = middlewares.map(m => m(routes));
    return match => compose(
      ...middlewares,
      match
    );
  };
}
