'use strict';

const { RelativePattern, Uri, workspace, window } = require('vscode');
const {
  deactivate,
  handleWorkspaceFolderUpdates,
  initializeLog,
  initializeWorkspaceFolder
} = require('./lib');

// The VS Code module is only readily available within a VS Code context
// which makes true unit testing impossible for any modules which need
// to directly interact with the VS Code Extension APIs.
// Accordingly, these lightweight functions are created as wrappers around
// their respective VS Code API calls so that the core logic of this extension
// can be tested with unit and component tests, in addition to the integration tests.
const createFileSystemWatcher = pattern => workspace.createFileSystemWatcher(pattern);
const createRelativePattern = (base, pattern) => new RelativePattern(base, pattern)
const joinPath = (base, pattern) => Uri.joinPath(base, pattern);
const readFile = fileUri => workspace.fs.readFile(fileUri).then(c => c).catch(_ => {});
const writeFile = (fileUri, contents, options) => workspace.fs.writeFile(fileUri, contents, options);

const activate = () => {
  if (!workspace.workspaceFolders) {
    return;
  }
  initializeLog((name) => window.createOutputChannel(name));
  workspace.workspaceFolders.forEach(f => initializeWorkspaceFolder({
    folderUri: f.uri,
    createFileSystemWatcher,
    createRelativePattern,
    joinPath,
    readFile,
    writeFile
  }));
  workspace.onDidChangeWorkspaceFolders(({ added, removed }) => handleWorkspaceFolderUpdates({
    added,
    removed,
    createFileSystemWatcher,
    createRelativePattern,
    joinPath,
    readFile,
    writeFile
  }));
}

module.exports = {
  activate,
  deactivate
}
