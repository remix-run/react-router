const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const SWPrecacheWebpackPlugin = require("sw-precache-webpack-plugin");

module.exports = {
  devtool: "source-map",

  entry: {
    app: path.resolve(__dirname, "../modules/index.js"),
    vendor: ["react", "react-dom"]
  },

  output: {
    path: path.resolve(__dirname, "../build"),
    filename: `bundle-[chunkHash].js`,
    chunkFilename: `[name]-[chunkHash].js`,
    publicPath: "/"
  },

  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      )
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: `vendor-[chunkHash].js`
    }),
    new HTMLWebpackPlugin({
      template: "index.html.ejs"
    }),
    new CopyWebpackPlugin([{ from: path.resolve(__dirname, "../static") }])
  ].concat(
    process.env.NODE_ENV === "production"
      ? [
          new SWPrecacheWebpackPlugin({
            cacheId: "react-router-website",
            staticFileGlobsIgnorePatterns: [/\.map$/]
          })
        ]
      : []
  ),

  resolve: {
    modules: [
      path.resolve(__dirname, "../../"),
      path.resolve(__dirname, "../../node_modules")
    ],
    alias: {
      "react-router": path.resolve(__dirname, "../../packages/react-router"),
      "react-router-dom": path.resolve(
        __dirname,
        "../modules/ReactRouterDOMShim"
      )
    }
  },

  resolveLoader: {
    modules: [path.resolve(__dirname, "../../node_modules"), __dirname]
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules|examples/,
        loader: "babel-loader"
      },
      {
        test: /\.js$/,
        include: /examples/,
        resourceQuery: /bundle/,
        use: [
          {
            loader: "bundle-loader",
            options: {
              lazy: true
            }
          },
          { loader: "babel-loader" }
        ]
      },
      {
        test: /\.js$/,
        include: /examples/,
        resourceQuery: /prismjs/,
        use: [
          {
            loader: "bundle-loader",
            options: {
              lazy: true
            }
          },
          {
            loader: "prismjs-loader",
            options: {
              lang: "jsx"
            }
          }
        ]
      },
      {
        test: /\.css$/,
        exclude: /prismjs/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },
      {
        test: /\.css$/,
        include: /prismjs/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },
      {
        test: /\.md(\?(.+))?$/,
        loader: "markdown-loader"
      },
      {
        test: /\.(gif|jpe?g|png|ico)$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 10000
            }
          }
        ]
      }
    ]
  },

  devServer: {
    historyApiFallback: true,
    quiet: false,
    noInfo: false,
    stats: {
      assets: true,
      version: false,
      hash: false,
      timings: false,
      chunks: false,
      chunkModules: true
    }
  }
};
