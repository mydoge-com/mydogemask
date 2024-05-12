const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

require('dotenv').config({ path: '../.env' });

module.exports = {
  entry: {
    background: './background.js',
    contentScript: './contentScript.js',
    'inject-script': './inject-script.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'compiled'),
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
