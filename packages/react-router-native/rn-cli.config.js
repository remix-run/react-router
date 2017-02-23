const path = require('path');
const blacklist = require('react-native/packager/blacklist');
const config = require('react-native/packager/rn-cli.config');

const rootPackagePath = path.join(__dirname, '..', '..');

config.getBlacklist = () => [
  new RegExp(`^${escapeRegExp(rootPackagePath)}\/node_modules(.*)`),
  new RegExp(`^${escapeRegExp(rootPackagePath)}\/packages\/(react-router-dom|react-router-website(-*)?)\/(.*)`),
  new RegExp(`^${escapeRegExp(rootPackagePath)}\/packages\/react-router-native\/node_modules\/react-router(.*)`),
  //new RegExp(`^${escapeRegExp(rootPackagePath)}\/packages\/react-router\/node_modules\/(.*)`),
];

config.getBlacklistRE = () => blacklist(config.getBlacklist());

config.getProjectRoots = () => getRoots();
config.getAssetRoots = () => getRoots();

function getRoots() {
  return [
    path.join(__dirname, '../../'),
  ];
}

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = config;
