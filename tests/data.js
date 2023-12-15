'use strict';

const createFileSystemWatcher =
  /** @type {import('../src/wrappers').createFileSystemWatcher} */ (
    /** @type {unknown} */ (() => undefined)
  );
const createRelativePattern =
  /** @type {import('../src/wrappers').createRelativePattern} */ (
    /** @type {unknown} */ (() => undefined)
  );
/**
 * @enum {import('../src/wrappers').FileType}
 */
const FileType = {
  /**
   * The file type is unknown.
   */
  Unknown: 0,
  /**
   * A regular file.
   */
  File: 1,
  /**
   * A directory.
   */
  Directory: 2,
  /**
   * A symbolic link to a file.
   */
  SymbolicLink: 64,
};
const joinPath = /** @type {import('../src/wrappers').joinPath} */ (
  /** @type {unknown} */ (() => undefined)
);
const stat = /** @type {import('../src/wrappers').stat} */ (
  /** @type {unknown} */ (() => undefined)
);
const readFile = /** @type {import('../src/wrappers').readFile} */ (
  /** @type {unknown} */ (() => undefined)
);
const writeFile = /** @type {import('../src/wrappers').writeFile} */ (
  /** @type {unknown} */ (() => undefined)
);
const delete_ = /** @type {import('../src/wrappers').delete} */ (
  /** @type {unknown} */ (() => undefined)
);
const getWorkspaceConfiguration = /** @type {import('../src/wrappers').getWorkspaceConfiguration} */ (
  /** @type {unknown} */ (() => undefined)
);
const callbacks = {
  createFileSystemWatcher,
  createRelativePattern,
  FileType,
  stat,
  joinPath,
  readFile,
  writeFile,
  delete: delete_,
  getWorkspaceConfiguration,
};

const vscodeFileUri =
  /** @type {import('vscode').Uri} */ (
    /** @type {unknown} */ ({ uri: 'foo/.vscode/settings.json' })
  );
const sharedFileUri =
  /** @type {import('vscode').Uri} */ (
    /** @type {unknown} */ ({ uri: 'foo/.vscode/settings.shared.json' })
  );
const localFileUri =
  /** @type {import('vscode').Uri} */ (
    /** @type {unknown} */ ({ uri: 'foo/.vscode/settings.local.json' })
  );
const uris = {
  vscodeFileUri,
  sharedFileUri,
  localFileUri,
};
const globPattern = /** @type {import('vscode').GlobPattern} */ (
  'foo/.vscode/{settings.local,settings.shared}.json'
);

module.exports = {
  callbacks,
  globPattern,
  uris,
};
