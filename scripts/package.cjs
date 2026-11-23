const { packager } = require("@electron/packager");
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { reserveBuildVersion } = require('./build-version.cjs');
const root = path.resolve(__dirname, '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

async function buildDesktop() {
  require('./check-syntax.cjs').checkSyntax(root);
  const sourceVersion = require('../package.json').version;
  const sourceCommit = git('rev-parse', 'HEAD');
  const sourceDirty = Boolean(git('status', '--porcelain'));
  const preview = process.argv.includes('--preview');
  const version = reserveBuildVersion(root, sourceVersion);
  const packages = await packager({
    tmpdir: fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-worlds-package-')),
    dir: root,
    out: path.join(root, 'dist', version),
    appVersion: version,
    name: 'Wildbound',
    icon: path.join(root, 'assets', 'wildbound-icon.ico'),
    platform: 'win32',
    arch: 'x64',
    // The renderer imports app.mjs through Electron's file:// module loader.
    asar: false,
    overwrite: false,
    // Stage production packages from npm or pnpm without the packager's pruning step.
    prune: false,
    afterCopy: [({ buildPath }) => require('./copy-runtime-dependencies.cjs')(root, buildPath)],
    ignore: [
      /^\/\.migration-backups(?:\/|$)/,
      /^\/node_modules/,
      /^\/Progress pictures/,
      /^\/docs/,
      /^\/public/,
      /^\/\.openai/,
      /^\/drizzle/,
      /^\/db/,
      /^\/design/,
      /^\/scripts\/(upgrade|integrate|extract|fix|finish|optimize|polish|cleanup)/,
      /^\/\.tools/,
      /^\/test-output/,
      /^\/(?:output|tmp)(?:\/|$)/,
      /^\/server-data/,
      /^\/server-config\.local\.json/,
      /\.log$/,
      /\.(?:bak|tmp)$/i,
      /^\/assets\/shore-goblin\/source/,
      /^\/assets\/(?:spider|boar|elephant)-wow\//,
      /^\/art\/player\/detail-native-v[234]/,
      /^\/tests/,
      /^\/dist/,
      /^\/\.git/,
      /^\/Concept Art Pixel/,
    ],
  });
  if (git('rev-parse', 'HEAD') !== sourceCommit) {
    throw Error('The checkout commit changed during packaging. Rebuild from the intended revision.');
  }
  const build = {
    version,
    sourceVersion,
    sourceCommit,
    sourceDirty: sourceDirty || Boolean(git('status', '--porcelain')),
    builtAt: new Date().toISOString(),
    preview,
  };
  for (const packageDir of packages) {
    const manifest = path.join(packageDir, 'wildbound-build.json');
    fs.writeFileSync(manifest + '.tmp', JSON.stringify(build, null, 2) + '\n');
    fs.renameSync(manifest + '.tmp', manifest);
    console.log(`Packaged ${packageDir} from ${sourceCommit.slice(0, 12)}${build.sourceDirty ? ' (modified source)' : ''}`);
  }
}

buildDesktop().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
