'use strict';

const createFileSystemWatcher =
  /** @type {import('../src/wrappers').createFileSystemWatcher} */ (
    /** @type {unknown} */ (() => undefined)
  );
const createRelativePattern =
  /** @type {import('../src/wrappers').createRelativePattern} */ (
    /** @type {unknown} */ (() => undefined)
  );
const joinPath = /** @type {import('../src/wrappers').joinPath} */ (
  /** @type {unknown} */ (() => undefined)
);
const readFile = /** @type {import('../src/wrappers').readFile} */ (
  /** @type {unknown} */ (() => undefined)
);
const writeFile = /** @type {import('../src/wrappers').writeFile} */ (
  /** @type {unknown} */ (() => undefined)
);
const callbacks = {
  createFileSystemWatcher,
  createRelativePattern,
  joinPath,
  readFile,
  writeFile,
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
