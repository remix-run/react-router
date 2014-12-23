var React = require('react');
var Router = require('react-router');
var whenKeys = require('when/keys');
var EventEmitter = require('events').EventEmitter;
var { Route, DefaultRoute, RouteHandler, Link } = Router;

var API = 'http://addressbook-api.herokuapp.com';
var loadingEvents = new EventEmitter();

function getJSON(url) {
  if (getJSON._cache[url])
    return Promise.resolve(getJSON._cache[url]);

  return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest();
    req.onload = function () {
      if (req.status === 404) {
        reject(new Error('not found'));
      } else {
        // fake a slow response every now and then
        setTimeout(function () {
          var data = JSON.parse(req.response);
          resolve(data);
          getJSON._cache[url] = data;
        }, Math.random() > 0.5 ? 0 : 1000);
      }
    };
    req.open('GET', url);
    req.send();
  });
}
getJSON._cache = {};

var App = React.createClass({

  statics: {
    fetchData (params) {
      return getJSON(`${API}/contacts`).then((res) => res.contacts);
    }
  },

  getInitialState () {
    return { loading: false };
  },

  componentDidMount () {
    var timer;
    loadingEvents.on('loadStart', () => {
      clearTimeout(timer);
      // for slow responses, indicate the app is thinking
      // otherwise its fast enough to just wait for the
      // data to load
      timer = setTimeout(() => {
        this.setState({ loading: true });
      }, 300);
    });

    loadingEvents.on('loadEnd', () => {
      clearTimeout(timer);
      this.setState({ loading: false });
    });
  },

  renderContacts () {
    return this.props.data.contacts.map((contact, i) => {
      return (
        <li key={i}>
          <Link to="contact" params={contact}>{contact.first} {contact.last}</Link>
        </li>
      );
    });
  },

  render () {
    return (
      <div className={this.state.loading ? 'loading' : ''}>
        <ul>
          {this.renderContacts()}
        </ul>
        <RouteHandler {...this.props}/>
      </div>
    );
  }
});

var Contact = React.createClass({
  statics: {
    fetchData (params) {
      return getJSON(`${API}/contacts/${params.id}`).then((res) => res.contact);
    }
  },

  render () {
    var { contact } = this.props.data;
    return (
      <div>
        <p><Link to="contacts">Back</Link></p>
        <h1>{contact.first} {contact.last}</h1>
        <img key={contact.avatar} src={contact.avatar}/>
      </div>
    );
  }
});

var Index = React.createClass({
  render () {
    return (
      <div>
        <h1>Welcome!</h1>
      </div>
    );
  }
});

var routes = (
  <Route name="contacts" path="/" handler={App}>
    <DefaultRoute name="index" handler={Index}/>
    <Route name="contact" path="contact/:id" handler={Contact}/>
  </Route>
);

function fetchData(routes, params) {
  return whenKeys.all(routes.filter((route) => {
    return route.handler.fetchData;
  }).reduce((data, route) => {
    data[route.name] = route.handler.fetchData(params);
    return data;
  }, {}));
}

Router.run(routes, function (Handler, state) {
  loadingEvents.emit('loadStart');

  fetchData(state.routes, state.params).then((data) => {
    loadingEvents.emit('loadEnd');
    React.render(<Handler data={data}/>, document.getElementById('example'));
  });
});
