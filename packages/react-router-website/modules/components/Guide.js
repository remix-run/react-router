import React, { PropTypes } from 'react'
import { Redirect, Route } from 'react-router-dom'
import { Block } from 'jsxstyle'
import ScrollToDoc from './ScrollToDoc'
import MarkdownViewer from './MarkdownViewer'

// almost identical to `API`, but I'm lazy rn
const Guide = ({ match, data }) => {
  const { params: { mod, header: headerParam, environment } } = match
  const doc = data.guides.find(doc => mod === doc.title.slug)
  const header = doc && headerParam ? doc.headers.find(h => h.slug === headerParam) : null

  return !doc ? (
    <Redirect to={`/${environment}`}/>
  ) : (
    <Block
      className="api-doc-wrapper"
      fontSize="80%"
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
            <Redirect to={`/${environment}/guides/${mod}`}/>
          )
        }}
      />
    </Block>
  )
}

Guide.propTypes = {
  match: PropTypes.object,
  data: PropTypes.object
}

export default Guide
