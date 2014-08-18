var express = require('express');
var request = require('supertest');
var expect = require('expect');
var cheerio = require('cheerio');

var React = require('react');
var Router = require('../index');
var Routes = Router.Routes;
var Route = Router.Route;
var Redirect = Router.Redirect;
var AsyncState = Router.AsyncState;
var Promise = require('es6-promise').Promise;

var App = React.createClass({
	displayName: "App",
	render: function () {
		return this.props.activeRouteHandler();
	}
});

var HelloWorld = React.createClass({
	displayName: 'HelloWorld',
	render: function () {
		return React.DOM.div(null, "Hello World!");
	}
});

var AsyncWorld = React.createClass({
	displayName: 'AsyncWorld',
	mixins:[AsyncState],
	statics: {
		getInitialAsyncState: function (params, query, setState){
			return new Promise(function (resolve, reject) {
				if (query.errorPlease) {
					throw new Error("ok");
				}
				setTimeout(function(){
					setState({
						params:params,
						query:query
					});
					resolve();
				}, 10);
			});
		}
	},
	render: function () {
		return React.DOM.div(null, this.state.params.name, this.state.query.page);
	}
});

var CatchAll = React.createClass({
	displayName: 'CatchAll',
	render: function () {
		return React.DOM.div(null, "CatchAll!");
	}
});

var ErrorRoute = React.createClass({
	displayName: 'ErrorRoute',
	render: function () {
		throw new Error("ErrorRoute");
	}
});

describe("serverside rendering", function(){

	var routes = Routes(null, 
		Route({handler:App}, 
			Route({name:'hello', handler: HelloWorld}),
			Route({name:'async', path:"/async/:name", handler: AsyncWorld}),
			Route({name:'error', handler: ErrorRoute}),
			Redirect({from:"redirect", to:"hello"})
		)
	);

	it("should render the HelloWorld component for the /hello path", function(done){
		requestWithRoutes(routes).get('/hello')
		.expect(200)
		.end(function (err, res) {
			var doc = cheerio.load(res.text);
			expect(doc("div").html()).toBe("Hello World!");
			done();
		});
	});

	it("should redirect for <Redirect/> Route", function(done){
		requestWithRoutes(routes).get('/redirect')
		.expect(302)
		.end(function (err, res) {
			expect(res.header.location).toBe("/hello");
			done();
		});
	});

	it("should expect 404 for no matching Route", function(done){
		requestWithRoutes(routes).get('/not-found')
		.expect(404)
		.end(done);
	});

	it("should expect 500 for error Route", function(done){
		requestWithRoutes(routes).get('/error')
		.expect(500)
		.end(done);
	});

	it("should render the AsyncWorld component with initialData", function(done){
		requestWithRoutes(routes).get('/async/hello?page=world')
		.expect(200)
		.end(function (err, res) {
			var doc = cheerio.load(res.text);
			expect(doc("script").html()).toBe('window.__ReactRouter_initialData={"1":{"params":{"name":"hello"},"query":{"page":"world"}}};');
			done();
		});
	});

	it("should expect 500 for error in AsyncWorld", function(done){
		requestWithRoutes(routes).get('/async/hello?errorPlease=please')
		.expect(500)
		.end(function (err, res) {
			done();
		});
	});

});


function requestWithRoutes (routes){
	var app = express();

	app.use(function (req, res, next) {
		if (req.originalUrl == "/favicon.ico")
			return next();

		Router.renderRoutesToString(routes, req.originalUrl).then(function (data) {
			var body = '<!DOCTYPE html><html><head><title>' + data.title + '</title></head><body>' + data.html + '</body></html>';
			res.status(data && data.httpStatus || 200).send(body);

		}).catch(function (err) {

		    if (err.httpStatus == 302 && err.location) {
		      return res.redirect(err.location);
		    }

		    if(err.httpStatus == 404){
		    	return next();
		    }

			next(err);
		});
	});

	return request(app);
}
