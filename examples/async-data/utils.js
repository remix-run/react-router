var API = 'http://addressbook-api.herokuapp.com';
var _cache = {};

localStorage.token = localStorage.token || (Date.now()*Math.random());

export function loadContacts(cb) {
  getJSON(`${API}/contacts`, cb);
}

export function loadContact(id, cb) {
  getJSON(`${API}/contacts/${id}`, cb);
}

export function createContact(contact, cb) {
  postJSON(`${API}/contacts`, contact, cb);
}

export function shallowEqual(a, b) {
  var ka = 0;
  var kb = 0;
  for (var key in a) {
    if (a.hasOwnProperty(key) && a[key] !== b[key])
      return false;
    ka++;
  }

  for (var key in b) {
    if (b.hasOwnProperty(key))
      kb++;
  }

  return ka === kb;
}



function postJSON(url, data, cb) {
  var req = new XMLHttpRequest();
  req.onload = function () {
    cb(null, JSON.parse(req.response));
  };
  req.open('POST', url);
  req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  req.setRequestHeader('authorization', localStorage.token);
  req.send(JSON.stringify(data));
}

function getJSON(url, cb) {
  if (_cache[url]) {
    cb(null, _cache[url]);
    return;
  }
  var req = new XMLHttpRequest();
  req.onload = function () {
    if (req.status === 404) {
      cb(new Error('not found'));
    } else {
      // fake a slow response every now and then
      setTimeout(function () {
        var data = JSON.parse(req.response);
        cb(null, data);
        _cache[url] = data;
      }, Math.random() > 0.9 ? 0 : 1000);
    }
  };
  req.open('GET', url);
  req.setRequestHeader('authorization', localStorage.token);
  req.send();
}

