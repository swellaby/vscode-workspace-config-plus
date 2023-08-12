'use strict';

const fileHandler = require('./file-handler');
const watcher = require('./watcher');
const log = require('./log');

const workspaceConfigFileNames = ['launch', 'settings', 'tasks'];

/**
 * @param {object} args
 * @param {import('vscode').Uri} args.folderUri
 * @param {import('./wrappers').createFileSystemWatcher} args.createFileSystemWatcher
 * @param {import('./wrappers').createRelativePattern} args.createRelativePattern
 * @param {typeof import('./wrappers').FileType} args.FileType
 * @param {import('./wrappers').joinPath} args.joinPath
 * @param {import('./wrappers').stat} args.stat
 * @param {import('./wrappers').readFile} args.readFile
 * @param {import('./wrappers').writeFile} args.writeFile
 * @param {import('./wrappers').delete} args.delete
 * @param {import('./wrappers').getWorkspaceConfiguration} args.getWorkspaceConfiguration
 * @returns {void}
 */
const initializeWorkspaceFolder = ({
  folderUri,
  createFileSystemWatcher,
  createRelativePattern,
  joinPath,
  FileType,
  stat,
  readFile,
  writeFile,
  delete: delete_,
  getWorkspaceConfiguration,
}) => {
  for (const configFile of workspaceConfigFileNames) {
    const workspaceVscodeDirUri = joinPath(folderUri, '.vscode');
    const sharedFile = `${configFile}.shared`;
    const localFile = `${configFile}.local`;
    const globPattern = createRelativePattern(
      workspaceVscodeDirUri,
      `{${localFile},${sharedFile}}.json`,
    );
    const vscodeFileUri = joinPath(workspaceVscodeDirUri, `${configFile}.json`);
    const sharedFileUri = joinPath(workspaceVscodeDirUri, `${sharedFile}.json`);
    const localFileUri = joinPath(workspaceVscodeDirUri, `${localFile}.json`);
    watcher.generateFileSystemWatcher({
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
    });
    fileHandler.mergeConfigFiles({
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
};
/**
 * @typedef {{ readonly uri: import('vscode').Uri }} WorkspaceFolder
 * @param {object} args
 * @param {readonly WorkspaceFolder[] | number | string} [args.added]
 * @param {readonly WorkspaceFolder[] | number | string} [args.removed]
 * @param {import('./wrappers').createFileSystemWatcher} args.createFileSystemWatcher
 * @param {import('./wrappers').createRelativePattern} args.createRelativePattern
 * @param {typeof import('./wrappers').FileType} args.FileType
 * @param {import('./wrappers').joinPath} args.joinPath
 * @param {import('./wrappers').stat} args.stat
 * @param {import('./wrappers').readFile} args.readFile
 * @param {import('./wrappers').writeFile} args.writeFile
 * @param {import('./wrappers').delete} args.delete
 * @param {import('./wrappers').getWorkspaceConfiguration} args.getWorkspaceConfiguration
 * @returns {void}
 */
const handleWorkspaceFolderUpdates = ({
  added,
  removed,
  createFileSystemWatcher,
  createRelativePattern,
  FileType,
  joinPath,
  stat,
  readFile,
  writeFile,
  delete: delete_,
  getWorkspaceConfiguration,
}) => {
  if (added && Array.isArray(added)) {
    for (const f of /** @type {WorkspaceFolder[]} */ (added)) {
      module.exports.initializeWorkspaceFolder({
        folderUri: f.uri,
        createFileSystemWatcher,
        createRelativePattern,
        joinPath,
        FileType,
        stat,
        readFile,
        writeFile,
        delete: delete_,
        getWorkspaceConfiguration,
      });
    }
  }
  if (removed && Array.isArray(removed)) {
    for (const f of /** @type {WorkspaceFolder[]} */ (removed)) {
      watcher.disposeWorkspaceWatcher(f.uri);
    }
  }
};

/**
 * @param {(name: string) => import('vscode').OutputChannel} createOutputChannel
 * @returns {void}
 */
const initializeLog = createOutputChannel => {
  log.initialize(createOutputChannel);
};

/** @returns {void} */
const deactivate = () => {
  log.info('Deactivating and disposing all watchers');
  watcher.disposeAllWatchers();
  log.dispose();
};

module.exports = {
  deactivate,
  handleWorkspaceFolderUpdates,
  initializeLog,
  initializeWorkspaceFolder,
};
