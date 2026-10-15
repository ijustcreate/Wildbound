const { packager } = require("@electron/packager");
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
require('./check-syntax.cjs').checkSyntax();
const preview = process.argv.includes('--preview');
const buildFolder = preview ? 'night-hunt-' + new Date().toISOString().replace(/[:.]/g, '-') : require('../package.json').version;
packager({
  dir: path.resolve(__dirname, ".."),
  out: path.join("dist", buildFolder),
  name: "Wildbound",
    icon: path.join(__dirname, "..", "assets", "wildbound-icon.ico"),
  platform: "win32",
  arch: "x64",
  // The renderer dynamically imports app.mjs. Keep the app as a normal
  // directory so Electron's file:// module loader can resolve that graph.
  asar: false,
  overwrite: !preview,
  // Stage real production packages, resolving npm or pnpm links at the source.
  // The pruner assumes a flattened installation and fails on pnpm's virtual
  // dependency tree. Development tools are excluded before copying instead.
  prune: false,
  afterCopy: [({buildPath}) => require('./copy-runtime-dependencies.cjs')(path.resolve(__dirname,'..'),buildPath)],
  ignore: [
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
    /^\/server-data/,
    /^\/server-config\.local\.json/,
    /\.log$/,
    /^\/art\/player\/detail-native-v[234]/,
    /^\/tests/,
    /^\/dist/,
    /^\/\.git/,
    /^\/Concept Art Pixel/,
  ],
})
  .then((packages) => {
    const root = path.resolve(__dirname, '..');
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
    const build = {
      version: require('../package.json').version,
      sourceCommit: git('rev-parse', 'HEAD'),
      sourceDirty: Boolean(git('status', '--porcelain', '--untracked-files=no')),
      builtAt: new Date().toISOString(),
      preview,
    };
    for (const packageDir of packages) {
      fs.writeFileSync(path.join(packageDir, 'wildbound-build.json'), JSON.stringify(build, null, 2) + '\n');
      console.log(`Packaged ${packageDir} from ${build.sourceCommit.slice(0, 12)}${build.sourceDirty ? ' (modified source)' : ''}`);
    }
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
