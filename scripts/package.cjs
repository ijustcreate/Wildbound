const { packager } = require("@electron/packager");
packager({
  dir: require("node:path").resolve(__dirname, ".."),
  out: require("node:path").join("dist", require("../package.json").version),
  name: "Wildbound",
  platform: "win32",
  arch: "x64",
  overwrite: true,
  prune: true,
  ignore: [
    /^\/Progress pictures/,
    /^\/design/,
    /^\/scripts\/(upgrade|integrate|extract|fix|finish|optimize|polish|cleanup)/,
    /^\/\.tools/,
    /^\/test-output/,
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
