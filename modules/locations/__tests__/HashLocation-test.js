var expect = require('expect');
var HashLocation = require('../HashLocation');

describe('HashLocation.getCurrentPath', function() {

  //this test is needed because Firefox will pre-decode the value retrieved from
  //window.location.hash
  it('returns a properly decoded equivalent of what window.location.hash is set to', function() {
    window.location.hash = '';
    expect(HashLocation.getCurrentPath()).toBe('');

    window.location.hash = 'asdf';
    expect(HashLocation.getCurrentPath()).toBe('asdf');

    window.location.hash = 'test+spaces';
    expect(HashLocation.getCurrentPath()).toBe('test spaces');

    window.location.hash = 'first%2Fsecond';
    expect(HashLocation.getCurrentPath()).toBe('first%2Fsecond');

    window.location.hash = 'first/second';
    expect(HashLocation.getCurrentPath()).toBe('first/second');

    window.location.hash = 'first%252Fsecond';
    expect(HashLocation.getCurrentPath()).toBe('first%2Fsecond');

    //decodeURI doesn't handle lone percents
    window.location.hash = '%';
    expect(function() {
      HashLocation.getCurrentPath();
    }).toThrow(URIError);

    window.location.hash = '%25';
    expect(HashLocation.getCurrentPath()).toBe('%');

    window.location.hash =
        'complicated+string/full%2Fof%3Fspecial%25chars%2520and%23escapes%E1%88%B4';
    expect(HashLocation.getCurrentPath())
        .toBe('complicated string/full%2Fof%3Fspecial%chars%20and%23escapesሴ');
  });

  afterEach(function() {
    window.location.hash = '';
  });
});
