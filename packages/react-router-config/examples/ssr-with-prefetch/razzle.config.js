"use strict";

const autoprefixer = require("autoprefixer");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  modify: (baseConfig, { target, dev }, webpack) => {
    const appConfig = Object.assign({}, baseConfig);
    const isServer = target !== 'web';

    // Setup SCSS
    const cssLoader = {
      loader: "css-loader",
      options: {
        modules: true,
        localIdentName: '[name]__[local]___[hash:base64:5]'
      }
    };


    const postcssLoader = {
      loader: "postcss-loader",
      options: {
        ident: "postcss", // https://webpack.js.org/guides/migrating/#complex-options
        sourceMap: dev,
        plugins: () => [
          autoprefixer({
            browsers: [
              ">1%",
              "last 4 versions",
              "Firefox ESR",
              "not ie < 9" // React doesn't support IE8 anyway
            ]
          })
        ]
      }
    };

    const sassLoader = {
      loader: "sass-loader",
      options: {
        sourceMap: dev
      }
    };

    const styleLoader = dev ? 'style-loader' : MiniCssExtractPlugin.loader;

    if(!isServer) {
      appConfig.module.rules.push({
        test: /\.scss$/,
        use: [
            styleLoader,
            cssLoader,
            postcssLoader,
            sassLoader
        ]
      });
    } else {
      appConfig.module.rules.push({
        test: /.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          cssLoader,
          sassLoader,
          postcssLoader,
        ]
      });
    }

    appConfig.plugins.push(
      new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].css"
      })
    );

    return appConfig;
  }
};
