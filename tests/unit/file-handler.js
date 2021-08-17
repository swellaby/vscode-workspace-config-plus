'use strict';

const { assert } = require('chai');
const jsoncParser = require('jsonc-parser');
const Sinon = require('sinon');

const { callbacks } = require('../data');
const fileHandler = require('../..//src/file-handler');
const log = require('../../src/log');

suite('file handler Suite', () => {
  /** @type {Sinon.SinonStub} */
  let readFileStub;
  const fileUri = { fsPath: 'projA/.vscode/settings.shared.json' };
  const config = { 'window.zoomLevel': -1 };
  const contents = JSON.stringify(config);
  const buffer = Buffer.from(contents);

  setup(() => {
    readFileStub = Sinon.stub(callbacks, 'readFile').withArgs(fileUri).callsFake(() => buffer);
  });

  teardown(() => {
    Sinon.restore();
  });

  suite('_loadConfigFromFile Suite', () => {
    /** @type {Sinon.SinonStub} */
    let parseStub;
    const _loadConfigFromFile = fileHandler._loadConfigFromFile;

    setup(() => {
      parseStub = Sinon.stub(jsoncParser, 'parse')
        .withArgs(contents, [])
        .callsFake(() => config);
    });

    test('Should return undefined when file does not exist', async () => {
      readFileStub.callsFake(() => undefined);
      assert.isUndefined(await _loadConfigFromFile(fileUri, callbacks.readFile));
      assert.isFalse(parseStub.called);
    });

    test('Should return config object on valid json/jsonc', async () => {
      assert.deepEqual(
        await _loadConfigFromFile(fileUri, callbacks.readFile),
        config,
      );
    });

    test('Should throw error on invalid json/jsonc', async () => {
      parseStub.callsFake((_c, errors) => {
        errors.push('oops');
      });
      try {
        await _loadConfigFromFile(fileUri, callbacks.readFile);
        assert.fail('Should have thrown');
      } catch (e) {
        assert.deepEqual(e.message, `Failed to parse contents of: ${fileUri.fsPath}`);
      }
    });
  });

  suite('mergeConfigFiles Suite', () => {
    /** @type {Sinon.SinonStub} */
    let loadConfigFromFileStub;
    /** @type {Sinon.SinonStub} */
    let writeFileStub;
    /** @type {Sinon.SinonStub} */
    let logInfoStub;
    /** @type {Sinon.SinonStub} */
    let logDebugStub;
    /** @type {Sinon.SinonStub} */
    let logErrorStub;
    const vscodeFileUri = { fsPath: '.vscode/settings.json' };
    const sharedFileUri = { path: '.vscode/settings.shared.json' };
    const localFileUri = { path: '.vscode/settings.local.json' };
    const mergeConfigFiles = fileHandler.mergeConfigFiles;
    const sharedConfig = { foo: false };
    const localConfig = { foo: true, 'window.zoomLevel': 1, baz: false };
    const vscodeConfig = { foo: 'abc', 'window.zoomLevel': 0, bar: 'def' };
    const expConfig = {
      foo: true,
      'window.zoomLevel': 1,
      bar: 'def',
      baz: false
    };

    setup(() => {
      loadConfigFromFileStub = Sinon.stub(fileHandler, '_loadConfigFromFile');
      loadConfigFromFileStub.withArgs(sharedFileUri, callbacks.readFile).callsFake(() => Promise.resolve(sharedConfig));
      loadConfigFromFileStub.withArgs(localFileUri, callbacks.readFile).callsFake(() => Promise.resolve(localConfig));
      loadConfigFromFileStub.withArgs(vscodeFileUri, callbacks.readFile).callsFake(() => Promise.resolve(vscodeConfig));
      writeFileStub = Sinon.stub(callbacks, 'writeFile');
      logDebugStub = Sinon.stub(log, 'debug');
      logErrorStub = Sinon.stub(log, 'error');
      logInfoStub = Sinon.stub(log, 'info');
    });

    test('Should return early with no custom files exist', async () => {
      loadConfigFromFileStub.withArgs(sharedFileUri, callbacks.readFile).callsFake(() => Promise.resolve(undefined));
      loadConfigFromFileStub.withArgs(localFileUri, callbacks.readFile).callsFake(() => Promise.resolve(undefined));
      await mergeConfigFiles({ vscodeFileUri, sharedFileUri, localFileUri, ...callbacks });
      assert.isTrue(loadConfigFromFileStub.calledTwice);
      assert.isFalse(writeFileStub.called);
    });

    test('Should return early when there are no changes to be made', async () => {
      loadConfigFromFileStub.withArgs(vscodeFileUri, callbacks.readFile).callsFake(() => {
        return Promise.resolve({ ...sharedConfig, ...localConfig });
      });
      await mergeConfigFiles({ vscodeFileUri, sharedFileUri, localFileUri, ...callbacks });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isFalse(writeFileStub.called);
    });

    test('Should handle a nonexistent local file', async () => {
      loadConfigFromFileStub.withArgs(localFileUri, callbacks.readFile).callsFake(() => Promise.resolve(undefined));
      await mergeConfigFiles({ vscodeFileUri, sharedFileUri, localFileUri, ...callbacks });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(logInfoStub.calledOnceWithExactly(`Updating config in ${vscodeFileUri.fsPath}`));
      assert.isTrue(writeFileStub.calledOnceWithExactly(
        vscodeFileUri,
        Buffer.from(JSON.stringify({ ...vscodeConfig, ...sharedConfig }, null, 2)),
        { create: true, overwrite: true }
      ));
    });

    test('Should handle a nonexistent shared file', async () => {
      loadConfigFromFileStub.withArgs(sharedFileUri, callbacks.readFile).callsFake(() => Promise.resolve(undefined));
      await mergeConfigFiles({ vscodeFileUri, sharedFileUri, localFileUri, ...callbacks });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(logInfoStub.calledOnceWithExactly(`Updating config in ${vscodeFileUri.fsPath}`));
      assert.isTrue(writeFileStub.calledOnceWithExactly(
        vscodeFileUri,
        Buffer.from(JSON.stringify({ ...vscodeConfig, ...localConfig }, null, 2)),
        { create: true, overwrite: true }
      ));
    });

    test('Should write to config file with correct priority order', async () => {
      await mergeConfigFiles({ vscodeFileUri, sharedFileUri, localFileUri, ...callbacks });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(logInfoStub.calledOnceWithExactly(`Updating config in ${vscodeFileUri.fsPath}`));
      assert.isTrue(writeFileStub.calledOnceWithExactly(
        vscodeFileUri,
        Buffer.from(JSON.stringify(expConfig, null, 2)),
        { create: true, overwrite: true }
      ));
    });

    test('Should handle errors correctly', async () => {
      const err = new Error('i/o error');
      writeFileStub.callsFake(() => Promise.reject(err));
      await mergeConfigFiles({ vscodeFileUri, sharedFileUri, localFileUri, ...callbacks });
      assert.isTrue(logErrorStub.calledOnceWithExactly(err.message));
      assert.isTrue(logDebugStub.calledOnceWithExactly(err));
    });
  });
});
