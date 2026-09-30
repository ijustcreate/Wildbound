const { packager } = require("@electron/packager");
require('./check-syntax.cjs').checkSyntax();
const preview = process.argv.includes('--preview');
const buildFolder = preview ? 'night-hunt-' + new Date().toISOString().replace(/[:.]/g, '-') : require('../package.json').version;
packager({
  dir: require("node:path").resolve(__dirname, ".."),
  out: require("node:path").join("dist", buildFolder),
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
    /^\/art\/player\/detail-native-v[23]/,
    /^\/tests/,
    /^\/dist/,
    /^\/\.git/,
    /^\/Concept Art Pixel/,
  ],
})
  .then(console.log)
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
