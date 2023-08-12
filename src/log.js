'use strict';

/** @type {import('vscode').OutputChannel} */
let _outputChannel;

/**
 * @param {any} msg
 * @param {string} logLevel
 * @returns {void}
 */
const write = (msg, logLevel) => {
  const dateString = new Date().toLocaleString('sv');
  module.exports._outputChannel.appendLine(
    `[${dateString}] [${logLevel}] ${msg}`,
  );
};

/**
 * @param {any} msg
 * @returns {void}
 */
const debug = msg => {
  write(msg, 'DEBUG');
};

/**
 * @param {any} msg
 * @returns {void}
 */
const error = msg => {
  write(msg, 'ERROR');
};

/**
 * @param {any} msg
 * @returns {void}
 */
const info = msg => {
  write(msg, 'INFO');
};

/**
 * @param {any} msg
 * @returns {void}
 */
const warn = msg => {
  write(msg, 'WARN');
};

/**
 * @param {(name: string) => import('vscode').OutputChannel} createChannel
 * @returns {void}
 */
const initialize = createChannel => {
  module.exports._outputChannel = createChannel('Workspace Config+');
};

const dispose = () => {
  module.exports._outputChannel.dispose();
};

module.exports = {
  debug,
  error,
  info,
  warn,
  initialize,
  dispose,
  // Private, exported for unit testing
  _outputChannel,
};
