'use strict';

/**
 * @param {any} _a
 * @param {any} _b
 */
const createFileSystemWatcher = (_a, _b) => {};
/** @param {any} _c */
const createRelativePattern = _c => {};
/**
 * @param {any} _d
 * @param {any} _e
 * @param {any} _f
 */
const joinPath = (_d, _e, _f) => {};
/**
 * @param {any} _g
 * @param {any} _h
 * @param {any} _i
 * @param {any} _j
 */
const readFile = (_g, _h, _i, _j) => {};
const writeFile = () => {};
const callbacks = {
  createFileSystemWatcher,
  createRelativePattern,
  joinPath,
  readFile,
  writeFile,
};

const vscodeFileUri = { uri: 'foo/.vscode/settings.json' };
const sharedFileUri = { uri: 'foo/.vscode/settings.shared.json' };
const localFileUri = { uri: 'foo/.vscode/settings.local.json' };
const uris = {
  vscodeFileUri,
  sharedFileUri,
  localFileUri,
};
const globPattern = {
  path: 'foo/.vscode/{settings.local,settings.shared}.json',
};

module.exports = {
  callbacks,
  globPattern,
  uris,
};
