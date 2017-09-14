import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Redirect, Route } from 'react-router-dom'
import { Block } from 'jsxstyle'
import ScrollToDoc from './ScrollToDoc'
import MarkdownViewer from './MarkdownViewer'

class APISmall extends Component {
  static propTypes = {
    match: PropTypes.object,
    data: PropTypes.object
  }

  render() {
    const { match, data } = this.props
    const { params: { mod, environment } } = match
    const doc = mod && data.api.find(doc => mod === doc.title.slug)

    return !doc ? (
      <Redirect to={`/${environment}`}/>
    ) : (
      <Block
        className="api-doc-wrapper"
        fontSize="80%"
        paddingBottom={"60vh" /*so that scrolling headers can go all the way to the top*/}
      >
        <Block className="api-doc">
          <MarkdownViewer html={doc.markup}/>
        </Block>
        <Route
          path={`${match.path}/:header`}
          render={({ match: { params: { header: slug }}}) => {
            const header = doc.headers.find(h => h.slug === slug )
            return header ? (
              <ScrollToDoc doc={doc} header={header}/>
            ) : (
              <Redirect to={`/${environment}/api/${mod}`}/>
            )
          }}
        />
      </Block>
    )
  }
}

export default APISmall
