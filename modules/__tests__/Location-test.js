var expect = require('expect');
var Location = require('../Location');

describe('Location', function () {
  var location;

  describe('with a query string', function () {
    beforeEach(function () {
      location = new Location('/the/path?the=query');
    });

    it('knows its pathname', function() {
      expect(location.getPathname()).toEqual('/the/path');
    });

    it('knows its query string', function() {
      expect(location.getQueryString()).toEqual('the=query');
    });
  });

  describe('without a query string', function () {
    beforeEach(function () {
      location = new Location('/the/path');
    });

    it('knows its pathname', function() {
      expect(location.getPathname()).toEqual('/the/path');
    });

    it('has an empty query string', function() {
      expect(location.getQueryString()).toEqual('');
    });
  });
});
