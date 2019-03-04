export function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}