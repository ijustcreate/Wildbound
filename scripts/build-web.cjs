const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {checkSyntax} = require('./check-syntax.cjs');
const { reserveBuildVersion } = require('./build-version.cjs');
const root = path.resolve(__dirname, '..');
// Publish only game files. Never include desktop saves, credentials, or tooling.
checkSyntax(root);
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const sourceVersion = require('../package.json').version;
const sourceCommit = git('rev-parse', 'HEAD');
const sourceDirty = Boolean(git('status', '--porcelain'));
const version = reserveBuildVersion(root, sourceVersion);
const output = path.join(root, 'dist', 'web-' + version);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.mkdirSync(output);
for (const file of ['index.html', 'app.mjs']) fs.copyFileSync(path.join(root, file), path.join(output, file));
const webIndex = path.join(output, 'index.html');
const html = fs.readFileSync(webIndex, 'utf8')
  .replace('<head>', '<head>\n    <script src="src/web-storage.js"></script>')
  .replace('<title>Wildbound — The Living Board</title>', `<title>Wildbound — The Living Board · v${version}</title>`);
fs.writeFileSync(webIndex, html);
for (const folder of ['src', 'assets', 'worlds']) fs.cpSync(path.join(root, folder), path.join(output, folder), {recursive: true});
fs.mkdirSync(path.join(output, 'authored'));
if (fs.existsSync(path.join(root, 'authored', 'rigs.json'))) fs.copyFileSync(path.join(root, 'authored', 'rigs.json'), path.join(output, 'authored', 'rigs.json'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
if (git('rev-parse', 'HEAD') !== sourceCommit) throw Error('The checkout commit changed during packaging. Rebuild from the intended revision.');
const manifest = {
  version,
  sourceVersion,
  sourceCommit,
  sourceDirty: sourceDirty || Boolean(git('status', '--porcelain')),
  builtAt: new Date().toISOString(),
  path: process.argv.includes('--versioned') ? `releases/${version}/` : null,
};
fs.writeFileSync(path.join(output, 'web-build.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(output);
