const fs = require('node:fs');
const path = require('node:path');
const {checkSyntax} = require('./check-syntax.cjs');
const root = path.resolve(__dirname, '..');
// Publish only game files. Never include desktop saves, credentials, or tooling.
const output = path.join(root, 'dist', 'web-' + new Date().toISOString().replace(/[:.]/g, '-'));
checkSyntax(root);
fs.mkdirSync(output, {recursive: true});
for (const file of ['index.html', 'app.mjs']) fs.copyFileSync(path.join(root, file), path.join(output, file));
for (const folder of ['src', 'assets']) fs.cpSync(path.join(root, folder), path.join(output, folder), {recursive: true});
fs.mkdirSync(path.join(output, 'authored'));
if (fs.existsSync(path.join(root, 'authored', 'rigs.json'))) fs.copyFileSync(path.join(root, 'authored', 'rigs.json'), path.join(output, 'authored', 'rigs.json'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(output);
