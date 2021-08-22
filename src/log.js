'use strict';

let _outputChannel;

const write = (msg, logLevel) => {
  const dateString = new Date().toLocaleString('sv');
  module.exports._outputChannel.appendLine(
    `[${dateString}] [${logLevel}] ${msg}`
  );
};

const debug = msg => {
  write(msg, 'DEBUG');
};

const error = msg => {
  write(msg, 'ERROR');
};

const info = msg => {
  write(msg, 'INFO');
};

const warn = msg => {
  write(msg, 'WARN');
};

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
