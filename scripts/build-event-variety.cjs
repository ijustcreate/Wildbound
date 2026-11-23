// Keep each Varied Events package as a separate desktop snapshot.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { reserveBuildVersion } = require('./build-version.cjs');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw Error(`Supply a path after ${name}.`);
  return value;
}

function hash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function collectSourceFiles(dir, recursive, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (recursive && entry.isDirectory()) collectSourceFiles(file, true, files);
    if (entry.isFile() && /\.(mjs|cjs|js|css|html)$/.test(entry.name)) {
      files[path.relative(root, file).replaceAll('\\', '/')] = hash(fs.readFileSync(file));
    }
  }
}

async function build() {
  const recovery = argument('--verify-only');
  const zipDir = argument('--electron-zip-dir');
  const sourceVersion = require('../package.json').version;
  const sourceFiles = {};
  collectSourceFiles(root, false, sourceFiles);
  collectSourceFiles(path.join(root, 'src'), true, sourceFiles);

  let packageDir;
  let version;
  if (recovery) {
    // Finish verification for an already-created legacy artifact using its original app version.
    packageDir = path.resolve(recovery);
    const relative = path.relative(dist, packageDir);
    if (!/^event-variety-[^\\/]+[\\/]Wildbound-win32-x64$/.test(relative) ||
        fs.existsSync(path.join(packageDir, 'wildbound-build.json'))) {
      throw Error('Verification recovery requires an incomplete legacy event-variety snapshot.');
    }
  } else {
    if (!zipDir || !fs.existsSync(path.join(zipDir, 'electron-v41.10.7-win32-x64.zip'))) {
      throw Error('Supply --electron-zip-dir with the existing Electron 41.10.7 ZIP directory.');
    }
    require('./check-syntax.cjs').checkSyntax(root);
    version = reserveBuildVersion(root, sourceVersion);
    const out = path.join(dist, version);
    if (fs.existsSync(out)) throw Error(`Refusing to overwrite ${out}`);
    [packageDir] = await require('@electron/packager').packager({
      dir: root, out, name: 'Wildbound', appVersion: version,
      platform: 'win32', arch: 'x64', overwrite: false,
      asar: true, prune: true, icon: path.join(root, 'assets', 'wildbound-icon.ico'),
      electronVersion: '41.10.7', electronZipDir: path.resolve(zipDir),
      ignore: [/^\/Progress pictures/, /^\/design/, /^\/scripts/, /^\/\.tools/, /^\/test-output/,
        /^\/art\/player\/detail-native-v[234]/, /^\/tests/, /^\/dist/, /^\/\.git/, /^\/Concept Art Pixel/],
    });
    if (!packageDir) throw Error(`No Varied Events package was produced in ${out}`);
  }

  const executable = path.join(packageDir, 'Wildbound.exe');
  if (!fs.statSync(executable, { throwIfNoEntry: false })?.isFile()) {
    throw Error(`Missing executable: ${executable}`);
  }
  const asar = require('@electron/asar');
  const archive = path.join(packageDir, 'resources', 'app.asar');
  const runtimeVersion = JSON.parse(asar.extractFile(archive, 'package.json')).version;
  if (!/^\d+\.\d+\.\d+$/.test(runtimeVersion) || (version && runtimeVersion !== version)) {
    throw Error(`Unexpected packaged app version: ${runtimeVersion}`);
  }
  for (const [file, sourceHash] of Object.entries(sourceFiles)) {
    const shipped = asar.extractFile(archive, file.split('/').join(path.sep));
    if (hash(shipped) !== sourceHash) throw Error(`Packaged source differs: ${file}`);
  }

  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const manifest = {
    version: runtimeVersion,
    sourceVersion: recovery ? runtimeVersion : sourceVersion,
    variant: 'Varied Events Test',
    sourceCommit: git('rev-parse', 'HEAD'),
    sourceDirty: Boolean(git('status', '--porcelain', '--untracked-files=no')),
    builtAt: new Date().toISOString(),
    preview: false,
    eventDirectorVersion: 2,
    wingHover: true,
    sourceFiles,
  };
  const manifestPath = path.join(packageDir, 'wildbound-build.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  if (recovery) {
    const receipt = path.join(root, 'test-output', 'event-variety-build.json');
    fs.mkdirSync(path.dirname(receipt), { recursive: true });
    const temporaryReceipt = `${receipt}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(temporaryReceipt, JSON.stringify({ executable, packageDir, manifest: manifestPath }, null, 2) + '\n');
    fs.renameSync(temporaryReceipt, receipt);
  }

  const launcher = path.join(root, 'Play Wildbound Varied Events.cmd');
  console.log(JSON.stringify({
    version: manifest.version,
    packageDir,
    executable,
    launcher,
    sourceCommit: manifest.sourceCommit,
    verifiedSourceFiles: Object.keys(sourceFiles).length,
  }, null, 2));
}

build().catch(error => {
  console.error(error.stack);
  process.exitCode = 1;
});
