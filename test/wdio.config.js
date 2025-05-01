/* global browser, browserVersion */
require('dotenv').config()
const staticServerPort = process.env.PORT || 4567

// Detect if running in CI environment
const isCI = Boolean(process.env.CI)
const useHeadless = Boolean(process.env.HEADLESS || isCI)

// Adjust timeouts based on environment
const timeoutMultiplier = isCI ? 3 : 1

exports.config = {
  runner: 'local',

  specs: [
    './integration/**/*.js'
  ],
  exclude: [
    // 'path/to/excluded/files'
  ],

  // Reduce parallel instances in CI to prevent resource contention
  maxInstances: isCI
    ? 1
    : 10,

  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      // Add headless and other options for CI environments
      args: useHeadless
        ? [
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080'
          ]
        : []
    }
  }],

  logLevel: process.env.WDIO_LOG_LEVEL || 'info',

  bail: 0,
  baseUrl: 'http://localhost:' + staticServerPort,

  // Increase timeouts for CI environment
  waitforTimeout: 10000 * timeoutMultiplier,
  connectionRetryTimeout: 120000 * timeoutMultiplier,
  connectionRetryCount: isCI ? 5 : 3,

  framework: 'mocha',

  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    // Increase Mocha timeout for CI
    timeout: 60000 * timeoutMultiplier
  },

  outputDir: './logs/',
  screenshotPath: './screenshots/',

  services: [
    ['static-server', {
      folders: [
        { mount: '/', path: './examples' },
        { mount: '/dist/', path: './dist' }
      ],
      port: staticServerPort
    }]
  ],

  // Hook to take screenshots on test failure
  afterTest: async function (test, context, { error, result, duration, passed, retries }) {
    if (!passed) {
      const { browserName } = browser.capabilities
      const isIE = browserName === 'internet explorer'
      const timestamp = +new Date()
      const browserVariant = isIE ? `ie${browserVersion}` : browserName
      const testTitle = encodeURIComponent(test.title.replace(/\s+/g, '-'))
      const filename = `${this.screenshotPath}${timestamp}-${browserVariant}-${testTitle}.png`

      try {
        await browser.saveScreenshot(filename)
        console.log(`Test failed, created: ${filename}`)
      } catch (error) {
        console.error(`Failed to save screenshot: ${error.message}`)
      }
    }
  },

  // Add hooks to ensure proper test setup/teardown in CI
  before: async function (capabilities, specs) {
    // Adding a small global pause to allow browser to fully initialize
    if (isCI) {
      console.log('Running in CI environment with extended timeouts')
      await browser.pause(2000)
    }
  },

  beforeTest: async function (test, context) {
    if (isCI) {
      // Add additional debugging info in CI
      console.log(`Running test: ${test.title}`)
    }
  }
}
