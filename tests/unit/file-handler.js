'use strict';

const { assert } = require('chai');
const jsoncParser = require('jsonc-parser');
const Sinon = require('sinon');

const { callbacks } = require('../data');
const fileHandler = require('../../src/file-handler');
const log = require('../../src/log');

suite('file handler Suite', () => {
  /** @type {Sinon.SinonStub} */
  let readFileStub;
  /** @type {import('vscode').Uri} */
  const fileUri = /** @type {import('vscode').Uri} */ (
    /** @type {unknown} */ ({ fsPath: 'projA/.vscode/settings.shared.json' })
  );
  const config = { 'window.zoomLevel': -1 };
  const contents = JSON.stringify(config);
  const buffer = Buffer.from(contents);

  setup(() => {
    readFileStub = Sinon.stub(callbacks, 'readFile')
      .withArgs(fileUri)
      .callsFake(async () => buffer);
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
      assert.isUndefined(
        await _loadConfigFromFile(fileUri, callbacks.readFile),
      );
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
        assert.instanceOf(e, Error);
        if (e instanceof Error) {
          assert.deepEqual(
            e.message,
            `Failed to parse contents of: ${fileUri.fsPath}`,
          );
        }
      }
    });
  });

  suite('mergeConfigFiles Suite', () => {
    /** @type {Sinon.SinonStub} */
    let loadConfigFromFileStub;
    /** @type {Sinon.SinonStub} */
    let loadVSConfigFromFileStub;
    /** @type {Sinon.SinonStub} */
    let writeFileStub;
    /** @type {Sinon.SinonStub} */
    let logInfoStub;
    /** @type {Sinon.SinonStub} */
    let logDebugStub;
    /** @type {Sinon.SinonStub} */
    let logErrorStub;
    const vscodeFileUri = /** @type {import('vscode').Uri} */ ({
      fsPath: '.vscode/settings.json',
    });
    const sharedFileUri = /** @type {import('vscode').Uri} */ ({
      path: '.vscode/settings.shared.json',
    });
    const localFileUri = /** @type {import('vscode').Uri} */ ({
      path: '.vscode/settings.local.json',
    });
    const mergeConfigFiles = fileHandler.mergeConfigFiles;
    const vscodeConfig = {
      foo: 'abc',
      'window.zoomLevel': 0,
      bar: 'def',
    };
    const sharedArrayCombineConfig = {
      foo: false,
      'editor.rulers': [100],
      '[typescript]': {
        'editor.dragAndDrop': false,
        'editor.tabCompletion': 'on',
      },
      [fileHandler._arrayMergeKey]: 'combine',
    };
    const localArrayCombineConfig = {
      foo: true,
      'window.zoomLevel': 1,
      'editor.rulers': [80],
      '[typescript]': {
        'editor.dragAndDrop': true,
        'editor.autoIndent': false,
      },
      baz: false,
      [fileHandler._arrayMergeKey]: 'combine',
    };

    const expArrayCombineConfig = {
      foo: true,
      'window.zoomLevel': 1,
      'editor.rulers': [100, 80],
      '[typescript]': {
        'editor.dragAndDrop': true,
        'editor.tabCompletion': 'on',
        'editor.autoIndent': false,
      },
      [fileHandler._arrayMergeKey]: 'combine',
      baz: false,
    };
    const finalExpArrayCombineConfig = {
      ...vscodeConfig,
      ...expArrayCombineConfig,
    };
    const expArrayCombineConfigNoExplicitMerge = JSON.parse(
      JSON.stringify(finalExpArrayCombineConfig),
    );
    delete expArrayCombineConfigNoExplicitMerge[fileHandler._arrayMergeKey];

    const sharedArrayOverwriteConfig = {
      foo: false,
      'editor.rulers': [100],
      '[typescript]': {
        'editor.dragAndDrop': false,
        'editor.tabCompletion': 'on',
      },
      // Note the casing in the value, added intentionally to provide
      // defensive testing and ensure we aren't pedantic about case.
      [fileHandler._arrayMergeKey]: 'OVERwrite',
    };
    const sharedConfigNoArrayMerge = JSON.parse(
      JSON.stringify(sharedArrayOverwriteConfig),
    );
    delete sharedConfigNoArrayMerge[fileHandler._arrayMergeKey];
    const localArrayOverwriteConfig = {
      foo: true,
      'window.zoomLevel': 1,
      'editor.rulers': [80],
      '[typescript]': {
        'editor.dragAndDrop': true,
        'editor.autoIndent': false,
      },
      [fileHandler._arrayMergeKey]: 'overwrite',
      baz: false,
    };
    const localConfigNoArrayMerge = JSON.parse(
      JSON.stringify(localArrayOverwriteConfig),
    );
    delete localConfigNoArrayMerge[fileHandler._arrayMergeKey];
    const expArrayOverwriteConfig = {
      foo: true,
      'window.zoomLevel': 1,
      bar: 'def',
      'editor.rulers': [80],
      '[typescript]': {
        'editor.dragAndDrop': true,
        'editor.tabCompletion': 'on',
        'editor.autoIndent': false,
      },
      [fileHandler._arrayMergeKey]: 'overwrite',
      baz: false,
    };

    setup(() => {
      loadConfigFromFileStub = Sinon.stub(fileHandler, '_loadConfigFromFile');
      loadVSConfigFromFileStub = loadConfigFromFileStub.withArgs(
        vscodeFileUri,
        callbacks.readFile,
      );
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(sharedArrayCombineConfig));
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(localArrayCombineConfig));

      loadVSConfigFromFileStub.callsFake(() => Promise.resolve(vscodeConfig));
      writeFileStub = Sinon.stub(callbacks, 'writeFile');
      logDebugStub = Sinon.stub(log, 'debug');
      logErrorStub = Sinon.stub(log, 'error');
      logInfoStub = Sinon.stub(log, 'info');
    });

    test('Should return early with no custom files exist', async () => {
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(undefined));
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(undefined));
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(loadConfigFromFileStub.calledTwice);
      assert.isFalse(writeFileStub.called);
    });

    test('Should return early when there are no changes to be made', async () => {
      loadVSConfigFromFileStub.callsFake(() => {
        return Promise.resolve(expArrayCombineConfig);
      });
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isFalse(writeFileStub.called);
    });

    test('Should handle a nonexistent local file', async () => {
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(undefined));
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(
        logInfoStub.calledOnceWithExactly(
          `Updating config in ${vscodeFileUri.fsPath}`,
        ),
      );
      assert.isTrue(
        writeFileStub.calledOnceWithExactly(
          vscodeFileUri,
          Buffer.from(
            JSON.stringify(
              { ...vscodeConfig, ...sharedArrayCombineConfig },
              null,
              2,
            ),
          ),
          { create: true, overwrite: true },
        ),
      );
    });

    test('Should handle a nonexistent shared file', async () => {
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(undefined));
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(
        logInfoStub.calledOnceWithExactly(
          `Updating config in ${vscodeFileUri.fsPath}`,
        ),
      );
      assert.isTrue(
        writeFileStub.calledOnceWithExactly(
          vscodeFileUri,
          Buffer.from(
            JSON.stringify(
              { ...vscodeConfig, ...localArrayCombineConfig },
              null,
              2,
            ),
          ),
          { create: true, overwrite: true },
        ),
      );
    });

    test('Should write to config file with correct priority order using array combine', async () => {
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(
        logInfoStub.calledOnceWithExactly(
          `Updating config in ${vscodeFileUri.fsPath}`,
        ),
      );
      assert.isTrue(
        writeFileStub.calledOnceWithExactly(
          vscodeFileUri,
          Buffer.from(JSON.stringify(finalExpArrayCombineConfig, null, 2)),
          { create: true, overwrite: true },
        ),
      );
    });

    test('Should write to config file with correct priority order using shared array overwrite', async () => {
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(sharedArrayOverwriteConfig));
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(localArrayCombineConfig));
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(
        logInfoStub.calledOnceWithExactly(
          `Updating config in ${vscodeFileUri.fsPath}`,
        ),
      );
      assert.isTrue(
        writeFileStub.calledOnceWithExactly(
          vscodeFileUri,
          Buffer.from(JSON.stringify(finalExpArrayCombineConfig, null, 2)),
          { create: true, overwrite: true },
        ),
      );
    });

    test('Should write to config file with correct priority order using shared array overwrite', async () => {
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(localArrayOverwriteConfig));
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(
        logInfoStub.calledOnceWithExactly(
          `Updating config in ${vscodeFileUri.fsPath}`,
        ),
      );
      assert.isTrue(
        writeFileStub.calledOnceWithExactly(
          vscodeFileUri,
          Buffer.from(JSON.stringify(expArrayOverwriteConfig, null, 2)),
          { create: true, overwrite: true },
        ),
      );
    });

    test('Should write to config file with correct priority order using correct array merge default', async () => {
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(sharedConfigNoArrayMerge));
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(localConfigNoArrayMerge));
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(loadConfigFromFileStub.calledThrice);
      assert.isTrue(
        logInfoStub.calledOnceWithExactly(
          `Updating config in ${vscodeFileUri.fsPath}`,
        ),
      );
      assert.isTrue(
        writeFileStub.calledOnceWithExactly(
          vscodeFileUri,
          Buffer.from(
            JSON.stringify(expArrayCombineConfigNoExplicitMerge, null, 2),
          ),
          { create: true, overwrite: true },
        ),
      );
    });

    test('Should maintain idempotency for unmodified settings', async () => {
      loadVSConfigFromFileStub.onSecondCall().callsFake(() => {
        return Promise.resolve(finalExpArrayCombineConfig);
      });
      const updatedLocalConfig = JSON.parse(
        JSON.stringify(localArrayCombineConfig),
      );
      updatedLocalConfig.cow = 'moo';
      const secondExpectedConfig = JSON.parse(
        JSON.stringify(finalExpArrayCombineConfig),
      );
      secondExpectedConfig.cow = 'moo';
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .onSecondCall()
        .callsFake(() => Promise.resolve(updatedLocalConfig));
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });

      assert.deepEqual(loadConfigFromFileStub.callCount, 6);
      assert.isTrue(logInfoStub.calledTwice);
      assert.isTrue(
        logInfoStub.calledWith(`Updating config in ${vscodeFileUri.fsPath}`),
      );
      assert.isTrue(writeFileStub.calledTwice);
      assert.isTrue(
        writeFileStub.firstCall.calledWithExactly(
          vscodeFileUri,
          Buffer.from(JSON.stringify(finalExpArrayCombineConfig, null, 2)),
          { create: true, overwrite: true },
        ),
      );
      assert.isTrue(
        writeFileStub.secondCall.calledWithExactly(
          vscodeFileUri,
          Buffer.from(JSON.stringify(secondExpectedConfig, null, 2)),
          { create: true, overwrite: true },
        ),
      );
    });

    test('Should handle errors correctly', async () => {
      const err = new Error('i/o error');
      writeFileStub.callsFake(() => Promise.reject(err));
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(logErrorStub.calledOnceWithExactly(err.message));
      assert.isTrue(logDebugStub.calledOnceWithExactly(err));
    });

    test('Throws correct error on invalid type for array merge behavior', async () => {
      const arrayMerge = 2;
      const invalidArrayMergeTypeConfig = JSON.parse(
        JSON.stringify(localArrayCombineConfig),
      );
      invalidArrayMergeTypeConfig[fileHandler._arrayMergeKey] = arrayMerge;
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(invalidArrayMergeTypeConfig));
      const expErrMessage = `Invalid value for 'arrayMerge' setting: '${arrayMerge}'. Must be 'overwrite' or 'combine'`;
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(logErrorStub.calledOnceWithExactly(expErrMessage));
    });

    test('Throws correct error on invalid value for array merge behavior', async () => {
      const arrayMerge = 'shuffle';
      const invalidArrayMergeValueConfig = JSON.parse(
        JSON.stringify(localArrayCombineConfig),
      );
      invalidArrayMergeValueConfig[fileHandler._arrayMergeKey] = arrayMerge;
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .callsFake(() => Promise.resolve(invalidArrayMergeValueConfig));
      const expErrMessage = `Invalid value for 'arrayMerge' setting: '${arrayMerge}'. Must be 'overwrite' or 'combine'`;
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.isTrue(logErrorStub.calledOnceWithExactly(expErrMessage));
    });
  });
});
