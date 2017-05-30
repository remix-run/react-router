import * as React from 'react'
import { StaticRouter, Route } from 'react-router-dom'

const RouteStatus = (props) => (
    <Route
        render={({ staticContext }) => {
            if (staticContext) {
                staticContext.statusCode = props.statusCode
            }

            return (
                <div>
                    {props.children}
                </div>
            )
        }}
    />
)

const PrintContext = (props) => (
    <p>
        Static context: {JSON.stringify(props.staticContext)}
    </p>
)

class StaticRouterExample extends React.Component {
    staticContext = {};

    render() {
        return (
            <StaticRouter location="/foo" context={this.staticContext}>
                <div>
                    <RouteStatus statusCode={404}>
                        <p>Route with statusCode 404</p>
                        <PrintContext staticContext={this.staticContext} />
                    </RouteStatus>
                </div>
            </StaticRouter>
        )
    }
}

export default StaticRouterExample
