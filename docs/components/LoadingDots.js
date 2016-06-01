import React from 'react'

class LoadingDots extends React.Component {

  static propTypes: {
    interval: React.PropTypes.number,
    dots: React.PropTypes.number
  }

  static defaultProps = {
    interval: 300,
    dots: 3
  }

  state = { frame: 1 }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({
        frame: this.state.frame + 1
      })
    }, this.props.interval)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    let dots = this.state.frame % (this.props.dots + 1)
    let text = ''
    while (dots > 0) {
      text += '.'
      dots--
    }
    return <div {...this.props}>{text}&nbsp;</div>
  }

}

export default LoadingDots

