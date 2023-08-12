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
 * @param {import('./wrappers').joinPath} args.joinPath
 * @param {import('./wrappers').readFile} args.readFile
 * @param {import('./wrappers').writeFile} args.writeFile
 * @returns {void}
 */
const initializeWorkspaceFolder = ({
  folderUri,
  createFileSystemWatcher,
  createRelativePattern,
  joinPath,
  readFile,
  writeFile,
}) => {
  workspaceConfigFileNames.forEach(configFile => {
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
      readFile,
      writeFile,
      folderUri,
      vscodeFileUri,
      sharedFileUri,
      localFileUri,
    });
    fileHandler.mergeConfigFiles({
      vscodeFileUri,
      sharedFileUri,
      localFileUri,
      readFile,
      writeFile,
    });
  });
};
/**
 * @param {object} args
 * @param {readonly import('vscode').WorkspaceFolder[]} args.added
 * @param {readonly import('vscode').WorkspaceFolder[]} args.removed
 * @param {import('./wrappers').createFileSystemWatcher} args.createFileSystemWatcher
 * @param {import('./wrappers').createRelativePattern} args.createRelativePattern
 * @param {import('./wrappers').joinPath} args.joinPath
 * @param {import('./wrappers').readFile} args.readFile
 * @param {import('./wrappers').writeFile} args.writeFile
 * @returns {void}
 */
const handleWorkspaceFolderUpdates = ({
  added,
  removed,
  createFileSystemWatcher,
  createRelativePattern,
  joinPath,
  readFile,
  writeFile,
}) => {
  if (added && Array.isArray(added)) {
    for (const f of /** @type {WorkspaceFolder[]} */ (added)) {
      module.exports.initializeWorkspaceFolder({
        folderUri: f.uri,
        createFileSystemWatcher,
        createRelativePattern,
        joinPath,
        readFile,
        writeFile,
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
