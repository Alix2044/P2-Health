const { defineConfig } = require('cypress');

module.exports = defineConfig({
	e2e: {
		setupNodeEvents(on, config) {},
		//baseUrl: `http://localhost:${process.ENV.PORT}`,
		baseUrl: `http://localhost:5000`,
		viewportWidth: 1280,
		viewportHeight: 720,
		specPattern: 'cypress/e2e/**/*.spec.js',
		supportFile: 'cypress/support/e2e.js'
	}
});
