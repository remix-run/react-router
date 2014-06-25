require('./helper');
var URLStore = require('../modules/stores/URLStore');

describe('when a new path is pushed to the URL', function () {
  beforeEach(function () {
    URLStore.push('/a/b/c');
  });

  it('has the correct path', function () {
    expect(URLStore.getCurrentPath()).toEqual('/a/b/c');
  });
});

describe('when a new path is used to replace the URL', function () {
  beforeEach(function () {
    URLStore.push('/a/b/c');
  });

  it('has the correct path', function () {
    expect(URLStore.getCurrentPath()).toEqual('/a/b/c');
  });
});
