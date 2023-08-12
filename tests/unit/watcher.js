'use strict';

const { assert } = require('chai');
const Sinon = require('sinon');

const { callbacks, globPattern, uris } = require('../data');
const fileHandler = require('../../src/file-handler');
const watcher = require('../../src/watcher');

suite('watcher Suite', () => {
  const firstWatcher = { dispose: () => null };
  const secondWatcher = { dispose: () => null };
  const thirdWatcher = { dispose: () => null };
  const fourthWatcher = { dispose: () => null };

  /** @type {Sinon.SinonStub} */
  let firstWatcherDisposeStub;
  /** @type {Sinon.SinonStub} */
  let secondWatcherDisposeStub;
  /** @type {Sinon.SinonStub} */
  let thirdWatcherDisposeStub;
  /** @type {Sinon.SinonStub} */
  let fourthWatcherDisposeStub;

  setup(() => {
    watcher._privateState.fileSystemWatchers = {
      first: [firstWatcher, secondWatcher],
      second: [thirdWatcher, fourthWatcher],
    };
    firstWatcherDisposeStub = Sinon.stub(firstWatcher, 'dispose');
    secondWatcherDisposeStub = Sinon.stub(secondWatcher, 'dispose');
    thirdWatcherDisposeStub = Sinon.stub(thirdWatcher, 'dispose');
    fourthWatcherDisposeStub = Sinon.stub(fourthWatcher, 'dispose');
  });

  teardown(() => {
    Sinon.restore();
  });

  suite('generateFileSystemWatcher Suite', () => {
    /** @type {Sinon.SinonFakeTimers} */
    let clock;
    /** @type {Sinon.SinonStub} */
    let registerSharedFileSystemWatcherStub;
    /** @type {Sinon.SinonStub} */
    let mergeFilesStub;
    // ~ 2021-08-16T20-17-50Z
    const initialTime = 1629162959014;
    const { generateFileSystemWatcher } = watcher;
    const folderUri = /** @type {import('vscode').Uri} */ (
      /** @type {unknown} */ ('my-project/.vscode')
    );
    const args = {
      ...callbacks,
      ...uris,
      folderUri,
      globPattern,
    };
    /** @type {(e: import('vscode').Uri) => any} */
    let handleFileEvent;

    setup(() => {
      clock = Sinon.useFakeTimers();
      clock.tick(initialTime);
      registerSharedFileSystemWatcherStub = Sinon.stub(
        watcher,
        '_registerSharedFileSystemWatcher',
      ).callsFake((_g, _c, _f, cb) => {
        handleFileEvent = cb;
      });
      mergeFilesStub = Sinon.stub(fileHandler, 'mergeConfigFiles');
    });

    teardown(() => {
      handleFileEvent = /** @type {typeof handleFileEvent} */ (
        /** @type {unknown} */ (undefined)
      );
    });

    test('Should not merge twice on duplicate events in rapid succession', async () => {
      generateFileSystemWatcher(args);
      await handleFileEvent(uris.sharedFileUri);
      clock.tick(349);
      await handleFileEvent(uris.sharedFileUri);
      assert.isTrue(mergeFilesStub.calledOnce);
    });

    test('Should merge again if same type of events happen outside the cache boundary', async () => {
      generateFileSystemWatcher(args);
      await handleFileEvent(uris.sharedFileUri);
      clock.tick(351);
      await handleFileEvent(uris.sharedFileUri);
      assert.isTrue(mergeFilesStub.calledTwice);
    });

    test('Should register watcher correctly', async () => {
      generateFileSystemWatcher(args);
      assert.isTrue(registerSharedFileSystemWatcherStub.calledOnce);
      const callArgs = registerSharedFileSystemWatcherStub.firstCall.args;
      // The fourth arg is the inner callback function, which is validated above.
      assert.deepEqual(callArgs[0], globPattern);
      assert.deepEqual(callArgs[1], callbacks.createFileSystemWatcher);
      assert.deepEqual(callArgs[2], folderUri);
    });
  });

  suite('_registerSharedFileSystemWatcher Suite', () => {
    /** @type {Sinon.SinonStub} */
    // eslint-disable-next-line no-unused-vars
    let createFileSystemWatcherStub;
    /** @type {Sinon.SinonStub} */
    // eslint-disable-next-line no-unused-vars
    let onDidChangeStub;
    /** @type {Sinon.SinonStub} */
    // eslint-disable-next-line no-unused-vars
    let onDidCreateStub;
    /** @type {Sinon.SinonStub} */
    // eslint-disable-next-line no-unused-vars
    let onDidDeleteStub;
    const fileSystemWatcher =
      /** @type {import('vscode').FileSystemWatcher} */ ({
        dispose: () => null,
        ignoreChangeEvents: false,
        ignoreCreateEvents: false,
        ignoreDeleteEvents: false,
        onDidChange: () =>
          /** @type {import('vscode').Disposable} */ (
            /** @type {unknown} */ (null)
          ),
        onDidCreate: () =>
          /** @type {import('vscode').Disposable} */ (
            /** @type {unknown} */ (null)
          ),
        onDidDelete: () =>
          /** @type {import('vscode').Disposable} */ (
            /** @type {unknown} */ (null)
          ),
      });
    const vscodeDirUri =
      /** @type {import('vscode').Uri & import('vscode').WorkspaceFolder} */ (
        /** @type {unknown} */ ({ uri: 'foo/.vscode' })
      );
    const pattern = /** @type {import('vscode').GlobPattern} */ ('{a,b}.json');
    /** @type {(e: import('vscode').Uri) => any} */
    const handleEvent = () => {};
    const didChange = /** @type {import('vscode').Disposable} */ (
      /** @type {unknown} */ ('indeed')
    );
    const didCreate = /** @type {import('vscode').Disposable} */ (
      /** @type {unknown} */ ({ foo: 'bar' })
    );
    const didDelete = /** @type {import('vscode').Disposable} */ (
      /** @type {unknown} */ (false)
    );

    setup(() => {
      createFileSystemWatcherStub = Sinon.stub(
        callbacks,
        'createFileSystemWatcher',
      )
        .withArgs(pattern)
        .callsFake(() => fileSystemWatcher);
      onDidChangeStub = Sinon.stub(fileSystemWatcher, 'onDidChange').callsFake(
        () => didChange,
      );
      onDidCreateStub = Sinon.stub(fileSystemWatcher, 'onDidCreate').callsFake(
        () => didCreate,
      );
      onDidDeleteStub = Sinon.stub(fileSystemWatcher, 'onDidDelete').callsFake(
        () => didDelete,
      );
    });

    test('Should register the provided uri correctly', () => {
      watcher._registerSharedFileSystemWatcher(
        pattern,
        callbacks.createFileSystemWatcher,
        vscodeDirUri,
        handleEvent,
      );
      assert.deepEqual(watcher._privateState.fileSystemWatchers[`${vscodeDirUri}`], [
        didChange,
        didCreate,
        didDelete,
      ]);
    });
  });

  suite('disposeAllWatchers Suite', () => {
    test('Should invoke dispose on all watcher disposables', () => {
      watcher.disposeAllWatchers();
      assert.isTrue(firstWatcherDisposeStub.calledOnce);
      assert.isTrue(secondWatcherDisposeStub.calledOnce);
      assert.isTrue(thirdWatcherDisposeStub.calledOnce);
      assert.isTrue(fourthWatcherDisposeStub.calledOnce);
    });
  });

  suite('disposeWorkspaceWatcher Suite', () => {
    test('Should invoke dispose on all disposables for workspace', () => {
      watcher.disposeWorkspaceWatcher(
        /** @type {import('vscode').Uri} */ (/** @type {unknown} */ ('first')),
      );
      assert.isTrue(firstWatcherDisposeStub.calledOnce);
      assert.isTrue(secondWatcherDisposeStub.calledOnce);
      assert.isFalse(thirdWatcherDisposeStub.calledOnce);
      assert.isFalse(fourthWatcherDisposeStub.calledOnce);
    });
  });
});
