import React from 'react';
import HashHistory from 'react-router/lib/HashHistory';
import { Router, Route, Link } from 'react-router';
import { loadContacts, loadContact, createContact, shallowEqual } from './utils';

var App = React.createClass({
  statics: {
    loadProps(params, cb) {
      console.log('loading App props');
      loadContacts(cb);
    }
  },

  getInitialState() {
    return {
      longLoad: false
    };
  },

  handleSubmit(event) {
    var [ first, last ] = event.target.elements;

    createContact({
      first: first.value,
      last: last.value
    }, this.props.onPropsDidChange);
  },

  render() {
    return (
      <div className={this.props.propsAreLoading ? 'loading' : ''}>
        <form onSubmit={this.handleSubmit}>
          <input placeholder="First name"/> <input placeholder="Last name"/>{' '}
          <button type="submit">submit</button>
        </form>
        <ul>
          {this.props.contacts.map((contact, i) => (
            <li key={contact.id}>
              <Link to={`/contact/${contact.id}`}>{contact.first} {contact.last}</Link>
            </li>
          ))}
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var Contact = React.createClass({
  statics: {
    loadProps(params, cb) {
      console.log('loading Contact props');
      loadContact(params.id, cb);
    }
  },

  render() {
    var { contact } = this.props;

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
  render() {
    return (
      <div>
        <h1>Welcome!</h1>
      </div>
    );
  }
});

var Spinner = React.createClass({
  render() {
    return (
      <div style={{textAlign: 'center', padding: 50}}>
        <img src="spinner.gif" width="64" height="64"/>
      </div>
    );
  }
});

var AsyncProps = React.createClass({
  getInitialState() {
    return {
      propsAreLoading: false,
      asyncProps: null,
      previousRoutingState: null
    };
  },

  componentDidMount() {
    this.load();
  },

  componentWillReceiveProps(nextProps) {
    //var nextParams = nextProps.routingState.params;
    //var currentParams = this.props.routingState.params;
    //var needToLoad = !shallowEqual(nextParams, currentParams);
    //// params are the only data loading depency, so we don't
    //// re-load unless they change
    //if (needToLoad) {
      //this.setState({
        //previousRoutingState: this.props.routingState
      //});
      //this.load();
    //}
  },

  load() {
    var { params } = this.props.routingState;
    var { Component } = this.props;

    this.setState({ propsAreLoading: true }, () => {
      Component.loadProps(params, (err, asyncProps) => {
        this.setState({
          propsAreLoading: false,
          asyncProps: asyncProps,
          previousRoutingState: null
        });
      });
    });
  },

  render() {
    if (this.state.asyncProps === null)
      return <Spinner/>;

    var { Component } = this.props;
    var { asyncProps, propsAreLoading } = this.state;
    var routingState = this.state.previousRoutingState || this.props.routingState;

    return <Component
      onPropsDidChange={this.load}
      propsAreLoading={propsAreLoading}
      {...routingState}
      {...asyncProps}
    />
  }
});

function createAsyncPropsElement(Component, state) {
  return <AsyncProps Component={Component} routingState={state}/>
}

React.render((
  <Router history={HashHistory} createElement={createAsyncPropsElement}>
    <Route path="/" component={App} indexComponent={Index}>
      <Route path="contact/:id" component={Contact}/>
    </Route>
  </Router>
), document.getElementById('example'));
