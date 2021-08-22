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
    watcher._fileSystemWatchers = {
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
    const folderUri = 'my-project/.vscode';
    const args = {
      ...callbacks,
      ...uris,
      folderUri,
      globPattern,
    };
    let handleFileEvent;

    setup(() => {
      clock = Sinon.useFakeTimers();
      clock.tick(initialTime);
      registerSharedFileSystemWatcherStub = Sinon.stub(
        watcher,
        '_registerSharedFileSystemWatcher'
      ).callsFake((_g, _c, _f, cb) => {
        handleFileEvent = cb;
      });
      mergeFilesStub = Sinon.stub(fileHandler, 'mergeConfigFiles');
    });

    teardown(() => {
      handleFileEvent = null;
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
    let createFileSystemWatcherStub;
    /** @type {Sinon.SinonStub} */
    let onDidChangeStub;
    /** @type {Sinon.SinonStub} */
    let onDidCreateStub;
    /** @type {Sinon.SinonStub} */
    let onDidDeleteStub;
    const fileSystemWatcher = {
      onDidChange: () => null,
      onDidCreate: () => null,
      onDidDelete: () => null,
    };
    const vsCodeUri = { uri: 'foo/.vscode' };
    const pattern = { path: '{a,b}.json' };
    const handleEvent = (_a, _b, _c, _d = '') => {};
    const didChange = 'indeed';
    const didCreate = { foo: 'bar' };
    const didDelete = false;

    setup(() => {
      createFileSystemWatcherStub = Sinon.stub(
        callbacks,
        'createFileSystemWatcher'
      )
        .withArgs(pattern)
        .callsFake(() => fileSystemWatcher);
      onDidChangeStub = Sinon.stub(fileSystemWatcher, 'onDidChange').callsFake(
        () => didChange
      );
      onDidCreateStub = Sinon.stub(fileSystemWatcher, 'onDidCreate').callsFake(
        () => didCreate
      );
      onDidDeleteStub = Sinon.stub(fileSystemWatcher, 'onDidDelete').callsFake(
        () => didDelete
      );
    });

    test('Should register the provided uri correctly', () => {
      watcher._registerSharedFileSystemWatcher(
        pattern,
        callbacks.createFileSystemWatcher,
        vsCodeUri,
        handleEvent
      );
      assert.deepEqual(watcher._fileSystemWatchers[vsCodeUri], [
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
      watcher.disposeWorkspaceWatcher('first');
      assert.isTrue(firstWatcherDisposeStub.calledOnce);
      assert.isTrue(secondWatcherDisposeStub.calledOnce);
      assert.isFalse(thirdWatcherDisposeStub.calledOnce);
      assert.isFalse(fourthWatcherDisposeStub.calledOnce);
    });
  });
});
