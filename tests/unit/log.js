'use strict';

const { assert } = require('chai');
const Sinon = require('sinon');

const log = require('../../src/log');

suite('log Suite', () => {
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
      log.initialize(name => {
        actName = name;
      });
      assert.deepEqual(actName, 'Workspace Config+');
    });

    test('Should initialize internal channel', () => {
      const channel = { name: 'foo' };
      log.initialize(() => channel);
      assert.deepEqual(log._outputChannel, channel);
    });
  });

  suite('log levels Suite', () => {
    const msg = 'bar';
    const localString = '2021-08-15 14:16:52';
    let actLogMessage;

    setup(() => {
      log._outputChannel = {
        appendLine: m => (actLogMessage = m),
      };
      Sinon.stub(clock.Date.prototype, 'toLocaleString')
        .withArgs('sv')
        .callsFake(() => localString);
    });

    teardown(() => {
      actLogMessage = undefined;
    });

    const assertLogMessage = level => {
      assert.deepEqual(`[${localString}] [${level}] ${msg}`, actLogMessage);
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
      log._outputChannel = { dispose: () => {} };
      const stub = Sinon.stub(log._outputChannel, 'dispose');
      log.dispose();
      assert.isTrue(stub.calledOnce);
    });
  });
});
