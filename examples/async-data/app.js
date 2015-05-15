var React = require('react/addons');
var { createRouter, Route, Link } = require('react-router');
var HashHistory = require('react-router/HashHistory');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

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
    loadAsyncProps (params) {
      return getJSON(`${API}/contacts`).then(function (res) {
        return {
          contacts: res.contacts
        };
      });
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
    return this.props.contacts.map((contact, i) => {
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
        {this.props.children || <Index/>}
      </div>
    );
  }
});

var Contact = React.createClass({
  statics: {
    loadAsyncProps (params) {
      return getJSON(`${API}/contacts/${params.id}`).then(function (res) {
        return { contact: res.contact };
      });
    }
  },

  render () {
    var contact = this.props.contact;
    return (
      <div>
        <p><Link to="/">Back</Link></p>
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

var Router = createRouter((
  <Route name="contacts" path="/" component={App}>
    <Route name="contact" path="contact/:id" component={Contact}/>
  </Route>
));

function loadAsyncProps(components, params) {
  var promises = components.map(function (Component) {
    if (Component.loadAsyncProps) {
      return Component.loadAsyncProps(params).then(function (data) {
        // create a Higher Order Component and pass the async props in
        return React.createClass({
          render () {
            return <Component {...this.props} {...data}/>
          }
        });
      });
    } else {
      return Component;
    }
  });
  return Promise.all(promises);
}

HashHistory.listen(function (location) {
  Router.match(location, function (err, routerProps) {
    loadingEvents.emit('loadStart');

    loadAsyncProps(routerProps.components, routerProps.params).then((components) => {
      loadingEvents.emit('loadEnd');

      // put the higher order components into the props before rendering
      var props = assign({}, routerProps, { components: components });
      React.render(<Router {...props}/>, document.getElementById('example'));
    });
  });
});
