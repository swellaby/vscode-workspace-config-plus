'use strict';

const { assert } = require('chai');

const fileHandler = require('../../src/file-handler');
const {
  contributes: { configuration },
} = require('../../package.json');
const { properties: config } = configuration;

suite('config Suite', () => {
  test('Should have the correct number of configuration settings', () => {
    assert.deepEqual(Object.keys(config).length, 1);
  });

  test('Should have correct config setting values for array merge behavior', () => {
    const arrayMergeConfig = config[fileHandler._arrayMergeKey];
    assert.deepEqual(
      arrayMergeConfig.default,
      fileHandler._arrayMergeDefaultValue
    );
    assert.deepEqual(arrayMergeConfig.enum, ['combine', 'overwrite']);
  });
});
