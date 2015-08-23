import compose from './compose';

export default function composeMiddleware(...middlewares) {
  return routes => {
    const finalMiddlewares = middlewares.map(m => m(routes));
    return match => compose(
      ...finalMiddlewares,
      match
    );
  };
}
