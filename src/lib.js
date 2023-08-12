'use strict';

const fileHandler = require('./file-handler');
const watcher = require('./watcher');
const log = require('./log');

const workspaceConfigFileNames = ['launch', 'settings', 'tasks'];

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
    added.forEach(f =>
      module.exports.initializeWorkspaceFolder({
        folderUri: f.uri,
        createFileSystemWatcher,
        createRelativePattern,
        joinPath,
        readFile,
        writeFile,
      }),
    );
  }
  if (removed && Array.isArray(removed)) {
    removed.forEach(f => watcher.disposeWorkspaceWatcher(f.uri));
  }
};

const initializeLog = createOutputChannel => {
  log.initialize(createOutputChannel);
};

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
