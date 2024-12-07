import expect from 'expect'
import React, { Component, Fragment, forwardRef, memo } from 'react'
import { render, cleanup } from '@testing-library/react'
import createHistory from '../createMemoryHistory'
import Route from '../Route'
import Router from '../Router'

describe('Router', function () {
    class Parent extends Component {
        render() {
            return <div>parent {this.props.children}</div>
        }
    }

    class Child extends Component {
        render() {
            return <div>child</div>
        }
    }

    afterEach(function () {
        cleanup()
    })

    it('renders routes', function () {
        const node = document.createElement('div')
        render(
            <Router history={createHistory('/')}>
                <Route path="/" component={Parent} />
            </Router>,
            { container: node }
        )
        expect(node.textContent).toEqual('parent ')
    })

    it('renders child routes when the parent does not have a path', function () {
        const node = document.createElement('div')
        render(
            <Router history={createHistory('/')}>
                <Route component={Parent}>
                    <Route component={Parent}>
                        <Route path="/" component={Child} />
                    </Route>
                </Route>
            </Router>,
            { container: node }
        )
        expect(node.textContent).toEqual('parent parent child')
    })

    it('renders nested children correctly', function () {
        const node = document.createElement('div')
        render(
            <Router history={createHistory('/hello')}>
                <Route component={Parent}>
                    <Route path="hello" component={Child} />
                </Route>
            </Router>,
            { container: node }
        )
        expect(node.textContent).toMatch(/parent/)
        expect(node.textContent).toMatch(/child/)
    })

    it("renders the child's component when it has no component", function () {
        const node = document.createElement('div')
        render(
            <Router history={createHistory('/hello')}>
                <Route>
                    <Route path="hello" component={Child} />
                </Route>
            </Router>,
            { container: node }
        )
        expect(node.textContent).toMatch(/child/)
    })

    it('renders with a custom "createElement" prop', function () {
        class Wrapper extends Component {
            render() {
                return <this.props.component fromWrapper="wrapped" />
            }
        }

        class Child extends Component {
            render() {
                return <div>{this.props.fromWrapper}</div>
            }
        }

        const node = document.createElement('div')
        render(
            <Router
                history={createHistory('/')}
                createElement={(x) => <Wrapper component={x} />}
            >
                <Route path="/" component={Child} />
            </Router>,
            { container: node }
        )
        expect(node.textContent).toEqual('wrapped')
    })

    describe('components for React 16', function () {
        it('renders routes for React.memo', function () {
            const node = document.createElement('div')
            render(
                <Router history={createHistory('/')}>
                    <Route
                        path="/"
                        component={memo(() => (
                            <div>memo</div>
                        ))}
                    />
                </Router>,
                { container: node }
            )
            expect(node.textContent).toEqual('memo')
        })

        it('renders routes for React.forwardRef', function () {
            const node = document.createElement('div')
            render(
                <Router history={createHistory('/')}>
                    <Route
                        path="/"
                        component={forwardRef(() => (
                            <div>forwardRef</div>
                        ))}
                    />
                </Router>,
                { container: node }
            )
            expect(node.textContent).toEqual('forwardRef')
        })

        it('renders routes for React.Fragment', function () {
            const node = document.createElement('div')
            render(
                <Router history={createHistory('/')}>
                    <Route
                        path="/"
                        component={() => (
                            <Fragment>
                                <div>Fragment</div>
                            </Fragment>
                        )}
                    />
                </Router>,
                { container: node }
            )
            expect(node.textContent).toEqual('Fragment')
        })
    })

    describe('with named components', function () {
        class Parent extends Component {
            render() {
                return (
                    <div>
                        {this.props.sidebar}-{this.props.content}
                    </div>
                )
            }
        }

        class Sidebar extends Component {
            render() {
                return <div>sidebar</div>
            }
        }

        class Content extends Component {
            render() {
                return <div>content</div>
            }
        }

        let routes

        beforeEach(function () {
            routes = (
                <Route component={Parent}>
                    <Route path="/" components={{ sidebar: Sidebar, content: Content }} />
                </Route>
            )
        })

        it('receives those components as props', function () {
            const node = document.createElement('div')
            render(<Router history={createHistory('/')} routes={routes} />, {
                container: node
            })
            expect(node.textContent).toEqual('sidebar-content')
        })

        it('sets the key on those components', function () {
            const components = {}
            function createElementSpy(Component, props) {
                if (props.key) {
                    components[props.key] = Component
                }

                return null
            }

            render(
                <Router
                    history={createHistory('/')}
                    routes={routes}
                    createElement={createElementSpy}
                />
            )
            expect(components.sidebar).toBe(Sidebar)
            expect(components.content).toBe(Content)
        })
    })

    describe('at a route with special characters', function () {
        it('does not double escape', function () {
            // https://github.com/reactjs/react-router/issues/1574
            class MyComponent extends Component {
                render() {
                    return <div>{this.props.params.someToken}</div>
                }
            }

            const node = document.createElement('div')
            render(
                <Router history={createHistory('/point/aaa%2Bbbb')}>
                    <Route path="point/:someToken" component={MyComponent} />
                </Router>,
                { container: node }
            )
            expect(node.textContent).toEqual('aaa+bbb')
        })

        it('does not double escape when nested', function () {
            // https://github.com/reactjs/react-router/issues/1574
            class MyWrapperComponent extends Component {
                render() {
                    return this.props.children
                }
            }

            class MyComponent extends Component {
                render() {
                    return <div>{this.props.params.someToken}</div>
                }
            }

            const node = document.createElement('div')
            render(
                <Router history={createHistory('/point/aaa%2Bbbb')}>
                    <Route component={MyWrapperComponent}>
                        <Route path="point/:someToken" component={MyComponent} />
                    </Route>
                </Router>,
                { container: node }
            )
            expect(node.textContent).toEqual('aaa+bbb')
        })

        it('is happy to have colons in parameter values', function () {
            // https://github.com/reactjs/react-router/issues/1759
            class MyComponent extends Component {
                render() {
                    return <div>{this.props.params.foo}</div>
                }
            }

            const node = document.createElement('div')
            render(
                <Router history={createHistory('/ns/aaa:bbb/bar')}>
                    <Route path="ns/:foo/bar" component={MyComponent} />
                </Router>,
                { container: node }
            )
            expect(node.textContent).toEqual('aaa:bbb')
        })

        it('handles % in parameters', function () {
            // https://github.com/reactjs/react-router/issues/1766
            class MyComponent extends Component {
                render() {
                    return <div>{this.props.params.name}</div>
                }
            }

            const node = document.createElement('div')
            render(
                <Router
                    history={createHistory(
                        '/company/CADENCE%20DESIGN%20SYSTEM%20INC%20NOTE%202.625%25%2060'
                    )}
                >
                    <Route path="/company/:name" component={MyComponent} />
                </Router>,
                { container: node }
            )
            expect(node.textContent).toEqual(
                'CADENCE DESIGN SYSTEM INC NOTE 2.625% 60'
            )
        })

        it('handles forward slashes', function () {
            // https://github.com/reactjs/react-router/issues/1865
            class Parent extends Component {
                render() {
                    return <div>{this.props.children}</div>
                }
            }

            class Child extends Component {
                render() {
                    return <h1>{this.props.params.name}</h1>
                }
            }

            const node = document.createElement('div')
            render(
                <Router history={createHistory('/apple%2Fbanana')}>
                    <Route component={Parent}>
                        <Route path="/:name" component={Child} />
                    </Route>
                </Router>,
                { container: node }
            )
            expect(node.textContent).toEqual('apple/banana')
        })

        it('handles error that are not valid URI character', function () {
            const errorSpy = expect.createSpy()

            render(
                <Router history={createHistory('/%')} onError={errorSpy}>
                    <Route path="*" />
                </Router>
            )
            expect(errorSpy).toHaveBeenCalled()
        })
    })

    describe('render prop', function () {
        it('renders with the render prop', function () {
            const node = document.createElement('div')
            render(
                <Router
                    history={createHistory('/')}
                    render={() => <div>test</div>}
                    routes={{ path: '/', component: Parent }}
                />,
                { container: node }
            )
            expect(node.textContent).toBe('test')
        })

        it('passes router props to render prop', function (done) {
            const MyComponent = () => <div />
            const route = { path: '/', component: MyComponent }

            const assertProps = (props) => {
                expect(props.routes).toEqual([ route ])
                expect(props.components).toEqual([ MyComponent ])

                expect(props.params).toEqual({})
                expect(props.location.pathname).toEqual('/')
                expect(props.router.params).toEqual({})
                expect(props.router.location.pathname).toEqual('/')

                expect(props.foo).toBe('bar')
                expect(props.render).toNotExist()
                done()
                return <div />
            }

            render(
                <Router
                    history={createHistory('/')}
                    routes={route}
                    render={assertProps}
                    foo="bar"
                />
            )
        })
    })

    describe('async components', function () {
        let componentSpy, renderSpy

        beforeEach(function () {
            componentSpy = expect.createSpy()

            renderSpy = ({ components }) => {
                componentSpy(components)
                return <div />
            }
        })

        it('should support getComponent', async function (done) {
            const Component = () => <div />

            function getComponent(nextState, callback) {
                expect(this.getComponent).toBe(getComponent)
                expect(nextState.location.pathname).toBe('/')

                setTimeout(() => callback(null, Component))
            }

            render(
                <Router history={createHistory('/')} render={renderSpy}>
                    <Route path="/" getComponent={getComponent} />
                </Router>
            )
            setTimeout(function () {
                setTimeout(function () {
                    expect(componentSpy).toHaveBeenCalledWith([ Component ])
                    done()
                })
            })
        })

        it('should support getComponents', function (done) {
            const foo = () => <div />
            const bar = () => <div />

            function getComponents(nextState, callback) {
                expect(this.getComponents).toBe(getComponents)
                expect(nextState.location.pathname).toBe('/')

                setTimeout(() => callback(null, { foo, bar }))
            }

            render(
                <Router history={createHistory('/')} render={renderSpy}>
                    <Route path="/" getComponents={getComponents} />
                </Router>
            )
            setTimeout(function () {
                setTimeout(function () {
                    expect(componentSpy).toHaveBeenCalledWith([ { foo, bar } ])
                    done()
                })
            })
        })

        it('should support getComponent returning a Promise', function (done) {
            const Component = () => <div />

            const getComponent = () => new Promise((resolve) => resolve(Component))

            render(
                <Router history={createHistory('/')} render={renderSpy}>
                    <Route path="/" getComponent={getComponent} />
                </Router>
            )
            setTimeout(function () {
                expect(componentSpy).toHaveBeenCalledWith([ Component ])
                done()
            })
        })
    })

    describe('error handling', function () {
        let error, getComponent

        beforeEach(function () {
            error = new Error('error fixture')
            getComponent = (_, callback) => callback(error)
        })

        it('should work with onError', function () {
            const errorSpy = expect.createSpy()

            render(
                <Router history={createHistory('/')} onError={errorSpy}>
                    <Route path="/" getComponent={getComponent} />
                </Router>
            )
            expect(errorSpy).toHaveBeenCalledWith(error)
        })

        it('should throw without onError', function () {
            expect(() =>
                render(
                    <Router history={createHistory('/')}>
                        <Route path="/" getComponent={getComponent} />
                    </Router>
                )
            ).toThrow('error fixture')
        })
    })
})
