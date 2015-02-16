
function Session () {
}

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
  if (state && state.id && state.current) {
    this._id = state.id;
    this._current = parseInt(state.current);
    return true;
  } else {
    this._id = Math.random().toString(36).substr(2, 9); // https://gist.github.com/gordonbrander/2230317
    this._current = 1;
    return false;
  }
};


module.exports = Session;
