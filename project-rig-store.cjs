const fs = require('node:fs');
const path = require('node:path');

function findProject(start) {
  for (let dir = path.resolve(start); ; dir = path.dirname(dir)) {
    try {
      if (fs.existsSync(path.join(dir, '.git')) &&
          JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name === 'wildbound') return dir;
    } catch {}
    if (dir === path.dirname(dir)) return null;
  }
}

function createRigStore({ appPath, exePath, userData, packaged, testMode, isolated = false }) {
  const project = testMode || isolated ? null : findProject(packaged ? path.dirname(exePath) : appPath);
  const file = path.join(project || userData, 'authored', 'rigs.json');
  const bundled = path.join(appPath, 'authored', 'rigs.json');
  let queue = Promise.resolve();
  return {
    file,
    load() {
      for (const candidate of [...new Set([file, ...(testMode ? [] : [bundled])])]) {
        try { return JSON.parse(fs.readFileSync(candidate, 'utf8')); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      return null;
    },
    save(data) {
      if (data?.version !== 1) return Promise.reject(Error('Invalid rig file version.'));
      const body = JSON.stringify(data, null, 2) + '\n';
      if (Buffer.byteLength(body) > 20_000_000) return Promise.reject(Error('Rig file exceeds 20 MB.'));
      const task = queue.catch(() => {}).then(async () => {
        await fs.promises.mkdir(path.dirname(file), { recursive: true });
        await fs.promises.writeFile(file + '.tmp', body);
        try { await fs.promises.copyFile(file, file + '.bak'); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        await fs.promises.rename(file + '.tmp', file);
        return project ? 'Saved to game and project.' : 'Saved on this computer.';
      });
      queue = task;
      return task;
    },
    flush: () => queue,
  };
}

module.exports = { findProject, createRigStore };
