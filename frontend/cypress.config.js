const { defineConfig } = require('cypress');

module.exports = defineConfig({
  trashAssetsBeforeRuns: false,
  e2e: {
    baseUrl: 'http://localhost:4000',
    specPattern: 'cypress/integration/**/*.spec.js',
    supportFile: 'cypress/support/index.js',
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
