'use strict';

const createFileSystemWatcher = (_a, _b) => {};
const createRelativePattern = (_c) => {};
const joinPath = (_d, _e, _f) => {};
const readFile = (_g, _h, _i, _j) => {};
const writeFile = () => {};
const callbacks = {
  createFileSystemWatcher,
  createRelativePattern,
  joinPath,
  readFile,
  writeFile
};

const vscodeFileUri = { uri: 'foo/.vscode/settings.json' };
const sharedFileUri = { uri: 'foo/.vscode/settings.shared.json' };
const localFileUri = { uri: 'foo/.vscode/settings.local.json' };
const uris = {
  vscodeFileUri,
  sharedFileUri,
  localFileUri
};
const globPattern = { path: 'foo/.vscode/{settings.local,settings.shared}.json' };

module.exports = {
  callbacks,
  globPattern,
  uris
};
