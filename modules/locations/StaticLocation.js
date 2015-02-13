var invariant = require('react/lib/invariant');

function throwCannotModify() {
  invariant(false, 'You cannot modify a static location');
}

function StaticLocation(path) {
  this.path = path;
}

StaticLocation.prototype.push = throwCannotModify;
StaticLocation.prototype.replace = throwCannotModify;
StaticLocation.prototype.pop = throwCannotModify;

StaticLocation.prototype.getCurrentPath = function () {
  return this.path;
};

StaticLocation.prototype.toString = function () {
  return '<StaticLocation path="' + this.path + '">';
};

module.exports = StaticLocation;
