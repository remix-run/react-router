import React from 'react'

class ScrollToMe extends React.Component {
  componentDidMount() {
    this.scroll()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location)
      this.scroll()
  }

  scroll() {
    window.scrollTo(0, this.el.offsetTop)
  }

  render() {
    return <div ref={n => this.el = n}/>
  }
}

export default ScrollToMe
