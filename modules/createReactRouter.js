import compose from './compose';
import createRouter from './createRouter';
import useTransitionHooks from './useTransitionHooks';
import useComponents from './useComponents';
import useJSXRoutes from './useJSXRoutes';
import addIsActive from './addIsActive';

/**
 * A router-creating function that bundles the basic enhancers most people will
 * need for routing with React.
 */
const createReactRouter = compose(
  addIsActive,
  useComponents,
  useTransitionHooks,
  useJSXRoutes,
  createRouter
);

export default createReactRouter;
