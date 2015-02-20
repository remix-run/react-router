
function Session () {
}

Session.prototype.isValidState = function (state) {
  return state && state.id && state.current;
};

Session.prototype.getState = function () {
  return {
    id: this._id,
    current: this._current
  };
};

Session.prototype.next = function () {
  this._current += 1;
  return this.getState();
};

Session.prototype.setState = function (state) {
  this._id = state.id;
  this._current = parseInt(state.current);
};

Session.prototype.reset = function () {
  this._id = Math.random().toString(36).substr(2, 9); // https://gist.github.com/gordonbrander/2230317
  this._current = 1;
  return this.getState();
};


module.exports = Session;
