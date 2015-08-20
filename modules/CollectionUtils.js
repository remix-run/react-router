export function pick(obj, test) {
  return Object.keys(obj).reduce((result, key) => {
    if (test(key, obj[key])) {
      result[key] = obj[key];
    }
    return result
  }, {});
}

export function inArray(arr, key) {
  return arr.indexOf(key) > -1;
}
