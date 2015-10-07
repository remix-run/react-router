# Component Lifecycle

It's important to understand which lifecycle hooks are going to be called
on your route components to implement lots of different functionality in
your app. The most common thing is fetching data.

There is no difference in the lifecycle of a component in the router as
just React itself. Let's peel away the idea of routes, and just think
about the components being rendered at different URLs.

Consider this route config:

```js
<Route path="/" component={App}>
  <IndexRoute component={Home}/>
  <Route path="invoices/:invoiceId" component={Invoice}/>
  <Route path="accounts/:accountId" component={Account}/>
</Route>
```

### Lifecycle hooks when routing

1. Lets say the user enters the app at `/`.

    | Component | Lifecycle Hooks called |
    |-----------|------------------------|
    | App | `componentDidMount` |
    | Home | `componentDidMount` |
    | Invoice | N/A |
    | Account | N/A |

2. Now they navigate from `/` to `/invoice/123`

    | Component | Lifecycle Hooks called |
    |-----------|------------------------|
    | App | `componentWillReceiveProps`, `componentDidUpdate` |
    | Home | `componentWillUnmount` |
    | Invoice | `componentDidMount` |
    | Account | N/A |

    - `App` gets `componentWillReceiveProps` and `componentDidUpdate` because it
    stayed rendered but just received new props from the router (like:
    `children`, `params`, `location`, etc.)
    - `Home` is no longer rendered, so it gets unmounted.
    - `Invoice` is mounted for the first time.


3. Now they navigate from `/invoice/123` to `/invoice/789`

    | Component | Lifecycle Hooks called |
    |-----------|------------------------|
    | App | componentWillReceiveProps, componentDidUpdate |
    | Home | N/A |
    | Invoice | componentWillReceiveProps, componentDidUpdate |
    | Account | N/A |

    All the components that were mounted before, are still mounted, they
    just receive new props from the router.

4. Now they navigate from `/invoice/789` to `/accounts/123`

    | Component | Lifecycle Hooks called |
    |-----------|------------------------|
    | App | componentWillReceiveProps, componentDidUpdate |
    | Home | N/A |
    | Invoice | componentWillUnmount |
    | Account | componentDidMount |

### Fetching Data

While there are other ways to fetch data with the router, the simplest
way is to simply use the lifecycle hooks of your components and keep
that data in state. Now that we understand the lifecycle of components
when changing routes, we can implement simple data fetching inside of
`Invoice`.

```js
let Invoice = React.createClass({

  getInitialState () {
    return {
      invoice: null
    }
  },

  componentDidMount () {
    // fetch data initially in scenario 2 from above
    this.fetchInvoice()
  },

  componentDidUpdate (prevProps) {
    // respond to parameter change in scenario 3
    let oldId = prevProps.params.invoiceId
    let newId = this.props.params.invoiceId
    if (newId !== oldId)
      this.fetchInvoice()
  },

  componentWillUnmount () {
    // allows us to ignore an inflight request in scenario 4
    this.ignoreLastFetch = true
  },

  fetchInvoice () {
    let url = `/api/invoices/${this.props.params.invoiceId}`
    this.request = fetch(url, (err, data) => {
      if (!this.ignoreLastFetch)
        this.setState({ invoice: data.invoice })
    })
  },

  render () {
    return <InvoiceView invoice={this.state.invoice}/>
  }

})
```
