import createLink from './Link'

export default function createIndexLink(React) {
  const Link = createLink(React)

  const IndexLink = React.createClass({

    render() {
      return <Link {...this.props} onlyActiveOnIndex={true} />
    }

  })

  return IndexLink
}
