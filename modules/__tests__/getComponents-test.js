import expect from 'expect';
import getComponents from '../getComponents';

describe('getComponents', function () {

    describe('attributes', function() {

        describe('when provided with component', function() {

            it('should return the specified component', function(done) {
                var component = {hello: 'world'};
                var nextState = {
                    routes: [
                        {
                            component: component
                        }
                    ]
                };

                getComponents(nextState, function(error, result) {
                    expect(result).toEqual([component]);
                    done();
                });
            });

            it('should ignore the components attribute', function(done) {
                var component = {hello: 'world'};
                var nextState = {
                    routes: [
                        {
                            component: component,
                            components: [{foo: 'bar', hi: 'there'}]
                        }
                    ]
                };

                getComponents(nextState, function(error, result) {
                    expect(result).toEqual([component]);
                    done();
                });
            });

            it('should ignore the getComponents attribute', function(done) {
                var component = {hello: 'world'};
                var nextState = {
                    routes: [
                        {
                            component: component,
                            getComponents: function(params, callback) {
                                callback(null, undefined);
                            }
                        }
                    ]
                };

                getComponents(nextState, function(error, result) {
                    expect(result).toEqual([component]);
                    done();
                });
            });

        });

        describe('when provided with components', function() {

            it('should return the specified components', function(done) {
                var components = {hello: 'world'};
                var nextState = {
                    routes: [
                        {
                            components: components
                        }
                    ]
                };

                getComponents(nextState, function(error, result) {
                    expect(result).toEqual([components]);
                    done();
                });
            });

            it('should ignore the getComponents attribute', function(done) {
                var components = {hello: 'world'};
                var nextState = {
                    routes: [
                        {
                            components: components,
                            getComponents: function(params, callback) {
                                callback(null, undefined);
                            }
                        }
                    ]
                };

                getComponents(nextState, function(error, result) {
                    expect(result).toEqual([components]);
                    done();
                });
            });

        });

        describe('when provided with getComponents', function() {

            it('should call the getComponents attribute and return the resulting value', function(done) {
                var component = {hello: 'world'};
                var nextState = {
                    routes: [
                        {
                            getComponents: function(params, callback) {
                                callback(null, component);
                            }
                        }
                    ]
                };

                getComponents(nextState, function(error, result) {
                    expect(result).toEqual([component]);
                    done();
                });
            });

        });

        describe('when nothing is provided', function() {

            it('should not return any value', function(done) {
                var nextState = {
                    routes: [{}]
                };

                getComponents(nextState, function(error, result) {
                    expect(error).toNotExist();
                    expect(result).toEqual([undefined]);
                    done();
                });
            });

        });

    });

    describe('params', function() {

        it('should pass state parameters into the getComponents evaluation', function(done) {
            var nextState = {
                routes: [
                    {
                        getComponents: function (params, callback) {
                            callback(null, params.hello);
                        }
                    }
                ],
                params: {
                    hello: 'world'
                }
            };

            getComponents(nextState, function (error, result) {
                expect(result).toEqual(['world']);
                done();
            });

        });

    });

});
