import createRouter from './createRouter';
import useQueries from 'history/lib/useQueries';
import matchUntilResolved from './matchUntilResolved';
import addNavigation from './addNavigation';
import addIsActive from './addIsActive';
import addSingleLocationSupport from './addSingleLocationSupport';
import { createRoutes } from './RouteUtils';
import useTransitionHooks from './useTransitionHooks';
import useRoutes from './useRoutes';
import useComponents from './useComponents';
import composeMiddleware from './composeMiddleware';
import identityMiddleware from './identityMiddleware';
import compose from './compose';

function identity(t) {
  return t;
}

export default function createReactRouter(createHistory) {
  return options => {
    const { middleware, routes, location, ...rest } = options;

    const nextOptions = {
      ...rest,
      location,
      middleware: composeMiddleware(
        location ? matchUntilResolved : identityMiddleware,
        middleware || identityMiddleware,
        useTransitionHooks,
        useRoutes,
        useComponents
      ),
      routes: createRoutes(routes),
    };

    return compose(
      addNavigation,
      addIsActive,
      createRouter,
      useQueries,
      addSingleLocationSupport,
      createHistory
    )(nextOptions);
  };
}
