// Karma configuration
const puppeteer = require('puppeteer');

process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function (config) {
    config.set({
        basePath: '',

        frameworks: ['jasmine'],

        files: [
            { pattern: 'src/settings/*.js', type: "module" },
            { pattern: 'src/components/cell/*.js', type: "module" },
            { pattern: 'src/components/cell/formatters/*.js', type: "module" },
            { pattern: 'src/components/column/*.js', type: "module" },
            { pattern: 'src/components/context/*.js', type: "module" },
            { pattern: 'src/components/data/*.js', type: "module" },
            { pattern: 'src/components/events/*.js', type: "module" },
            { pattern: 'src/components/helpers/*.js', type: "module" },
            { pattern: 'src/components/table/*.js', type: "module" },
            { pattern: 'src/modules/**/*.js', type: "module" },
            { pattern: 'tests/fixtures/*.js', type: "module" },
            { pattern: 'tests/specs/*.test.js', type: "module" }
        ],

        exclude: [],
        reporters: ['progress'],
        browsers: ['ChromeHeadless'],
        customLaunchers: {
          ChromeHeadless: {
            base: 'Chrome',
            flags: [
              '--no-sandbox',
              '--disable-gpu',
              '--headless',
              '--disable-dev-shm-usage',
              '--remote-debugging-port=9222',
              '--disable-web-security',
              '--disable-background-timer-throttling',
              '--disable-renderer-backgrounding',
              '--disable-backgrounding-occluded-windows'
            ]
          }
        },
        singleRun: true,
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        concurrency: Infinity,
        plugins: [
            'karma-jasmine',
            'karma-chrome-launcher',
            'jasmine-core'
        ]
    })
}