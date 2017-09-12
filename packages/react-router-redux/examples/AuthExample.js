import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';

import { createStore, applyMiddleware, combineReducers } from 'redux';
import createHistory from 'history/createBrowserHistory';
import { routerReducer, routerMiddleware, push } from 'react-router-redux';

import { connect } from 'react-redux';
import { Route, Switch } from 'react-router';

const history = createHistory();

const authSuccess = () => ({
    type: 'AUTH_SUCCESS'
})

const authFail = () => ({
    type: 'AUTH_FAIL'
})

const initialState = {
    isAuthenticated: false
}

const authReducer = (state = initialState , action) => {
    switch (action.type) {
        case 'AUTH_SUCCESS':
            return Object.assign({}, ...state, {
                isAuthenticated: true
            });
        case 'AUTH_FAIL':
            return Object.assign({}, ...state, {
                isAuthenticated: false
            });
        default: 
            return { ...state };
    }
}

const store = createStore(
    combineReducers({ routerReducer, authReducer }),
    applyMiddleware(routerMiddleware(history)),
);

const ConnectedSwitch = connect(state => ({
	location: state.location
}))(Switch);

class LoginContainer extends React.Component {
    render() {
        return <button onClick={() => this.props.login()}>Login Here!</button>
    }
}

class HomeContainer extends React.Component {
    componentWillMount() {
        alert('Private home is at: ' + this.props.location.pathname)
    }

    render() {
        return <button onClick={() => this.props.logout()}>Logout Here!</button>
    }
}

const AppContainer = ({ location }) => (
    <ConnectedSwitch>
        <PrivateRoute component={Home} />
    </ConnectedSwitch>
);

class PrivateRouteContainer extends React.Component {
    render() {
        return this.props.isAuthenticated ?
            <Route exact path="/" component={this.props.component} />
        :   <Route exact path="/" component={Login} />
    }
}

const PrivateRoute = connect(state => ({
    isAuthenticated: state.authReducer.isAuthenticated
}))(PrivateRouteContainer)

const Login = connect(null, dispatch => ({
    login: () => { 
        dispatch(authSuccess())
        dispatch(push('/'))
    }
}))(LoginContainer)

const Home = connect(null, dispatch => ({
    logout: () => { 
        dispatch(authFail())
        dispatch(push('/'))
    }
}))(HomeContainer)

const App = connect(state => ({
    location: state.location,
}))(AppContainer)

render(
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <App />
        </ConnectedRouter>
    </Provider>,
    document.getElementById('root'),
);
  