'use strict';

exports.__esModule = true;
exports.isPromise = isPromise;
function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}