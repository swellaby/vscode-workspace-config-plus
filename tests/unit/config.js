'use strict';

const { assert } = require('chai');

const fileHandler = require('../../src/file-handler');
const {
  contributes: { configuration },
} = require('../../package.json');
const { properties: config } = configuration;

suite('config Suite', () => {
  test('Should have the correct number of configuration settings', () => {
    assert.deepStrictEqual(Object.keys(config).length, 2);
  });

  test('Should have correct config setting values for array merge behavior', () => {
    const arrayMergeConfig = config[fileHandler._arrayMergeKey];
    assert.deepStrictEqual(
      arrayMergeConfig.default,
      fileHandler._arrayMergeDefaultValue,
    );
    assert.deepStrictEqual(arrayMergeConfig.enum, ['combine', 'overwrite']);
  });
});
