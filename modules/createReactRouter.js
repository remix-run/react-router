import createRouter from './createRouter';
import useTransitionHooks from './useTransitionHooks';
import useComponents from './useComponents';
import useJSXRoutes from './useJSXRoutes';

/**
 * A router-creating function that bundles the basic enhancers most people will
 * need for routing with React.
 */
const createReactRouter =
  useComponents(
    useTransitionHooks(
      useJSXRoutes(
        createRouter
      )
    )
  );

export default createReactRouter;
