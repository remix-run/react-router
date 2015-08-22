import createRouter from './createRouter';
import addNavigation from '../addNavigation';
import { createRoutes } from '../RouteUtils';
import useTransitionHooks from './useTransitionHooks';
import useRoutes from './useRoutes';
import useComponents from './useComponents';
import composeMiddleware from './composeMiddleware';
import compose from '../compose';

function identityMiddleware() {
  return match => match
}

export default function createReactRouter(createHistory) {
  return options => {
    const { middleware, routes } = options;

    const nextOptions = {
      ...options,
      middleware: composeMiddleware(
        middleware || identityMiddleware,
        useTransitionHooks,
        useRoutes,
        useComponents
      ),
      routes: createRoutes(routes),
    };

    return compose(
      addNavigation,
      createRouter,
      createHistory
    )(nextOptions);
  };
}
