export function loopAsync(turns, work, callback) {
  var currentTurn = 0;
  var isDone = false;

  function done() {
    isDone = true;
    callback.apply(this, arguments);
  }

  function next() {
    if (isDone)
      return;

    if (currentTurn < turns) {
      currentTurn += 1;
      work.call(this, currentTurn - 1, next, done);
    } else {
      done.apply(this, arguments);
    }
  }

  next();
}

export function mapAsync(array, work, callback) {
  var length = array.length;
  var values = [];

  if (length === 0)
    return callback(null, values);

  var isDone = false;
  var doneCount = 0;

  function done(index, error, value) {
    if (isDone)
      return;

    if (error) {
      isDone = true;
      callback(error);
    } else {
      values[index] = value;

      isDone = (++doneCount === length);

      if (isDone)
        callback(null, values);
    }
  }

  array.forEach(function (item, index) {
    work(item, index, function (error, value) {
      done(index, error, value);
    });
  });
}

export function hashAsync(object, work, callback) {
  var keys = Object.keys(object);

  mapAsync(keys, function (key, index, callback) {
    work(object[key], callback);
  }, function (error, valuesArray) {
    if (error) {
      callback(error);
    } else {
      var values = valuesArray.reduce(function (memo, results, index) {
        memo[keys[index]] = results;
        return memo;
      }, {});

      callback(null, values);
    }
  });
}
