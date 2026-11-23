const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function parseVersion(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) return null;
  const parts = value.split('.').map(Number);
  return parts.every(part => part <= 65535) ? parts : null;
}

function compareVersions(left, right) {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

function packagedVersions(root) {
  const dist = path.join(root, 'dist');
  let entries;
  try {
    entries = fs.readdirSync(dist, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const versions = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const numberedFolder = parseVersion(entry.name.replace(/^web-/, ''));
    if (numberedFolder) {
      versions.push(numberedFolder);
      continue;
    }
    const manifest = entry.name.startsWith('web-')
      ? path.join(dist, entry.name, 'web-build.json')
      : path.join(dist, entry.name, 'Wildbound-win32-x64', 'wildbound-build.json');
    try {
      const version = parseVersion(JSON.parse(fs.readFileSync(manifest, 'utf8'))?.version);
      if (version) versions.push(version);
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
  }
  return versions;
}

function reserveBuildVersion(root, sourceVersion) {
  const minimum = parseVersion(sourceVersion);
  if (!minimum) throw Error(`Invalid Wildbound source version: ${sourceVersion}`);
  const gitDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: root, encoding: 'utf8',
  }).trim();
  const reservations = path.join(gitDir, 'wildbound-build-versions');
  fs.mkdirSync(reservations, { recursive: true });
  const packaged = packagedVersions(root);
  for (;;) {
    // Keep the sequence shared across linked worktrees and independent of dist cleanup.
    const versions = [...packaged, ...fs.readdirSync(reservations).map(parseVersion).filter(Boolean)];
    const latest = versions.reduce((highest, version) =>
      !highest || compareVersions(version, highest) > 0 ? version : highest, null);
    let next = minimum;
    if (latest && compareVersions(latest, minimum) >= 0) {
      const [major, minor, patch] = latest;
      if (patch === 65535) throw Error('The Windows desktop build patch number is exhausted. Advance the source major or minor version.');
      next = [major, minor, patch + 1];
    }
    const version = next.join('.');
    try {
      // Atomic across processes. Keep the reservation even if packaging is interrupted.
      fs.mkdirSync(path.join(reservations, version));
      return version;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
}

module.exports = { reserveBuildVersion };
