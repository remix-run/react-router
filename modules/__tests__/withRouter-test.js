import expect from 'expect'
import React, { Component } from 'react'
import { render, cleanup } from '@testing-library/react'
import createHistory from '../createMemoryHistory'
import Route from '../Route'
import Router from '../Router'
import withRouter from '../withRouter'
import execSteps from './execSteps'

describe('withRouter', function () {
    const routerStub = {
        push() {},
        replace() {},
        go() {},
        goBack() {},
        goForward() {},
        setRouteLeaveHook() {},
        isActive() {}
    }

    afterEach(function () {
        cleanup()
    })

    it('should put router on props', function (done) {
        const MyComponent = withRouter(({ router }) => {
            expect(router).toExist()
            done()
            return null
        })

        function App() {
            return <MyComponent /> // Ensure no props are passed explicitly.
        }

        render(
            <Router history={createHistory('/')}>
                <Route path="/" component={App} />
            </Router>
        )
    })

    it('should set displayName', function () {
        function MyComponent() {
            return null
        }

        MyComponent.displayName = 'MyComponent'

        expect(withRouter(MyComponent).displayName).toEqual(
            'withRouter(MyComponent)'
        )
    })

    it('should use router prop if specified', function (done) {
        const MyComponent = withRouter(({ router }) => {
            expect(router).toBe(routerStub)
            done()
            return null
        })

        render(<MyComponent router={routerStub} />)
    })

    it('updates the context inside static containers', function (done) {
        class App extends Component {
            render() {
                expect(this.props.router).toExist()
                expect(this.props.params).toExist()
                expect(this.props.params).toBe(this.props.router.params)
                expect(this.props.location).toExist()
                expect(this.props.location).toBe(this.props.router.location)
                expect(this.props.routes).toExist()
                expect(this.props.routes).toBe(this.props.router.routes)
                return <h1>{this.props.router.location.pathname}</h1>
            }
        }

        const WrappedApp = withRouter(App)

        class StaticContainer extends Component {
            shouldComponentUpdate() {
                return false
            }

            render() {
                return this.props.children
            }
        }

        const history = createHistory('/')

        const node = document.createElement('div')

        const execNextStep = execSteps(
            [
                () => {
                    expect(node.textContent).toEqual('/')
                    history.push('/hello')
                },
                () => {
                    // React 16 has slightly different update timing so we'll just sorta
                    // punt a bit with a setTimeout.
                    setTimeout(() => {
                        expect(node.textContent).toEqual('/hello')
                    }, 10)
                }
            ],
            done
        )

        render(
            <Router history={history} onUpdate={execNextStep}>
                <Route component={StaticContainer}>
                    <Route path="/" component={WrappedApp} />
                    <Route path="/hello" component={WrappedApp} />
                </Route>
            </Router>,
            {
                container: node
            }
        )
    })

    it('should render Component even without Router context', function () {
        const MyComponent = withRouter(({ router }) => {
            expect(router).toNotExist()

            return <h1>Hello</h1>
        })

        const node = document.createElement('div')
        render(<MyComponent />, { container: node })
        expect(node.textContent).toEqual('Hello')
    })
})
