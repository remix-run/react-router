/**
 * Codemod script to migrate from React Router v5 to v6.
 * This script uses jscodeshift to transform the code.
 */

const { defineTest } = require('jscodeshift/dist/testUtils');
const { parser } = require('recast/parsers/typescript');
const j = require('jscodeshift');

module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Transformations
  // 1. Replace `Switch` with `Routes`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name === 'Switch') {
          specifier.imported.name = 'Routes';
        }
      });
    });

  // 2. Replace `Route` with `Route` and add `element` prop
  root.find(j.JSXOpeningElement, { name: { name: 'Route' } })
    .forEach(path => {
      const elementProp = j.jsxAttribute(
        j.jsxIdentifier('element'),
        j.jsxExpressionContainer(j.jsxIdentifier('COMPONENT_NAME'))
      );
      path.node.attributes.push(elementProp);
    });

  // 3. Replace `Redirect` with `Navigate`
  root.find(j.JSXOpeningElement, { name: { name: 'Redirect' } })
    .forEach(path => {
      path.node.name.name = 'Navigate';
    });

  // 4. Replace `useHistory` with `useNavigate`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name === 'useHistory') {
          specifier.imported.name = 'useNavigate';
        }
      });
    });

  // 5. Replace `history.push` with `navigate`
  root.find(j.CallExpression, { callee: { object: { name: 'history' }, property: { name: 'push' } } })
    .forEach(path => {
      path.node.callee.object.name = 'navigate';
    });

  // 6. Replace `history.replace` with `navigate` with `replace` option
  root.find(j.CallExpression, { callee: { object: { name: 'history' }, property: { name: 'replace' } } })
    .forEach(path => {
      path.node.callee.object.name = 'navigate';
      path.node.arguments.push(j.objectExpression([
        j.property('init', j.identifier('replace'), j.literal(true))
      ]));
    });

  // 7. Replace `useParams` from `react-router-dom` with `useParams` from `react-router-dom-v5-compat`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name === 'useParams') {
          specifier.imported.name = 'useParams';
          path.node.source.value = 'react-router-dom-v5-compat';
        }
      });
    });

  // 8. Replace `useLocation` from `react-router-dom` with `useLocation` from `react-router-dom-v5-compat`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name === 'useLocation') {
          specifier.imported.name = 'useLocation';
          path.node.source.value = 'react-router-dom-v5-compat';
        }
      });
    });

  // 9. Replace `useRouteMatch` with `useMatch`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name === 'useRouteMatch') {
          specifier.imported.name = 'useMatch';
        }
      });
    });

  // 10. Replace imports from `react-router-dom` to `react-router-dom-v5-compat`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.source.value = 'react-router-dom-v5-compat';
    });

  // Additional transformations for TypeScript support
  // 11. Replace `RouteComponentProps` with `RouteProps`
  root.find(j.TSTypeReference, { typeName: { name: 'RouteComponentProps' } })
    .forEach(path => {
      path.node.typeName.name = 'RouteProps';
    });

  // 12. Replace `withRouter` with `useNavigate`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name === 'withRouter') {
          specifier.imported.name = 'useNavigate';
        }
      });
    });

  // 13. Replace `matchPath` with `useMatch`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name === 'matchPath') {
          specifier.imported.name = 'useMatch';
        }
      });
    });

  // 14. Replace `generatePath` with `useMatch`
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value === 'react-router-dom')
    .forEach(path => {
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported.name === 'generatePath') {
          specifier.imported.name = 'useMatch';
        }
      });
    });

  return root.toSource();
};
