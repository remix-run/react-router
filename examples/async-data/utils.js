//var API = 'http://addressbook-api.herokuapp.com';
var API = 'http://localhost:3000';

localStorage.token = localStorage.token || (Date.now()*Math.random());

export function loadContacts(cb) {
  getJSON(`${API}/contacts`, cb);
}

export function loadContact(id, cb) {
  getJSON(`${API}/contacts/${id}`, cb);
}

export function createContact(contact, cb) {
  postJSON(`${API}/contacts`, { contact }, cb);
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
  var req = new XMLHttpRequest();
  req.onload = function () {
    if (req.status === 404) {
      cb(new Error('not found'));
    } else {

      var time = 0;
      // fake a spotty server
      var time = Math.random() * 1000;
      // for a really spotty server:
      //var time = Math.random() * 5000;

      setTimeout(function () {
        var data = JSON.parse(req.response);
        cb(null, data);
      }, time);
    }
  };
  req.open('GET', url);
  req.setRequestHeader('authorization', localStorage.token);
  req.send();
}

