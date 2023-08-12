'use strict';

const { assert } = require('chai');
const Sinon = require('sinon');

const log = require('../../src/log');

/**
 * @param {string} name
 * @returns {import('vscode').OutputChannel}
 */
const unimplementedOutputChannel = name => ({
  append: () => {
    throw new Error('unimplemented');
  },
  appendLine: () => {
    throw new Error('unimplemented');
  },
  clear: () => {
    throw new Error('unimplemented');
  },
  dispose: () => {
    throw new Error('unimplemented');
  },
  hide: () => {
    throw new Error('unimplemented');
  },
  name,
  replace: () => {
    throw new Error('unimplemented');
  },
  show: () => {
    throw new Error('unimplemented');
  },
});

suite('log Suite', () => {
  /** @type {Sinon.SinonFakeTimers} */
  let clock;

  setup(() => {
    clock = Sinon.useFakeTimers();
  });

  teardown(() => {
    clock.restore();
    Sinon.restore();
  });

  suite('initialize Suite', () => {
    test('Should create output channel with correct title', () => {
      let actName = '';
      const outputChannel = unimplementedOutputChannel('foo');
      log.initialize(name => {
        actName = name;
        return outputChannel;
      });
      assert.deepStrictEqual(actName, 'Workspace Config+');
    });

    test('Should initialize internal channel', () => {
      const outputChannel = unimplementedOutputChannel('foo');
      log.initialize(() => outputChannel);
      assert.deepStrictEqual(log._privateState.outputChannel, outputChannel);
    });
  });

  suite('log levels Suite', () => {
    const msg = 'bar';
    const localString = '2021-08-15 14:16:52';
    /** @type {string | undefined} */
    let actLogMessage;

    setup(() => {
      const outputChannel = unimplementedOutputChannel('foo');
      outputChannel.appendLine = m => (actLogMessage = m);
      log._privateState.outputChannel = outputChannel;
      Sinon.stub(clock.Date.prototype, 'toLocaleString')
        .withArgs('sv')
        .callsFake(() => localString);
    });

    teardown(() => {
      actLogMessage = undefined;
    });

    /** @param {string} level */
    const assertLogMessage = level => {
      assert.deepStrictEqual(`[${localString}] [${level}] ${msg}`, actLogMessage);
    };

    test('Warn should set correct log level', () => {
      log.warn(msg);
      assertLogMessage('WARN');
    });

    test('Info should set correct log level', () => {
      log.info(msg);
      assertLogMessage('INFO');
    });

    test('Error should set correct log level', () => {
      log.error(msg);
      assertLogMessage('ERROR');
    });

    test('Info should set correct log level', () => {
      log.debug(msg);
      assertLogMessage('DEBUG');
    });
  });

  suite('dispose Suite', () => {
    test('Should dispose the output channel', () => {
      const outputChannel = /** @type {import('vscode').OutputChannel} */ ({
        dispose: () => {},
      });
      log._privateState.outputChannel = outputChannel;
      const stub = Sinon.stub(outputChannel, 'dispose');
      log.dispose();
      assert.deepStrictEqual(stub.callCount, 1);
    });
  });
});
