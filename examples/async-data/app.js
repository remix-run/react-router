import React from 'react';
import { history } from 'react-router/lib/HashHistory';
import { Router, Route, Link, Navigation } from 'react-router';
import { loadContacts, loadContact, createContact } from './utils';
import AsyncProps from 'react-router/lib/experimental/AsyncProps';

var Spinner = React.createClass({
  render() {
    return (
      <div style={{textAlign: 'center', padding: 50}}>
        <img src="spinner.gif" width="64" height="64"/>
      </div>
    );
  }
});

var App = React.createClass({
  mixins: [ Navigation ],

  getDefaultProps() {
    return { contacts: [] };
  },

  statics: {
    loadProps(params, cb) {
      loadContacts(cb);
    }
  },

  handleSubmit(event) {
    event.preventDefault();
    createContact({
      first: event.target.elements[0].value,
      last: event.target.elements[1].value
    }, (err, data) => {
      this.props.reloadAsyncProps();
      this.transitionTo(`/contact/${data.contact.id}`);
    });
    event.target.reset();
    event.target.elements[0].focus();
  },

  render() {
    // super smooth user feedback
    var appStyle = {
      transition: this.props.loading ? 'opacity 500ms ease 250ms' : 'opacity 150ms',
      opacity: this.props.loading ? 0.5 : 1
    };

    return (
      <div className="App" style={appStyle}>
        <form onSubmit={this.handleSubmit}>
          <input placeholder="First name"/> <input placeholder="Last name"/>{' '}
          <button type="submit">submit</button>
        </form>
        <div style={{display: 'flex'}}>
          <ul style={{opacity: this.props.loadingAsyncProps ? 0.5 : 1, padding: 20}}>
            {this.props.contacts.map((contact, i) => (
              <li key={contact.id}>
                <Link to={`/contact/${contact.id}`}>{contact.first} {contact.last}</Link>
              </li>
            ))}
          </ul>
          <div style={{padding: 20}}>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
});

var Contact = React.createClass({

  getDefaultProps() {
    return { contact: {} };
  },

  statics: {
    loadProps(params, cb) {
      loadContact(params.id, cb);
    }
  },

  render() {
    var { contact } = this.props;

    return (
      <div style={{opacity: this.props.loadingAsyncProps ? 0.5 : 1}}>
        <p><Link to="/">Back</Link></p>
        <h1>{contact.first} {contact.last}</h1>
        <p><img key={contact.avatar} src={contact.avatar} height="200"/></p>
      </div>
    );
  }
});

var Index = React.createClass({
  render() {
    return (
      <div>
        <h1>Welcome!</h1>
      </div>
    );
  }
});

React.render((
  <Router history={history} createElement={AsyncProps.createElement}>
    <Route component={AsyncProps} renderInitialLoad={() => <Spinner/> }>
      <Route component={App}>
        <Route path="/" component={Index}/>
        <Route path="contact/:id" component={Contact}/>
      </Route>
    </Route>
  </Router>
), document.getElementById('example'));
