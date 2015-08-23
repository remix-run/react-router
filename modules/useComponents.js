import getComponents from './getComponents';

export default function useComponents(routes) {
  return match => (prevState, location, callback) => {
    // TODO: the first arg to `getComponents()` should just be `activeRoutes`
    getComponents({ routes: prevState.routes || [] }, (error1, components) => {
      if (error1) {
        callback(error);
        return;
      }

      match({ ...prevState, components }, location, (error2, nextState, redirectInfo) => {
        if (error2 || redirectInfo) {
          callback(error2, null, redirectInfo);
          return;
        }
        callback(null, nextState);
      });
    });
  };
}
