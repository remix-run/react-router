import React from 'react';
import HashHistory from 'react-router/lib/HashHistory';
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

  statics: {
    loadProps(params, cb) {
      loadContacts(cb);
    },

    Loader: Spinner
  },

  handleSubmit(event) {
    event.preventDefault();
    createContact({
      first: event.target.elements[0].value,
      last: event.target.elements[1].value
    }, (err, data) => {
      this.props.onPropsDidChange();
      this.transitionTo(`/contact/${data.contact.id}`);
    });
    event.target.reset();
    event.target.elements[0].focus();
  },

  render() {
    return (
      <div className="App">
        <form onSubmit={this.handleSubmit}>
          <input placeholder="First name"/> <input placeholder="Last name"/>{' '}
          <button type="submit">submit</button>
        </form>
        <div style={{display: 'flex'}}>
          <ul style={{opacity: this.props.propsAreLoadingLong ? 0.5 : 1, padding: 20}}>
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

  statics: {
    loadProps(params, cb) {
      //console.log('Contact loadProps');
      loadContact(params.id, cb);
    },

    Loader: Spinner
  },

  getInitialState() {
    return {
      longLoad: false
    };
  },

  render() {
    var { contact } = this.props;

    return (
      <div style={{opacity: this.props.propsAreLoadingLong ? 0.5 : 1}}>
        <p><Link to="/">Back</Link></p>
        <h1>{contact.first} {contact.last}</h1>
        <img key={contact.avatar} src={contact.avatar} height="200"/>
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
  <Router history={HashHistory} createElement={AsyncProps.createElement}>
    <Route path="/" component={App} indexComponent={Index}>
      <Route path="contact/:id" component={Contact}/>
    </Route>
  </Router>
), document.getElementById('example'));
