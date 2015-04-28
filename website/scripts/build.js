const React = require('react');
const marked = require('marked');
const fs = require('fs');
const path = require('path');

marked.setOptions({
  highlight (code, lang, callback) {
    require('pygmentize-bundled')({
      lang: lang,
      format: 'html'
    }, code, (err, result) => {
      callback(err, result);
    });
  }
});

getCategories().then((categories) => {
  var html = React.renderToStaticMarkup(
    React.createElement(Page, { categories })
  );
  console.log('<!doctype html>'+html);
});

function getCategories () {
  const DIR = path.join(__dirname, '..', '..', 'doc');
  return Promise.all(fs.readdirSync(DIR).filter((dir) => {
    return isDirectory(path.join(DIR, dir));
  }).map((dir) => {
    return Promise.all(fs.readdirSync(path.join(DIR, dir)).map((file) => {
      return new Promise((resolveDoc, rejectDoc) => {
        const src = fs.readFileSync(path.join(DIR, dir, file)).toString();
        marked(src, (err, html) => {
          if (err) rejectDoc(err);
          else resolveDoc({ name: stripExt(file), html });
        });
      });
    })).then((docs) => {
      return { name: stripDigits(dir), docs };
    });
  }));
}

function isDirectory (dir) {
  return fs.lstatSync(dir).isDirectory();
}

function stripDigits (str) {
  return str.replace(/^(\d+ )/, '');
}

function stripExt (str) {
  return str.replace(/\.md$/, '');
}

function makeId (name) {
  return name;
}

class Page extends React.Component {
  render () {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8"/>
          <title>React Router Documentation</title>
          <link rel="stylesheet" href="./styles.css"/>
          <link rel="stylesheet" href="./syntax.css"/>
        </head>
        <body>
          <main className="Main">
            <div className="Main__Content">
              <center>
                <img src="./img/vertical.png" width="367" style={{marginBottom: 40}}/>
              </center>
              <p>
                React Router is a complete routing solution designed specifically
                for <a href="https://facebook.github.io/react">React.js</a>. It
                painlessly synchronizes the components of your application with
                the URL, with first-class support for nesting, transitions, and
                server side rendering.
              </p>
              <p>
                <a href="https://github.com/rackt/react-router">Contribute on Github.</a>
              </p>
              {this.props.categories.map((category) => (
                <section>
                  {category.docs.map((doc) => (
                    <article className="Doc">
                      <h1 className="Heading" id={makeId(doc.name)}>
                        <a className="HeadingLink" href={`#${makeId(doc.name)}`}>
                          {doc.name}
                        </a>
                        <span className="CategoryName">{category.name}</span>
                      </h1>
                      <div dangerouslySetInnerHTML={{__html: doc.html}}/>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          </main>
          <nav className="Nav">
            <img src="./img/horizontal.png" width="100%"/>
            <br/>
            {this.props.categories.map((category) => (
              <div className="Category">
                <div className="Category__Name">{category.name}</div>
                <ul className="Category__List">
                  {category.docs.map((doc) => (
                    <li className="Category__ListItem">
                      <a className="Category__Link" href={`#${makeId(doc.name)}`}>
                        {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <script src="/app.js"></script>
        </body>
      </html>
    );
  }
}

