function deepExtend(destination, source) {
  for (const property in source) {
    if (source[property] && source[property].constructor &&
     source[property].constructor === Object) {
      destination[property] = destination[property] || {};
      deepExtend(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }
  return destination;
}

const staticProperties = [
  'contextTypes',
  'childContextTypes',
  'propTypes',
  'defaultProps'
];

export default function createDecorator(mixin) {
  return function(target) {
    const mixinCopy = Object.assign({}, mixin);
    const staticExtend = {};

    staticProperties.forEach(function(key) {
      staticExtend[key] = mixinCopy[key];
      delete mixinCopy[key];
    });

    deepExtend(target, staticExtend);
    deepExtend(target.prototype, mixinCopy);
  }
}
