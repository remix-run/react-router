module url from './url';
module store from './route-store';

export default function(name, props) {
  var location = url.getLocation();
  var route = store.lookup(name);
  if (!route) {
    throw new Error('No route found for `'+name+'`');
    return;
  }
  var base = location === 'history' ? '/' : '#/';
  base += route.props.path;
  if (base.indexOf(':') === -1) {
    return base;
  }
  return base.split('/').map(function(segment) {
    if (segment.indexOf(':') === -1) {
      return segment;
    }
    var propName = segment.substr(1);
    if (!props[propName]) throw new Error('you need a property named '+propName+' to transition to route "'+name);
    return props[propName];
  }).join('/');
};

