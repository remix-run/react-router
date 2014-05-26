import Link from './components/link';
import Route from './components/route';
import Routes from './components/routes';
module routeStore from './stores/route-store';
module urlStore from './stores/url-store';

export function transitionTo(routeName, params) {
  urlStore.push(Link.makeHref(routeName, params));
}

export function replaceWith(routeName, params) {
  urlStore.replace(Link.makeHref(routeName, params));
}

export function getCurrentInfo() {
  var active = routeStore.getActive();
  var current = active[active.length - 1];

  return {
    name: current.route.props.name,
    params: current.params
  };
}

export {
  Link,
  Route,
  Routes
};
