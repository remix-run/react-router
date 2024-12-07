import expect from 'expect'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import createHistory from '../createMemoryHistory'
import IndexRoute from '../IndexRoute'
import Router from '../Router'
import Route from '../Route'
import qs from 'qs'

describe('isActive', function () {
    afterEach(function () {
        cleanup()
    })

    describe('a pathname that matches the URL', function () {
        describe('with no query', function () {
            it('is active', function () {
                const history = createHistory('/home')
                render((
                    <Router history={history}>
                        <Route path="/home" />
                    </Router>
                ))
                expect(this.router.isActive('/home')).toBe(true)
            })
        })

        describe('with a query that also matches', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/home?the=query')}>
                        <Route path="/home" />
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { the: 'query' }
                })).toBe(true)
            })
        })

        describe('with a query that also matches by value, but not by type', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/home?the=query&n=2&show=false')}>
                        <Route path="/home" />
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { the: 'query', n: 2, show: false }
                })).toBe(true)
            })
        })

        describe('with a query that does not match', function () {
            it('is not active', function () {
                render((
                    <Router history={createHistory('/home?the=query')}>
                        <Route path="/home" />
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { something: 'else' }
                })).toBe(false)
            })
        })

        describe('with params', function () {
            it('is active when its params match', function () {
                render((
                    <Router history={createHistory('/hello/ryan')}>
                        <Route path="/hello/:name" />
                    </Router>
                ))
                expect(this.router.isActive('/hello/ryan')).toBe(true)
                expect(this.router.isActive('/hello/michael')).toBe(false)
            })
        })
    })

    describe('nested routes', function () {
        describe('on the child', function () {
            it('is active for the child and the parent', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child')).toBe(true)
                expect(this.router.isActive('/parent/child', true)).toBe(true)
                expect(this.router.isActive('/parent')).toBe(true)
                expect(this.router.isActive('/parent', true)).toBe(false)
            })

            // This test case is a bit odd. A route with path /parent/child/ won't
            // match /parent/child because of the trailing slash mismatch. However,
            // this doesn't matter in practice, since it only comes up if your
            // isActive pattern has a trailing slash but your route pattern doesn't,
            // which would be an utterly bizarre thing to do.

            it('is active with trailing slash on pattern', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child/')).toBe(true)
            })

            it('is active with trailing slash on location', function () {
                render((
                    <Router history={createHistory('/parent/child/')}>
                        <Route path="/parent">
                            <Route path="child" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child')).toBe(true)
                expect(this.router.isActive('/parent/child/')).toBe(true)
            })

            it('is not active with extraneous slashes', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent//child')).toBe(false)
                expect(this.router.isActive('/parent/child//')).toBe(false)
            })

            it('is not active with missing slashes', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parentchild')).toBe(false)
            })
        })

        describe('on the parent', function () {
            it('is active for the parent', function () {
                render((
                    <Router history={createHistory('/parent')}>
                        <Route path="/parent">
                            <Route path="child" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child')).toBe(false)
                expect(this.router.isActive('/parent/child', true)).toBe(false)
                expect(this.router.isActive('/parent')).toBe(true)
                expect(this.router.isActive('/parent', true)).toBe(true)
            })
        })
    })

    describe('a pathname that matches a parent route, but not the URL directly', function () {
        describe('with no query', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/absolute')}>
                        <Route path="/home">
                            <Route path="/absolute" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/home')).toBe(true)
                expect(this.router.isActive('/home', true)).toBe(false)
            })
        })

        describe('with a query that also matches', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/absolute?the=query')}>
                        <Route path="/home">
                            <Route path="/absolute" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { the: 'query' }
                })).toBe(true)
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { the: 'query' }
                }, true)).toBe(false)
            })
        })

        describe('with a query that does not match', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/absolute?the=query')}>
                        <Route path="/home">
                            <Route path="/absolute" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { something: 'else' }
                })).toBe(false)
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { something: 'else' }
                }, true)).toBe(false)
            })
        })
    })

    describe('a pathname that matches a nested absolute path', function () {
        describe('with no query', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/absolute')}>
                        <Route path="/home">
                            <Route path="/absolute" />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/absolute')).toBe(true)
                expect(this.router.isActive('/absolute', true)).toBe(true)
            })
        })
    })

    describe('a pathname that matches an index URL', function () {
        describe('with no query', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/home')}>
                        <Route path="/home">
                            <IndexRoute />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/home')).toBe(true)
                expect(this.router.isActive('/home', true)).toBe(true)
            })
        })

        describe('with a query that also matches', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/home?the=query')}>
                        <Route path="/home">
                            <IndexRoute />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { the: 'query' }
                })).toBe(true)
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { the: 'query' }
                }, true)).toBe(true)
            })
        })

        describe('with a query that does not match', function () {
            it('is not active', function () {
                render((
                    <Router history={createHistory('/home?the=query')}>
                        <Route path="/home">
                            <IndexRoute />
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { something: 'else' }
                })).toBe(false)
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { something: 'else' }
                }, true)).toBe(false)
            })
        })

        describe('with the index route nested under a pathless route', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/home')}>
                        <Route path="/home">
                            <Route>
                                <IndexRoute />
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/home')).toBe(true)
                expect(this.router.isActive('/home', true)).toBe(true)
            })
        })

        describe('with a nested index route', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child">
                                <IndexRoute />
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child')).toBe(true)
                expect(this.router.isActive('/parent/child', true)).toBe(true)
            })

            it('is active with trailing slash on pattern', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child">
                                <IndexRoute />
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child/')).toBe(true)
                expect(this.router.isActive('/parent/child/', true)).toBe(true)
            })

            it('is active with trailing slash on location', function () {
                render((
                    <Router history={createHistory('/parent/child/')}>
                        <Route path="/parent">
                            <Route path="child">
                                <IndexRoute />
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child')).toBe(true)
                expect(this.router.isActive('/parent/child', true)).toBe(true)
                expect(this.router.isActive('/parent/child/')).toBe(true)
                expect(this.router.isActive('/parent/child/', true)).toBe(true)
            })

            it('is not active with extraneous slashes', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child">
                                <IndexRoute />
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent//child')).toBe(false)
                expect(this.router.isActive('/parent/child//')).toBe(false)
                expect(this.router.isActive('/parent//child', true)).toBe(false)
                expect(this.router.isActive('/parent/child//', true)).toBe(false)
            })
        })

        describe('with a nested index route under a pathless route', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child">
                                <Route>
                                    <IndexRoute />
                                </Route>
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child')).toBe(true)
                expect(this.router.isActive('/parent/child', true)).toBe(true)
            })

            it('is active with trailing slash on pattern', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child">
                                <Route>
                                    <IndexRoute />
                                </Route>
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child/')).toBe(true)
                expect(this.router.isActive('/parent/child/', true)).toBe(true)
            })

            it('is active with trailing slash on location', function () {
                render((
                    <Router history={createHistory('/parent/child/')}>
                        <Route path="/parent">
                            <Route path="child">
                                <Route>
                                    <IndexRoute />
                                </Route>
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent/child')).toBe(true)
                expect(this.router.isActive('/parent/child', true)).toBe(true)
                expect(this.router.isActive('/parent/child/')).toBe(true)
                expect(this.router.isActive('/parent/child/', true)).toBe(true)
            })

            it('is not active with extraneous slashes', function () {
                render((
                    <Router history={createHistory('/parent/child')}>
                        <Route path="/parent">
                            <Route path="child">
                                <Route>
                                    <IndexRoute />
                                </Route>
                            </Route>
                        </Route>
                    </Router>
                ))
                expect(this.router.isActive('/parent//child')).toBe(false)
                expect(this.router.isActive('/parent/child//')).toBe(false)
                expect(this.router.isActive('/parent//child', true)).toBe(false)
                expect(this.router.isActive('/parent/child//', true)).toBe(false)
            })
        })
    })

    describe('a pathname that matches only the beginning of the URL', function () {
        it('is not active', function () {
            render((
                <Router history={createHistory('/home')}>
                    <Route path="/home" />
                </Router>
            ))
            expect(this.router.isActive('/h')).toBe(false)
        })
    })

    describe('a pathname that matches the root URL only if it is a parent route', function () {
        it('is active', function () {
            render((
                <Router history={createHistory('/home')}>
                    <Route path="/">
                        <Route path="/home" />
                    </Route>
                </Router>
            ))
            expect(this.router.isActive('/')).toBe(true)
        })
    })

    describe('a pathname that does not match the root URL if it is not a parent route', function () {
        it('is not active', function () {
            render((
                <Router history={createHistory('/home')}>
                    <Route path="/" />
                    <Route path="/home" />
                </Router>
            ))
            expect(this.router.isActive('/')).toBe(false)
        })
    })

    describe('a pathname that matches URL', function () {
        describe('with query that does match', function () {
            it('is active', function () {
                render((
                    <Router history={createHistory('/home?foo=bar&foo=bar1&foo=bar2')}>
                        <Route path="/" />
                        <Route path="/home" />
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { foo: [ 'bar', 'bar1', 'bar2' ] }
                })).toBe(true)
            })
        })

        describe('with a custom parse function and a query that does not match', function () {
            it('is not active', function () {
                const history = createHistory({
                    entries: [ '/home?foo[1]=bar' ],
                    stringifyQuery(params) {
                        return qs.stringify(params, { arrayFormat: 'indices' })
                    },
                    parseQueryString(query) {
                        return qs.parse(query, { parseArrays: false })
                    }
                })

                render((
                    <Router history={history}>
                        <Route path="/" />
                        <Route path="/home" />
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { foo: { 4: 'bar' } }
                })).toBe(false)
            })
        })

        describe('with a query with explicit undefined values', function () {
            it('matches missing query keys', function () {
                render((
                    <Router history={createHistory('/home?foo=1')}>
                        <Route path="/" />
                        <Route path="/home" />
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { foo: 1, bar: undefined }
                })).toBe(true)
            })

            it('does not match a present query key', function () {
                render((
                    <Router history={createHistory('/home?foo=1&bar=')}>
                        <Route path="/" />
                        <Route path="/home" />
                    </Router>
                ))
                expect(this.router.isActive({
                    pathname: '/home',
                    query: { foo: 1, bar: undefined }
                })).toBe(false)
            })
        })
    })

    describe('dynamic routes', function () {
        const routes = {
            path: '/',
            childRoutes: [
                { path: 'foo' }
            ],
            getIndexRoute(partialNextState, callback) {
                setTimeout(() => callback(null, {}))
            }
        }

        describe('when not on index route', function () {
            it('does not show index as active', function () {
                render((
                    <Router history={createHistory('/foo')} routes={routes} />
                ))
                expect(this.router.isActive('/')).toBe(true)
                expect(this.router.isActive('/', true)).toBe(false)
                expect(this.router.isActive('/foo')).toBe(true)
            })
        })

        describe('when on index route', function () {
            it('shows index as active',async function (done) {
                render((
                    <Router history={createHistory('/')} routes={routes} />
                ))
                // Need to wait for async match to complete.
                await new Promise(res => setTimeout(() => res))
                expect(this.router.isActive('/')).toBe(true)
                expect(this.router.isActive('/', true)).toBe(true)
                expect(this.router.isActive('/foo')).toBe(false)
                done()
            })
        })
    })
})
