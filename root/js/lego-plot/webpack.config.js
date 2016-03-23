var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'eval',
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
  module: {
    // loaders: [
    //   {
    //     test: /\.js$/,
    //     loaders: [ 'babel' ],
    //  //   include: path.join(__dirname, 'src')
    //   }
    // ]
  },
  plugins: [
    new webpack.IgnorePlugin(/ringo\/httpclient$/)
  ],
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
        rewrite: function(req) {
          req.url = req.url.replace(/^\/api/, '');
        },
        // toProxy: true,
        // autoRewrite: true,
        changeOrigin: true, // changes the origin of the host header to the target URL,
                            // otherwise an Nginx landing page is the response somehow...
        secure: false,
      },
    },
  }
}
