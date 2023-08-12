'use strict';

const { isDeepStrictEqual } = require('util');
const jsoncParser = require('jsonc-parser');
const deepMerge = require('deepmerge');
const log = require('./log');

const _arrayMergeKey = 'workspaceConfigPlus.arrayMerge';
const _arrayMergeDefaultValue = 'combine';

/**
 * @param {import('vscode').Uri} fileUri
 * @param {import('./wrappers').readFile} readFile
 * @returns {Promise<any | undefined>}
 */
const _loadConfigFromFile = async (fileUri, readFile) => {
  const contents = await readFile(fileUri);
  if (!contents) {
    return undefined;
  }
  /** @type {jsoncParser.ParseError[]} */
  const errors = [];
  const config = jsoncParser.parse(contents.toString(), errors, {
    allowTrailingComma: true,
  });
  if (errors.length > 0) {
    throw new Error(`Failed to parse contents of: ${fileUri.fsPath}`);
  }
  return config;
};

/**
 * @template {{ [_arrayMergeKey]: string }} T
 * @param {object} args
 * @param {Partial<T>} args.sharedConfig
 * @param {Partial<T>} args.localConfig
 * @returns {T | undefined}
 */
const getMergedConfigs = ({ sharedConfig, localConfig }) => {
  const shared = sharedConfig || {};
  const local = localConfig || {};
  let arrayMerge =
    local[_arrayMergeKey] || shared[_arrayMergeKey] || _arrayMergeDefaultValue;
  const invalidValueErrorMessage = `Invalid value for 'arrayMerge' setting: '${arrayMerge}'. Must be 'overwrite' or 'combine'`;
  if (typeof arrayMerge != 'string') {
    throw new Error(invalidValueErrorMessage);
  }

  arrayMerge = arrayMerge.toLowerCase();
  /** @type deepMerge.Options */
  let options = {};
  if (arrayMerge == 'overwrite') {
    options.arrayMerge = (_dest, source, _options) => source;
  } else if (arrayMerge !== 'combine') {
    throw new Error(invalidValueErrorMessage);
  }
  return deepMerge(shared, local, options);
};

/**
 * @param {object} args
 * @param {import('vscode').Uri} args.vscodeFileUri
 * @param {import('vscode').Uri} args.sharedFileUri
 * @param {import('vscode').Uri} args.localFileUri
 * @param {import('./wrappers').readFile} args.readFile
 * @param {import('./wrappers').writeFile} args.writeFile
 * @returns {Promise<void>}
 */
// This function does exceed our preferred ceiling for statement counts
// but worth an override here for readability. However, we should split
// this up if we end up needing to add anything else to it.
// eslint-disable-next-line max-statements
const mergeConfigFiles = async ({
  vscodeFileUri,
  sharedFileUri,
  localFileUri,
  readFile,
  writeFile,
}) => {
  const loadConfigFromFile = module.exports._loadConfigFromFile;
  try {
    const sharedConfig = await loadConfigFromFile(sharedFileUri, readFile);
    const localConfig = await loadConfigFromFile(localFileUri, readFile);

    // If neither of these files exists then there's no work to be done
    if (!sharedConfig && !localConfig) {
      return;
    }

    const vscodeFileContents = await loadConfigFromFile(
      vscodeFileUri,
      readFile,
    );
    const merged = getMergedConfigs({ sharedConfig, localConfig });

    // Avoid rewriting the file if there are no changes to be applied
    if (isDeepStrictEqual(vscodeFileContents, merged)) {
      return;
    }

    log.info(`Updating config in ${vscodeFileUri.fsPath}`);
    await writeFile(
      vscodeFileUri,
      Buffer.from(
        JSON.stringify({ ...vscodeFileContents, ...merged }, null, 2),
      ),
      { create: true, overwrite: true },
    );
  } catch (e) {
    log.error(e.message);
    log.debug(e);
  }
};

module.exports = {
  mergeConfigFiles,
  // Private, only exported for test mocking
  _loadConfigFromFile,
  _arrayMergeKey,
  _arrayMergeDefaultValue,
};
