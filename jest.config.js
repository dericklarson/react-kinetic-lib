// jest.config.js

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

module.exports = {
    testRegex: 'src/.*(_test|_spec|\\.test|\\.spec)\\.(js|jsx|vue|ts|tsx|mjs)$',
    setupFiles: ['./tests/setupTests.js'],
    setupTestFrameworkScriptFile: './tests/setupMatchers.js',
    snapshotSerializers: ['enzyme-to-json/serializer'],
};

