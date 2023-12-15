'use strict';

const fileHandler = require('./file-handler');

let _privateState = {
  /** @type {{ [index: string]: import('vscode').Disposable[] }} */
  fileSystemWatchers: {},
};

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
  _privateState.fileSystemWatchers[`${workspaceUri}`] = [
    fileSystemChangeWatcher.onDidChange(onFileSystemEventHandler),
    fileSystemChangeWatcher.onDidCreate(onFileSystemEventHandler),
    fileSystemChangeWatcher.onDidDelete(onFileSystemEventHandler),
  ];
};

/**
 * @param {object} args
 * @param {import('vscode').GlobPattern} args.globPattern
 * @param {import('./wrappers').createFileSystemWatcher} args.createFileSystemWatcher
 * @param {typeof import('./wrappers').FileType} args.FileType
 * @param {import('./wrappers').stat} args.stat
 * @param {import('./wrappers').readFile} args.readFile
 * @param {import('./wrappers').writeFile} args.writeFile
 * @param {import('./wrappers').delete} args.delete
 * @param {import('./wrappers').getWorkspaceConfiguration} args.getWorkspaceConfiguration
 * @param {import('vscode').Uri} args.folderUri
 * @param {import('vscode').Uri} args.vscodeFileUri
 * @param {import('vscode').Uri} args.sharedFileUri
 * @param {import('vscode').Uri} args.localFileUri
 * @returns {void}
 */
const generateFileSystemWatcher = ({
  globPattern,
  createFileSystemWatcher,
  FileType,
  stat,
  readFile,
  writeFile,
  delete: delete_,
  getWorkspaceConfiguration,
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
    let entry = cache[`${e}`];
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
        FileType,
        stat,
        readFile,
        writeFile,
        delete: delete_,
        getWorkspaceConfiguration,
      });
    }
    cache[`${e}`] = { prior: current };
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
  if (_privateState.fileSystemWatchers[`${workspaceUri}`]) {
    for (const w of _privateState.fileSystemWatchers[`${workspaceUri}`])
      w.dispose();
  }
};

/** @returns {void} */
const disposeAllWatchers = () => {
  for (const watchers of Object.values(_privateState.fileSystemWatchers)) {
    for (const w of watchers) {
      w.dispose();
    }
  }
};

module.exports = {
  disposeAllWatchers,
  disposeWorkspaceWatcher,
  generateFileSystemWatcher,
  // Private, only export for test stubbing
  _privateState,
  _registerSharedFileSystemWatcher,
};
