import warning from 'warning';
import DOMHistory from './DOMHistory';
import { addEventListener, removeEventListener, getHashPath, replaceHashPath } from './DOMUtils';
import { isAbsolutePath } from './URLUtils';

var DefaultQueryKey = '_qk';

function ensureSlash() {
  var path = getHashPath();

  if (isAbsolutePath(path))
    return true;

  replaceHashPath('/' + path);

  return false;
}

function addQueryStringValueToPath(path, key, value) {
  return path + (path.indexOf('?') === -1 ? '?' : '&') + `${key}=${value}`;
}

function getQueryStringValueFromPath(path, key) {
  var match = path.match(new RegExp(`\\?.*?\\b${key}=(.+?)\\b`));
  return match && match[1];
}

/**
 * A history implementation for DOM environments that uses window.location.hash
 * to store the current path. This is essentially a hack for older browsers that
 * do not support the HTML5 history API (IE <= 9).
 *
 * Support for persistence of state across page refreshes is provided using a
 * combination of a URL query string parameter and DOM storage. However, this
 * support is not enabled by default. In order to use it, create your own
 * HashHistory.
 *
 *   import HashHistory from 'react-router/lib/HashHistory';
 *   var StatefulHashHistory = new HashHistory({ queryKey: '_key' });
 *   React.render(<Router history={StatefulHashHistory} .../>, ...);
 */
class HashHistory extends DOMHistory {

  constructor(options={}) {
    super(options);
    this.handleHashChange = this.handleHashChange.bind(this);
    this.queryKey = options.queryKey;

    if (typeof this.queryKey !== 'string')
      this.queryKey = this.queryKey ? DefaultQueryKey : null;
  }

  setup() {
    if (this.location != null)
      return;

    ensureSlash();

    var path = getHashPath();
    var key = getQueryStringValueFromPath(path, this.queryKey);

    super.setup(path, { key });

    addEventListener(window, 'hashchange', this.handleHashChange);
  }

  teardown() {
    removeEventListener(window, 'hashchange', this.handleHashChange);
    super.teardown();
  }

  handleHashChange() {
    if (!ensureSlash())
      return;

    if (this._ignoreNextHashChange) {
      this._ignoreNextHashChange = false;
    } else {
      var path = getHashPath();
      var key = getQueryStringValueFromPath(path, this.queryKey);
      this.handlePop(path, { key });
    }
  }

  push(path, key) {
    var actualPath = path;
    if (this.queryKey)
      actualPath = addQueryStringValueToPath(path, this.queryKey, key);


    if (actualPath === getHashPath()) {
      warning(
        false,
        'HashHistory can not push the current path'
      );
    } else {
      this._ignoreNextHashChange = true;
      window.location.hash = actualPath;
    }

    return { key: this.queryKey && key };
  }


  replace(path, key) {
    var actualPath = path;
    if (this.queryKey)
      actualPath = addQueryStringValueToPath(path, this.queryKey, key);


    if (actualPath !== getHashPath())
      this._ignoreNextHashChange = true;

    replaceHashPath(actualPath);

    return { key: this.queryKey && key };
  }

  makeHref(path) {
    return '#' + path;
  }
}

export var history = new HashHistory;
export default HashHistory;
