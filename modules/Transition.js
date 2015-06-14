class Transition {
  
  constructor() {
    this.isCancelled = false;
    this.redirectInfo = null;
    this.abortReason = null;
  }

  to(pathname, query, state) {
    this.redirectInfo = { pathname, query, state };
    this.isCancelled = true;
  }

  abort(reason) {
    this.abortReason = reason;
    this.isCancelled = true;
  }

}

export default Transition;
