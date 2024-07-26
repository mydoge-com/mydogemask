const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

require('dotenv').config({ path: './.env' });

module.exports = {
  entry: {
    background: './scripts/background.js',
    contentScript: './scripts/contentScript.js',
    'inject-script': './scripts/inject-script.js',
  },
  output: {
    filename: './compiled/[name].js',
    path: path.resolve(__dirname, 'scripts'),
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
    new NodePolyfillPlugin(),
  ],
};
