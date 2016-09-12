var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var productionPlugins = process.env.DEV_PORT ? [] : [
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.optimize.UglifyJsPlugin({compress: {
      warnings: false
  }})];


module.exports = {
  devtool: process.env.DEV_PORT ? 'eval' : 'source-map',
  entry: [
    './src/main.js'
  ],
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/static/',
    // export itself to a global var
    libraryTarget: "var",
    // name of the global var
    library: "LegoPlot"
  },
  externals: {
    // require("jquery") is external and available
    //  on the global var jQuery
    "jquery": "jQuery"
  },
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src')
      },
      // Extract css files
      {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },
      // Optionally extract less files
      // or any other compile-to-css language
      {
          test: /\.less$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
      },
      // load html template file
      { test: /\.html$/, loader: "raw-loader" },
      // the url-loader uses DataUrls.
      // the file-loader emits files.
      { test: /\.(woff|woff2)$/,  loader: "url-loader?limit=10000&mimetype=application/font-woff" },
      { test: /\.ttf$/,    loader: "file-loader" },
      { test: /\.eot$/,    loader: "file-loader" },
      { test: /\.svg$/,    loader: "file-loader" },
      //image loader
      {
        test: /\.(png|jpg|svg)$/,
        loader: 'url-loader?limit=8192'
      },
      // html templates
      { test: /\.handlebars$/, loader: "handlebars-template-loader" }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/ringo\/httpclient$/),
    new ExtractTextPlugin( "bundle.css" ),
    new webpack.DefinePlugin({
        'process.env': {
            // This has effect on the react lib size
            'NODE_ENV': process.env.DEV_PORT ? JSON.stringify('development') : JSON.stringify('production'),
        }
    })
  ].concat(productionPlugins),
  // resolve: {
  //   root: path.resolve(__dirname),
  //   alias: {
  //     ringo: 'ringojs-0.11.0/modules/ringo'
  //   },
  //   extentions: ['', '.js']
  // },
  devServer: {
    contentBase: './',
    historyApiFallback: true,
    host: '0.0.0.0',
    hot: true,
    port: process.env.DEV_PORT,
    publicPath: '/static',
    proxy: {
      '/api/*': {
        target: 'http://amigo-dev-golr.berkeleybop.org',
        pathRewrite: {
          '^/api': ''
        },
        // toProxy: true,
        // autoRewrite: true,
        changeOrigin: true, // changes the origin of the host header to the target URL,
                            // otherwise an Nginx landing page is the response somehow...
        secure: false,
      },
      '/species/*': {
        target: 'http://www.wormbase.org',
        changeOrigin: true, // changes the origin of the host header to the target URL,
        // otherwise an Nginx landing page is the response somehow...
        secure: false,
      },
      '/js/*': {
        target: 'http://www.wormbase.org',
        changeOrigin: true, // changes the origin of the host header to the target URL,
        // otherwise an Nginx landing page is the response somehow...
        secure: false,
      },
      '/css/*': {
        target: 'http://www.wormbase.org',
        changeOrigin: true, // changes the origin of the host header to the target URL,
        // otherwise an Nginx landing page is the response somehow...
        secure: false,
      },
      '/img/*': {
        target: 'http://www.wormbase.org',
        changeOrigin: true, // changes the origin of the host header to the target URL,
        // otherwise an Nginx landing page is the response somehow...
        secure: false,
      },
      '/rest/*': {
        target: 'http://www.wormbase.org',
        changeOrigin: true, // changes the origin of the host header to the target URL,
        // otherwise an Nginx landing page is the response somehow...
        secure: false,
      },
      '/search/*': {
        target: 'http://www.wormbase.org',
        changeOrigin: true, // changes the origin of the host header to the target URL,
        // otherwise an Nginx landing page is the response somehow...
        secure: false,
      },
    },
  }
}
