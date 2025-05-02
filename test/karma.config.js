require('@babel/register')({
  cwd: require('path').resolve(__dirname, '../')
})
const puppeteer = require('puppeteer')
const baseWebpackConfig = require('../webpack.config.babel.js')[0]
const webpack = require('webpack')
const path = require('path')
process.env.CHROME_BIN = puppeteer.executablePath()

module.exports = function (config) {
  config.set({
    basePath: '../',
    frameworks: ['mocha', 'chai-sinon'],
    reporters: ['mocha'],
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
    files: [
      'test/functional/**/*.js'
    ],
    preprocessors: {
      'test/**/*.js': ['webpack'],
      'src/**/*.js': ['webpack'],
      '**/*.js': ['sourcemap']
    },
    webpack: {
      ...baseWebpackConfig,
      module: {
        rules: [
          ...(baseWebpackConfig.module?.rules || []),
          {
            test: /\.js$/,
            include: [
              path.resolve(__dirname, '../node_modules/chai')
            ],
            use: {
              loader: 'babel-loader'
            }
          }
        ]
      },
      plugins: [
        ...(baseWebpackConfig.plugins || []),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('test')
        })
      ]
    },
    webpackMiddleware: {
      logLevel: 'error',
      stats: 'errors-only'
    }
  })
}
