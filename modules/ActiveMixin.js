var ActiveMixin = {

  isActive() {
    return this.router.isActive.apply(this.router, arguments);
  }

};

export default ActiveMixin;
