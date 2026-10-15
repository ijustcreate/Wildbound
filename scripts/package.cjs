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
  platform: "win32",
  arch: "x64",
  overwrite: !preview,
  prune: true,
  ignore: [
    /^\/Progress pictures/,
    /^\/design/,
    /^\/scripts\/(upgrade|integrate|extract|fix|finish|optimize|polish|cleanup)/,
    /^\/\.tools/,
    /^\/test-output/,
    /^\/assets\/shore-goblin\/source/,
    /^\/assets\/(?:spider|boar|elephant)-wow\//,
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
      const runtime=path.join(packageDir,'forest-server-runtime');
      fs.mkdirSync(runtime,{recursive:true});
      fs.copyFileSync(path.join(root,'realm-server.mjs'),path.join(runtime,'realm-server.mjs'));
      fs.cpSync(path.join(root,'src'),path.join(runtime,'src'),{recursive:true});
      fs.cpSync(path.join(root,'node_modules','ws'),path.join(runtime,'node_modules','ws'),{recursive:true});
      fs.copyFileSync(path.join(root,'Start Wildbound Forest Server.cmd'),path.join(packageDir,'Start Wildbound Forest Server.cmd'));
      fs.writeFileSync(path.join(packageDir, 'wildbound-build.json'), JSON.stringify(build, null, 2) + '\n');
      console.log(`Packaged ${packageDir} from ${build.sourceCommit.slice(0, 12)}${build.sourceDirty ? ' (modified source)' : ''}`);
    }
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
