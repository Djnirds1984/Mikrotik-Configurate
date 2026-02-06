const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'worker.js',
    libraryTarget: 'commonjs'
  },
  target: 'webworker',
  mode: 'production',
  optimization: {
    minimize: true
  }
};