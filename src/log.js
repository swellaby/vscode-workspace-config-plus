'use strict';

let _privateState = {
  /** @type {import('vscode').OutputChannel | undefined} */
  outputChannel: undefined,
};

/**
 * @param {any} msg
 * @param {string} logLevel
 * @returns {void}
 */
const write = (msg, logLevel) => {
  const dateString = new Date().toLocaleString('sv');
  const { outputChannel } = _privateState;
  if (outputChannel === undefined) throw new Error('log is uninitialized');
  outputChannel.appendLine(`[${dateString}] [${logLevel}] ${msg}`);
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
  _privateState.outputChannel = createChannel('Workspace Config+');
};

const dispose = () => {
  const { outputChannel } = _privateState;
  if (outputChannel !== undefined) {
    outputChannel.dispose();
  }
};

module.exports = {
  debug,
  error,
  info,
  warn,
  initialize,
  dispose,
  // Exported for unit testing
  _privateState,
};
