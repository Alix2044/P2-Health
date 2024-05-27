module.exports = {
	testEnvironment: 'node',
	testMatch: [ '**/tests/**/*.test.js' ],
	testPathIgnorePatterns: [ '<rootDir>/node_modules/', '<rootDir>/cypress/' ],
	silent:true
};
