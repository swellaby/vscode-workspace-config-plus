'use strict';

const fileHandler = require('./file-handler');

const _fileSystemWatchers = {};

const _registerSharedFileSystemWatcher = (
  globPattern,
  createFileSystemWatcher,
  workspaceUri,
  onFileSystemEventHandler
) => {
  const fileSystemChangeWatcher = createFileSystemWatcher(globPattern);
  module.exports._fileSystemWatchers[workspaceUri] = [
    fileSystemChangeWatcher.onDidChange(onFileSystemEventHandler),
    fileSystemChangeWatcher.onDidCreate(onFileSystemEventHandler),
    fileSystemChangeWatcher.onDidDelete(onFileSystemEventHandler),
  ];
};

const generateFileSystemWatcher = ({
  globPattern,
  createFileSystemWatcher,
  readFile,
  writeFile,
  folderUri,
  vscodeFileUri,
  sharedFileUri,
  localFileUri,
}) => {
  const cache = {};
  async function handleFileEvent(e) {
    const current = new Date().valueOf();
    let entry = cache[e];
    // Node.js' fs will fire two events in rapid succession on file saves.
    // Attempt to avoid running duplicative merges by checking whether
    // we've just detected and executed a merge for the modified file within
    // the last 350ms. N.B the 350ms threshold is a bit of a magic number,
    // based on observed deltas between the events typically being ~250ms but
    // occasionally coming in around ~325ms.
    if (!entry || current - entry.prior > 350) {
      await fileHandler.mergeConfigFiles({
        vscodeFileUri,
        sharedFileUri,
        localFileUri,
        readFile,
        writeFile,
      });
    }
    cache[e] = { prior: current };
  }
  module.exports._registerSharedFileSystemWatcher(
    globPattern,
    createFileSystemWatcher,
    folderUri,
    handleFileEvent
  );
};

const disposeWorkspaceWatcher = workspaceUri => {
  if (module.exports._fileSystemWatchers[workspaceUri]) {
    module.exports._fileSystemWatchers[workspaceUri].forEach(w => w.dispose());
  }
};

const disposeAllWatchers = () => {
  Object.values(module.exports._fileSystemWatchers).forEach(watchers => {
    watchers.forEach(w => w.dispose());
  });
};

module.exports = {
  disposeAllWatchers,
  disposeWorkspaceWatcher,
  generateFileSystemWatcher,
  // Private, only export for test stubbing
  _fileSystemWatchers,
  _registerSharedFileSystemWatcher,
};
