'use strict';

const { workspace, window } = require('vscode');
const {
  deactivate,
  handleWorkspaceFolderUpdates,
  initializeLog,
  initializeWorkspaceFolder,
} = require('./lib');
const {
  createFileSystemWatcher,
  createRelativePattern,
  joinPath,
  readFile,
  writeFile,
} = require('./wrappers');

const activate = () => {
  if (!workspace.workspaceFolders) {
    return;
  }
  initializeLog(name => window.createOutputChannel(name));
  workspace.workspaceFolders.forEach(f =>
    initializeWorkspaceFolder({
      folderUri: f.uri,
      createFileSystemWatcher,
      createRelativePattern,
      joinPath,
      readFile,
      writeFile,
    }),
  );
  workspace.onDidChangeWorkspaceFolders(({ added, removed }) =>
    handleWorkspaceFolderUpdates({
      added,
      removed,
      createFileSystemWatcher,
      createRelativePattern,
      joinPath,
      readFile,
      writeFile,
    }),
  );
};

module.exports = {
  activate,
  deactivate,
};
