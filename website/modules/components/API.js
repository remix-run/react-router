import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { Block } from "jsxstyle";
import PropTypes from "prop-types";

import ScrollToDoc from "./ScrollToDoc";
import MarkdownViewer from "./MarkdownViewer";

// nearly identical to Guide, haven't taken the time to abstact cause I'm not sure it'll
// remain so identical ... maybe it will?
class API extends Component {
  static propTypes = {
    match: PropTypes.object,
    data: PropTypes.object
  };

  render() {
    const { match, data } = this.props;
    const {
      params: { mod, header: headerParam, environment }
    } = match;
    const doc = mod && data.api.find(doc => mod === doc.title.slug);
    const header =
      doc && headerParam ? doc.headers.find(h => h.slug === headerParam) : null;
    return (
      <Block className="api-doc-wrapper" fontSize="80%">
        <Block className="api-doc">
          <ScrollToDoc doc={doc} header={header} />
          {data.api.map((d, i) => (
            <MarkdownViewer key={i} html={d.markup} />
          ))}
        </Block>
        {mod && !doc && <Redirect to={`/${environment}/api`} />}
        {headerParam &&
          doc &&
          !header && <Redirect to={`/${environment}/api/${mod}`} />}
      </Block>
    );
  }
}

export default API;
