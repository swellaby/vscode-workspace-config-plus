'use strict';

const { RelativePattern, Uri, workspace } = require('vscode');

/**
 * Wrappers of VS Code Extension API functions.
 *
 * The VS Code module is only readily available within a VS Code context which
 * makes true unit testing impossible for any modules which need to directly
 * interact with the VS Code Extension APIs. Accordingly, these lightweight
 * functions are created as wrappers around their respective VS Code API calls
 * so that the core logic of this extension can be tested with unit and
 * component tests, in addition to the integration tests.
 *
 * @module
 */

/**
 * @param {import('vscode').GlobPattern} pattern
 * @returns {import('vscode').FileSystemWatcher}
 */
const createFileSystemWatcher = pattern =>
  workspace.createFileSystemWatcher(pattern);
/**
 * @param {string | import('vscode').WorkspaceFolder | Uri} base
 * @param {string} pattern
 * @returns {import('vscode').RelativePattern}
 */
const createRelativePattern = (base, pattern) =>
  new RelativePattern(base, pattern);
/**
 * @param {Uri} base
 * @param {string} pattern
 * @returns {Uri}
 */
const joinPath = (base, pattern) => Uri.joinPath(base, pattern);
/**
 * @param {Uri} fileUri
 * @returns {Thenable<Uint8Array>}
 */
const readFile = fileUri =>
  workspace.fs
    .readFile(fileUri)
    .then(c => c)
    .catch(/** @param {never} _ */ _ => {});
/**
 * @typedef {{
 *   readonly create?: boolean;
 *   readonly overwrite?: boolean;
 * }} writeFile.Options
 *
 * @param {Uri} fileUri
 * @param {Uint8Array} contents
 * @param {writeFile.Options} [options]
 * @returns {Thenable<void>}
 */
const writeFile = (fileUri, contents, options) =>
  workspace.fs.writeFile(fileUri, contents, options);

module.exports = {
  createFileSystemWatcher,
  createRelativePattern,
  joinPath,
  readFile,
  writeFile,
};
