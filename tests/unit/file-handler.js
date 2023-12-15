'use strict';

const { assert } = require('chai');
const jsoncParser = require('jsonc-parser');
const Sinon = require('sinon');

const { callbacks } = require('../data');
const fileHandler = require('../../src/file-handler');
const log = require('../../src/log');

const { FileType } = callbacks;

suite('file handler Suite', () => {
  /** @type {Sinon.SinonSandbox} */
  let sandbox;
  /**
   * @type {Sinon.SinonStubbedMember<
   *   import('../../src/wrappers').readFile
   * >}
   */
  let readFileStub;
  /** @type {import('vscode').Uri} */
  const fileUri = /** @type {import('vscode').Uri} */ (
    /** @type {unknown} */ ({ fsPath: 'projA/.vscode/settings.shared.json' })
  );
  const config = { 'window.zoomLevel': -1 };
  const contents = JSON.stringify(config);
  const buffer = Buffer.from(contents);

  setup(() => {
    sandbox = Sinon.createSandbox();
    readFileStub = sandbox
      .stub(callbacks, 'readFile')
      .withArgs(fileUri)
      .callsFake(async () => buffer);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('_loadConfigFromFile Suite', () => {
    /** @type {Sinon.SinonStubbedMember<jsoncParser.parse>} */
    let parseStub;
    const _loadConfigFromFile = fileHandler._loadConfigFromFile;

    setup(() => {
      parseStub = sandbox
        .stub(jsoncParser, 'parse')
        .withArgs(contents, [])
        .callsFake(() => config);
    });

    test('Should return undefined when file does not exist', async () => {
      readFileStub.callsFake(/** @type {any} */ (() => undefined));
      assert.isUndefined(
        await _loadConfigFromFile(fileUri, callbacks.readFile),
      );
      assert.deepStrictEqual(parseStub.callCount, 0);
    });

    test('Should return config object on valid json/jsonc', async () => {
      assert.deepStrictEqual(
        await _loadConfigFromFile(fileUri, callbacks.readFile),
        config,
      );
    });

    test('Should throw error on invalid json/jsonc', async () => {
      parseStub.callsFake((_c, errors) => {
        if (errors !== undefined) {
          errors.push({
            error: /** @type {any} */ ('oops'),
            offset: 0,
            length: _c.length,
          });
        }
      });
      try {
        await _loadConfigFromFile(fileUri, callbacks.readFile);
        assert.fail('Should have thrown');
      } catch (e) {
        assert.instanceOf(e, Error);
        if (e instanceof Error) {
          assert.deepStrictEqual(
            e.message,
            `Failed to parse contents of: ${fileUri.fsPath}`,
          );
        }
      }
    });
  });

  suite('mergeConfigFiles Suite', () => {
    /**
     * @type {Sinon.SinonStubbedMember<
     *   import('../../src/file-handler')._loadConfigFromFile
     * >}
     */
    let loadConfigFromFileStub;
    /** @type {typeof loadConfigFromFileStub} */
    let loadConfigFromVscodeFileStub;
    /** @type {Sinon.SinonStubbedMember<import('../../src/wrappers').stat>} */
    let statStub;
    /** @type {typeof statStub} */
    let statVscodeFileStub;
    /**
     * @type {Sinon.SinonStubbedMember<
     *   import('../../src/wrappers').writeFile
     * >}
     */
    let writeFileStub;
    /**
     * @type {Sinon.SinonStubbedMember<
     *   import('../../src/wrappers').delete
     * >}
     */
    let deleteStub;
    /**
     * @type {Sinon.SinonStubbedMember<
     *   import('../../src/wrappers').getWorkspaceConfiguration
     * >}
     */
    let getWorkspaceConfigurationStub;
    /** @type {Sinon.SinonStubbedMember<import('../../src/log').info>} */
    let logInfoStub;
    /** @type {Sinon.SinonStubbedMember<import('../../src/log').debug>} */
    let logDebugStub;
    /** @type {Sinon.SinonStubbedMember<import('../../src/log').error>} */
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
      'editor.rulers': [100, 80],
      '[typescript]': {
        'editor.dragAndDrop': true,
        'editor.tabCompletion': 'on',
        'editor.autoIndent': false,
      },
      [fileHandler._arrayMergeKey]: 'combine',
      'window.zoomLevel': 1,
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
      loadConfigFromFileStub = sandbox.stub(fileHandler, '_loadConfigFromFile');
      loadConfigFromVscodeFileStub = loadConfigFromFileStub.withArgs(
        vscodeFileUri,
        callbacks.readFile,
      );
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .resolves(sharedArrayCombineConfig);
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .resolves(localArrayCombineConfig);
      statStub = sandbox.stub(callbacks, 'stat').callsFake((...args) => {
        const e = new Error(JSON.stringify(args));
        e.name = 'stubbed';
        throw e;
      });
      statVscodeFileStub = statStub.withArgs(vscodeFileUri);

      loadConfigFromVscodeFileStub.resolves(vscodeConfig);
      statVscodeFileStub.resolves({
        ctime: 0,
        mtime: 0,
        size: 0,
        type: FileType.File,
      });
      writeFileStub = sandbox.stub(callbacks, 'writeFile');
      deleteStub = sandbox.stub(callbacks, 'delete');
      getWorkspaceConfigurationStub = sandbox
        .stub(callbacks, 'getWorkspaceConfiguration')
        .callsFake((section, defaultValue, scope) => {
          if (scope !== vscodeFileUri) {
            const e = new Error(
              `section: ${section}, defaultValue: ${defaultValue}, scope: ${scope}`,
            );
            e.name = 'stubbed';
            throw e;
          }
          return defaultValue;
        });
      logDebugStub = sandbox.stub(log, 'debug');
      logErrorStub = sandbox.stub(log, 'error');
      logInfoStub = sandbox.stub(log, 'info');
    });

    test('Should return early with no custom files exist', async () => {
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .resolves(undefined);
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .resolves(undefined);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 2);
      assert.deepStrictEqual(writeFileStub.callCount, 0);
      assert.deepStrictEqual(deleteStub.callCount, 0);
    });

    test('Should return early when there are no changes to be made', async () => {
      loadConfigFromVscodeFileStub.resolves(expArrayCombineConfig);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(writeFileStub.callCount, 0);
      assert.deepStrictEqual(deleteStub.callCount, 0);
    });

    test('Should handle a nonexistent local file', async () => {
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .resolves(undefined);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [],
      );
      assert.deepStrictEqual(logInfoStub.callCount, 1);
      assert.deepStrictEqual(logInfoStub.getCall(0).args, [
        `Updating config in ${vscodeFileUri.fsPath}`,
      ]);
      assert.deepStrictEqual(writeFileStub.callCount, 1);
      assert.deepStrictEqual(writeFileStub.getCall(0).args, [
        vscodeFileUri,
        Buffer.from(
          JSON.stringify(
            { ...vscodeConfig, ...sharedArrayCombineConfig },
            null,
            2,
          ),
        ),
        { create: true, overwrite: true },
      ]);
      assert.deepStrictEqual(deleteStub.callCount, 0);
    });

    test('Should handle a nonexistent shared file', async () => {
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .resolves(undefined);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(logInfoStub.callCount, 1);
      assert.deepStrictEqual(logInfoStub.getCall(0).args, [
        `Updating config in ${vscodeFileUri.fsPath}`,
      ]);
      assert.deepStrictEqual(writeFileStub.callCount, 1);
      assert.deepStrictEqual(writeFileStub.getCall(0).args, [
        vscodeFileUri,
        Buffer.from(
          JSON.stringify(
            { ...vscodeConfig, ...localArrayCombineConfig },
            null,
            2,
          ),
        ),
        { create: true, overwrite: true },
      ]);
      assert.deepStrictEqual(deleteStub.callCount, 0);
    });

    test('Should delete merged config file symlink with matching content using replace merged symlinks', async () => {
      const replaceMergedSymlinks = true;
      getWorkspaceConfigurationStub
        .withArgs(
          fileHandler._replaceMergedSymlinksKey,
          fileHandler._replaceMergedSymlinksDefaultValue,
          vscodeFileUri,
        )
        .returns(replaceMergedSymlinks);
      statVscodeFileStub.resolves({
        ctime: 0,
        mtime: 0,
        size: 0,
        type: FileType.File | FileType.SymbolicLink,
      });
      loadConfigFromVscodeFileStub.resolves(sharedArrayCombineConfig);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [],
      );
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(
        logInfoStub.getCalls().map(c => c.args),
        [
          [`Deleting matching symlink at ${vscodeFileUri.fsPath}`],
          [`Updating config in ${vscodeFileUri.fsPath}`],
        ],
      );
      assert.deepStrictEqual(
        deleteStub.getCalls().map(c => c.args),
        [[vscodeFileUri, { recursive: false, useTrash: false }]],
      );
      const finalExpArrayCombineConfig = { ...{}, ...expArrayCombineConfig };
      assert.deepStrictEqual(
        writeFileStub.getCalls().map(c => c.args),
        [
          [
            vscodeFileUri,
            Buffer.from(JSON.stringify(finalExpArrayCombineConfig, null, 2)),
            { create: true, overwrite: true },
          ],
        ],
      );
    });

    test('Should not delete merged config file symlink with differing content using replace merged symlinks', async () => {
      const replaceMergedSymlinks = true;
      getWorkspaceConfigurationStub
        .withArgs(
          fileHandler._replaceMergedSymlinksKey,
          fileHandler._replaceMergedSymlinksDefaultValue,
          vscodeFileUri,
        )
        .returns(replaceMergedSymlinks);
      statVscodeFileStub.resolves({
        ctime: 0,
        mtime: 0,
        size: 0,
        type: FileType.File | FileType.SymbolicLink,
      });
      loadConfigFromVscodeFileStub.resolves(expArrayCombineConfig);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [],
      );
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(
        logInfoStub.getCalls().map(c => c.args),
        [],
      );
      assert.deepStrictEqual(
        writeFileStub.getCalls().map(c => c.args),
        [],
      );
      assert.deepStrictEqual(
        deleteStub.getCalls().map(c => c.args),
        [],
      );
    });

    test('Should not delete merged config file with matching content using replace merged symlinks', async () => {
      const replaceMergedSymlinks = true;
      getWorkspaceConfigurationStub
        .withArgs(
          fileHandler._replaceMergedSymlinksKey,
          fileHandler._replaceMergedSymlinksDefaultValue,
          vscodeFileUri,
        )
        .returns(replaceMergedSymlinks);
      loadConfigFromVscodeFileStub.resolves(sharedArrayCombineConfig);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [],
      );
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(
        logInfoStub.getCalls().map(c => c.args),
        [
          [`Updating config in ${vscodeFileUri.fsPath}`],
        ],
      );
      assert.deepStrictEqual(
        deleteStub.getCalls().map(c => c.args),
        [],
      );
      const finalExpArrayCombineConfig = { ...sharedArrayCombineConfig, ...expArrayCombineConfig };
      assert.deepStrictEqual(
        writeFileStub.getCalls().map(c => c.args),
        [
          [
            vscodeFileUri,
            Buffer.from(JSON.stringify(finalExpArrayCombineConfig, null, 2)),
            { create: true, overwrite: true },
          ],
        ],
      );
    });

    test('Should write to config file with correct priority order using array combine', async () => {
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [],
      );
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(
        logInfoStub.getCalls().map(c => c.args),
        [[`Updating config in ${vscodeFileUri.fsPath}`]],
      );
      assert.deepStrictEqual(
        writeFileStub.getCalls().map(c => c.args),
        [
          [
            vscodeFileUri,
            Buffer.from(JSON.stringify(finalExpArrayCombineConfig, null, 2)),
            { create: true, overwrite: true },
          ],
        ],
      );
      assert.deepStrictEqual(
        deleteStub.getCalls().map(c => c.args),
        [],
      );
    });

    test('Should write to config file with correct priority order using shared array overwrite', async () => {
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .resolves(sharedArrayOverwriteConfig);
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .resolves(localArrayCombineConfig);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(
        logInfoStub.getCalls().map(c => c.args),
        [[`Updating config in ${vscodeFileUri.fsPath}`]],
      );
      assert.deepStrictEqual(
        writeFileStub.getCalls().map(c => c.args),
        [
          [
            vscodeFileUri,
            Buffer.from(JSON.stringify(finalExpArrayCombineConfig, null, 2)),
            { create: true, overwrite: true },
          ],
        ],
      );
      assert.deepStrictEqual(
        deleteStub.getCalls().map(c => c.args),
        [],
      );
    });

    test('Should write to config file with correct priority order using local array overwrite', async () => {
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .resolves(localArrayOverwriteConfig);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(
        logInfoStub.getCalls().map(c => c.args),
        [[`Updating config in ${vscodeFileUri.fsPath}`]],
      );
      assert.deepStrictEqual(
        writeFileStub.getCalls().map(c => c.args),
        [
          [
            vscodeFileUri,
            Buffer.from(JSON.stringify(expArrayOverwriteConfig, null, 2)),
            { create: true, overwrite: true },
          ],
        ],
      );
      assert.deepStrictEqual(
        deleteStub.getCalls().map(c => c.args),
        [],
      );
    });

    test('Should write to config file with correct priority order using correct array merge default', async () => {
      loadConfigFromFileStub
        .withArgs(sharedFileUri, callbacks.readFile)
        .resolves(sharedConfigNoArrayMerge);
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .resolves(localConfigNoArrayMerge);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 3);
      assert.deepStrictEqual(
        logInfoStub.getCalls().map(c => c.args),
        [[`Updating config in ${vscodeFileUri.fsPath}`]],
      );
      assert.deepStrictEqual(
        writeFileStub.getCalls().map(c => c.args),
        [
          [
            vscodeFileUri,
            Buffer.from(
              JSON.stringify(expArrayCombineConfigNoExplicitMerge, null, 2),
            ),
            { create: true, overwrite: true },
          ],
        ],
      );
      assert.deepStrictEqual(
        deleteStub.getCalls().map(c => c.args),
        [],
      );
    });

    test('Should maintain idempotency for unmodified settings', async () => {
      loadConfigFromVscodeFileStub
        .onSecondCall()
        .resolves(finalExpArrayCombineConfig);
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
        .resolves(updatedLocalConfig);
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

      assert.deepStrictEqual(loadConfigFromFileStub.callCount, 6);
      assert.deepStrictEqual(logInfoStub.callCount, 2);
      assert.deepStrictEqual(logInfoStub.getCall(0).args, [
        `Updating config in ${vscodeFileUri.fsPath}`,
      ]);
      assert.deepStrictEqual(writeFileStub.callCount, 2);
      assert.deepStrictEqual(writeFileStub.getCall(0).args, [
        vscodeFileUri,
        Buffer.from(JSON.stringify(finalExpArrayCombineConfig, null, 2)),
        { create: true, overwrite: true },
      ]);
      assert.deepStrictEqual(writeFileStub.getCall(1).args, [
        vscodeFileUri,
        Buffer.from(JSON.stringify(secondExpectedConfig, null, 2)),
        { create: true, overwrite: true },
      ]);
      assert.deepStrictEqual(
        deleteStub.getCalls().map(c => c.args),
        [],
      );
    });

    test('Should handle errors correctly', async () => {
      const err = new Error('i/o error');
      writeFileStub.rejects(err);
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [[`${err.name}: ${err.message}`]],
      );
      assert.deepStrictEqual(
        logDebugStub.getCalls().map(c => c.args),
        [[err]],
      );
    });

    test('Throws correct error on invalid type for array merge behavior', async () => {
      const arrayMerge = 2;
      const invalidArrayMergeTypeConfig = JSON.parse(
        JSON.stringify(localArrayCombineConfig),
      );
      invalidArrayMergeTypeConfig[fileHandler._arrayMergeKey] = arrayMerge;
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .resolves(invalidArrayMergeTypeConfig);
      const expErrMessage = `Invalid value for ${JSON.stringify(
        fileHandler._arrayMergeKey,
      )} setting: ${JSON.stringify(
        arrayMerge,
      )}. Must be "overwrite" or "combine"`;
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [[`Error: ${expErrMessage}`]],
      );
    });

    test('Throws correct error on invalid value for array merge behavior', async () => {
      const arrayMerge = 'shuffle';
      const invalidArrayMergeValueConfig = JSON.parse(
        JSON.stringify(localArrayCombineConfig),
      );
      invalidArrayMergeValueConfig[fileHandler._arrayMergeKey] = arrayMerge;
      loadConfigFromFileStub
        .withArgs(localFileUri, callbacks.readFile)
        .resolves(invalidArrayMergeValueConfig);
      const expErrMessage = `Invalid value for ${JSON.stringify(
        fileHandler._arrayMergeKey,
      )} setting: ${JSON.stringify(
        arrayMerge,
      )}. Must be "overwrite" or "combine"`;
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [[`Error: ${expErrMessage}`]],
      );
    });

    test('Throws correct error on invalid type for replace merged symlinks behavior', async () => {
      const replaceMergedSymlinks = 2;
      getWorkspaceConfigurationStub
        .withArgs(
          fileHandler._replaceMergedSymlinksKey,
          fileHandler._replaceMergedSymlinksDefaultValue,
          vscodeFileUri,
        )
        .returns(replaceMergedSymlinks);
      const expErrMessage = `Invalid value for ${JSON.stringify(
        fileHandler._replaceMergedSymlinksKey,
      )} setting: ${JSON.stringify(
        replaceMergedSymlinks,
      )}. Must be true or false`;
      await mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        ...callbacks,
      });
      assert.deepStrictEqual(
        logErrorStub.getCalls().map(c => c.args),
        [[`Error: ${expErrMessage}`]],
      );
    });
  });
});
