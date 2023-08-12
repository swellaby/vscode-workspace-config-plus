'use strict';

const { assert } = require('chai');
const Sinon = require('sinon');

const fileHandler = require('../../src/file-handler');
const lib = require('../../src/lib');
const log = require('../../src/log');
const data = require('../data');
const watcher = require('../../src/watcher');

suite('lib Suite', () => {
  teardown(() => {
    Sinon.restore();
  });

  suite('deactivate Suite', () => {
    test('Should handle deactivation correctly', () => {
      const logInfoStub = Sinon.stub(log, 'info');
      const logDisposeStub = Sinon.stub(log, 'dispose');
      const disposeAllWatchersStub = Sinon.stub(watcher, 'disposeAllWatchers');
      lib.deactivate();
      assert.deepStrictEqual(logInfoStub.getCall(0).args, [
        'Deactivating and disposing all watchers',
      ]);
      assert.deepStrictEqual(disposeAllWatchersStub.callCount, 1);
      assert.deepStrictEqual(logDisposeStub.callCount, 1);
    });
  });

  suite('handleWorkspaceFolderUpdates Suite', () => {
    /** @type {Sinon.SinonStub} */
    let initializeWorkspaceFolderStub;
    /** @type {Sinon.SinonStub} */
    let disposeWorkspaceWatcherStub;

    setup(() => {
      initializeWorkspaceFolderStub = Sinon.stub(
        lib,
        'initializeWorkspaceFolder',
      );
      disposeWorkspaceWatcherStub = Sinon.stub(
        watcher,
        'disposeWorkspaceWatcher',
      );
    });

    test('Should handle falsy value for added folders', () => {
      lib.handleWorkspaceFolderUpdates({ ...data.callbacks });
      assert.deepStrictEqual(initializeWorkspaceFolderStub.callCount, 0);
    });

    test('Should handle non-array value for added folders', () => {
      lib.handleWorkspaceFolderUpdates({ added: 7, ...data.callbacks });
      assert.deepStrictEqual(initializeWorkspaceFolderStub.callCount, 0);
    });

    test('Should properly initialize added folders', () => {
      const added = [
        {
          uri: /** @type {import('vscode').Uri} */ (
            /** @type {unknown} */ ('foo/bar')
          ),
        },
        {
          uri: /** @type {import('vscode').Uri} */ (
            /** @type {unknown} */ ('baz/qux')
          ),
        },
      ];
      lib.handleWorkspaceFolderUpdates({ added, ...data.callbacks });
      assert.deepStrictEqual(initializeWorkspaceFolderStub.firstCall.firstArg, {
        folderUri: added[0].uri,
        ...data.callbacks,
      });
    });

    test('Should handle falsy value for removed folders', () => {
      lib.handleWorkspaceFolderUpdates({ ...data.callbacks });
      assert.deepStrictEqual(disposeWorkspaceWatcherStub.callCount, 0);
    });

    test('Should handle non-array value for removed folders', () => {
      lib.handleWorkspaceFolderUpdates({ removed: 'why', ...data.callbacks });
      assert.deepStrictEqual(initializeWorkspaceFolderStub.callCount, 0);
    });

    test('Should properly handle removed folders', () => {
      const removed = [
        {
          uri: /** @type {import('vscode').Uri} */ (
            /** @type {unknown} */ ('bar/foo')
          ),
        },
        {
          uri: /** @type {import('vscode').Uri} */ (
            /** @type {unknown} */ ('qux/baz')
          ),
        },
      ];
      lib.handleWorkspaceFolderUpdates({ removed, ...data.callbacks });
      assert.deepStrictEqual(disposeWorkspaceWatcherStub.callCount, 2);
      assert.deepStrictEqual(disposeWorkspaceWatcherStub.getCall(0).args, [
        removed[0].uri,
      ]);
      assert.deepStrictEqual(disposeWorkspaceWatcherStub.getCall(1).args, [
        removed[1].uri,
      ]);
    });
  });

  suite('initializeLog Suite', () => {
    test('Should initialize log correctly', () => {
      const createOutputChannel = () => {
        return /** @type {import('vscode').OutputChannel} */ (
          /** @type {unknown} */ (7)
        );
      };
      const logInitializeStub = Sinon.stub(log, 'initialize');
      lib.initializeLog(createOutputChannel);
      assert.deepStrictEqual(logInitializeStub.getCall(0).args, [
        createOutputChannel,
      ]);
    });
  });

  suite('initializeWorkspaceFolder Suite', () => {
    const { callbacks } = data;
    const {
      createFileSystemWatcher,
      FileType,
      stat,
      readFile,
      writeFile,
      delete: delete_,
      getWorkspaceConfiguration,
    } = callbacks;
    /** @type {Sinon.SinonStub} */
    let generateFileSystemWatcherStub;
    /** @type {Sinon.SinonStub} */
    let mergeConfigFilesStub;
    /** @type {Sinon.SinonStub} */
    let joinPathStub;
    /** @type {Sinon.SinonStub} */
    let createRelativePatternStub;
    const workspaceVscodeDirUri = /** @type {import('vscode').Uri} */ (
      /** @type {unknown} */ ({ uri: 'foo/.vscode' })
    );
    const folderUri = /** @type {import('vscode').Uri} */ (
      /** @type {unknown} */ ({ uri: 'foo' })
    );
    const { globPattern } = data;
    const { vscodeFileUri, localFileUri, sharedFileUri } = data.uris;

    setup(() => {
      generateFileSystemWatcherStub = Sinon.stub(
        watcher,
        'generateFileSystemWatcher',
      );
      mergeConfigFilesStub = Sinon.stub(fileHandler, 'mergeConfigFiles');
      joinPathStub = Sinon.stub(callbacks, 'joinPath');
      joinPathStub
        .withArgs(folderUri, '.vscode')
        .callsFake(() => workspaceVscodeDirUri);
      createRelativePatternStub = Sinon.stub(
        callbacks,
        'createRelativePattern',
      );
    });

    /** @param {import('vscode').GlobPattern} pattern */
    const assertGenerateWatcherCall = pattern => {
      for (const call of generateFileSystemWatcherStub.getCalls()) {
        assert.isDefined(call.args[0]);
        if (call.args[0].globPattern !== undefined) {
          assert.deepStrictEqual(call.args, [
            {
              globPattern: pattern,
              folderUri,
              ...data.uris,
              createFileSystemWatcher,
              FileType,
              stat,
              readFile,
              writeFile,
              delete: delete_,
              getWorkspaceConfiguration,
            },
          ]);
        }
      }
    };

    const assertMergeFilesCall = () => {
      for (const call of generateFileSystemWatcherStub.getCalls()) {
        assert.isDefined(call.args[0]);
        if (!('globPattern' in call.args[0])) {
          assert.deepStrictEqual(call.args, [
            {
              ...data.uris,
              FileType,
              stat,
              readFile,
              writeFile,
              delete: delete_,
              getWorkspaceConfiguration,
            },
          ]);
        }
      }
    };

    test('Should run for every entry in target config files', () => {
      const expectedCount = 3;
      lib.initializeWorkspaceFolder({ folderUri, ...callbacks });
      assert.deepStrictEqual(
        generateFileSystemWatcherStub.callCount,
        expectedCount,
      );
      assert.deepStrictEqual(mergeConfigFilesStub.callCount, expectedCount);
    });

    test('Should initialize settings.json correctly', () => {
      createRelativePatternStub
        .withArgs(
          workspaceVscodeDirUri,
          '{settings.local,settings.shared}.json',
        )
        .callsFake(() => globPattern);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'settings.json')
        .callsFake(() => vscodeFileUri);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'settings.shared.json')
        .callsFake(() => sharedFileUri);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'settings.local.json')
        .callsFake(() => localFileUri);

      lib.initializeWorkspaceFolder({ folderUri, ...callbacks });
      assertGenerateWatcherCall(globPattern);
      assertMergeFilesCall();
    });

    test('Should initialize launch.json correctly', () => {
      createRelativePatternStub
        .withArgs(workspaceVscodeDirUri, '{launch.local,launch.shared}.json')
        .callsFake(() => globPattern);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'launch.json')
        .callsFake(() => vscodeFileUri);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'launch.shared.json')
        .callsFake(() => sharedFileUri);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'launch.local.json')
        .callsFake(() => localFileUri);

      lib.initializeWorkspaceFolder({ folderUri, ...callbacks });
      assertGenerateWatcherCall(globPattern);
      assertMergeFilesCall();
    });

    test('Should initialize tasks.json correctly', () => {
      createRelativePatternStub
        .withArgs(workspaceVscodeDirUri, '{tasks.local,tasks.shared}.json')
        .callsFake(() => globPattern);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'tasks.json')
        .callsFake(() => vscodeFileUri);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'tasks.shared.json')
        .callsFake(() => sharedFileUri);
      joinPathStub
        .withArgs(workspaceVscodeDirUri, 'tasks.local.json')
        .callsFake(() => localFileUri);

      lib.initializeWorkspaceFolder({ folderUri, ...callbacks });
      assertGenerateWatcherCall(globPattern);
      assertMergeFilesCall();
    });
  });
});
