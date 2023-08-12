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
  FileType,
  joinPath,
  stat,
  readFile,
  writeFile,
  delete: delete_,
  getWorkspaceConfiguration,
} = require('./wrappers');

const activate = () => {
  if (!workspace.workspaceFolders) {
    return;
  }
  initializeLog(name => window.createOutputChannel(name));
  for (const f of workspace.workspaceFolders) {
    initializeWorkspaceFolder({
      folderUri: f.uri,
      createFileSystemWatcher,
      createRelativePattern,
      FileType,
      joinPath,
      stat,
      readFile,
      writeFile,
      delete: delete_,
      getWorkspaceConfiguration,
    });
  }
  workspace.onDidChangeWorkspaceFolders(({ added, removed }) =>
    handleWorkspaceFolderUpdates({
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
    }),
  );
};

module.exports = {
  activate,
  deactivate,
};
