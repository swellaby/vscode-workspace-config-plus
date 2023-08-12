'use strict';

const fileHandler = require('./file-handler');

/** @type {{ [index: string]: import('vscode').Disposable[] }} */
const _fileSystemWatchers = {};

/**
 * @param {import('vscode').GlobPattern} globPattern
 * @param {import('./wrappers').createFileSystemWatcher} createFileSystemWatcher
 * @param {import('vscode').Uri} workspaceUri
 * @param {(e: import('vscode').Uri) => any} onFileSystemEventHandler
 * @returns {void}
 */
const _registerSharedFileSystemWatcher = (
  globPattern,
  createFileSystemWatcher,
  workspaceUri,
  onFileSystemEventHandler,
) => {
  const fileSystemChangeWatcher = createFileSystemWatcher(globPattern);
  module.exports._fileSystemWatchers[workspaceUri] = [
    fileSystemChangeWatcher.onDidChange(onFileSystemEventHandler),
    fileSystemChangeWatcher.onDidCreate(onFileSystemEventHandler),
    fileSystemChangeWatcher.onDidDelete(onFileSystemEventHandler),
  ];
};

/**
 * @param {object} args
 * @param {import('vscode').GlobPattern} args.globPattern
 * @param {import('./wrappers').createFileSystemWatcher} args.createFileSystemWatcher
 * @param {import('./wrappers').readFile} args.readFile
 * @param {import('./wrappers').writeFile} args.writeFile
 * @param {import('vscode').Uri} args.folderUri
 * @param {import('vscode').Uri} args.vscodeFileUri
 * @param {import('vscode').Uri} args.sharedFileUri
 * @param {import('vscode').Uri} args.localFileUri
 * @returns {void}
 */
const generateFileSystemWatcher = ({
  globPattern,
  createFileSystemWatcher,
  readFile,
  writeFile,
  folderUri,
  vscodeFileUri,
  sharedFileUri,
  localFileUri,
}) => {
  /** @type {{ [index: string]: { prior: number } }} */
  const cache = {};
  /**
   * @param {import('vscode').Uri} e
   * @returns {Promise<void>}
   */
  async function handleFileEvent(e) {
    const current = new Date().valueOf();
    let entry = cache[e];
    // Node.js' fs will fire two events in rapid succession on file saves.
    // Attempt to avoid running duplicative merges by checking whether
    // we've just detected and executed a merge for the modified file within
    // the last 350ms. N.B the 350ms threshold is a bit of a magic number,
    // based on observed deltas between the events typically being ~250ms but
    // occasionally coming in around ~325ms.
    if (!entry || current - entry.prior > 350) {
      await fileHandler.mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        readFile,
        writeFile,
      });
    }
    cache[e] = { prior: current };
  }
  module.exports._registerSharedFileSystemWatcher(
    globPattern,
    createFileSystemWatcher,
    folderUri,
    handleFileEvent,
  );
};

/**
 * @param {import('vscode').Uri} workspaceUri
 * @returns {void}
 */
const disposeWorkspaceWatcher = workspaceUri => {
  if (module.exports._fileSystemWatchers[workspaceUri]) {
    module.exports._fileSystemWatchers[workspaceUri].forEach(w => w.dispose());
  }
};

/** @returns {void} */
const disposeAllWatchers = () => {
  Object.values(module.exports._fileSystemWatchers).forEach(watchers => {
    watchers.forEach(w => w.dispose());
  });
};

module.exports = {
  disposeAllWatchers,
  disposeWorkspaceWatcher,
  generateFileSystemWatcher,
  // Private, only export for test stubbing
  _fileSystemWatchers,
  _registerSharedFileSystemWatcher,
};
