import React, { Component } from "react";
import { Motion, spring } from "react-motion";
import PropTypes from "prop-types";

class ScrollY extends Component {
  static contextTypes = {
    scrollToDoc: PropTypes.string
  };

  static propTypes = {
    y: PropTypes.number
  };

  componentDidMount() {
    this.scroll();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.y !== this.props.y) this.scroll();
  }

  scroll = () => {
    const { y } = this.props;
    const { scrollToDoc } = this.context;
    if (scrollToDoc) {
      document.getElementById(scrollToDoc).scrollTop = y;
    } else {
      window.scrollTo(0, y);
    }
  };

  render() {
    return null;
  }
}

class ScrollToDoc extends Component {
  static propTypes = {
    doc: PropTypes.object,
    header: PropTypes.object
  };

  static contextTypes = {
    scrollToDoc: PropTypes.string
  };

  state = {
    top: 0,
    syncingMotion: false,
    mounted: false
  };

  componentDidMount() {
    this.setTop();
  }

  setTop = () => {
    const top = this.getScrollY();
    this.setState({ top }, () => {
      const browserRestored = top !== 0;
      if (!browserRestored) {
        this.scroll();
      }
      this.setState({
        mounted: true
      });
    });
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.doc !== this.props.doc ||
      prevProps.header !== this.props.header
    ) {
      this.scroll();
    }
  }

  getScrollY() {
    const { scrollToDoc } = this.context;
    return scrollToDoc
      ? document.getElementById(scrollToDoc).scrollTop
      : window.scrollY;
  }

  scroll() {
    const { header, doc } = this.props;
    if (doc) {
      const id = header ? `${doc.title.slug}-${header.slug}` : doc.title.slug;
      const el = document.getElementById(id);
      this.setState(
        {
          top: this.getScrollY(),
          syncingMotion: true
        },
        () => {
          this.setState({
            top: this.getScrollY() + el.getBoundingClientRect().top - 20,
            syncingMotion: false
          });
        }
      );
    }
  }

  render() {
    const { top, syncingMotion, mounted } = this.state;
    const y = !mounted || syncingMotion ? top : spring(top);

    return (
      <Motion style={{ y }}>{s => <ScrollY y={Math.round(s.y)} />}</Motion>
    );
  }
}

export default ScrollToDoc;
