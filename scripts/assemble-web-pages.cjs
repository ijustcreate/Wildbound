// Run against a checkout of gh-pages. Existing snapshots are never overwritten.
const fs = require('node:fs'), path = require('node:path');
const [pagesArg, buildArg] = process.argv.slice(2);
if (!pagesArg || !buildArg) throw Error('Usage: node scripts/assemble-web-pages.cjs <gh-pages checkout> <web build>');
const pages = path.resolve(pagesArg), build = path.resolve(buildArg);
const metadata = JSON.parse(fs.readFileSync(path.join(build, 'web-build.json')));
if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) throw Error('Expected a numeric web release version.');
const original = path.join(pages, 'original');
if (!fs.existsSync(original)) {
  fs.mkdirSync(original);
  for (const entry of ['index.html', 'app.mjs', 'src', 'assets', 'authored']) {
    fs.cpSync(path.join(pages, entry), path.join(original, entry), {recursive: true});
  }
}
const release = path.join(pages, 'releases', metadata.version);
if (fs.existsSync(release)) throw Error('Preserving existing release: ' + release);
fs.cpSync(build, release, {recursive: true});
const root = path.resolve(__dirname, '..');
const chooser = fs.readFileSync(path.join(root, 'docs/web-index.html'), 'utf8');
fs.writeFileSync(path.join(pages, 'index.html'), chooser.replaceAll('{{version}}', metadata.version));
fs.mkdirSync(path.join(pages, 'latest'), {recursive: true});
fs.writeFileSync(path.join(pages, 'latest/index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="refresh" content="0;url=../releases/${metadata.version}/"><title>Play Wildbound ${metadata.version}</title><a href="../releases/${metadata.version}/">Play Wildbound ${metadata.version}</a></html>`);
fs.writeFileSync(path.join(pages, '.nojekyll'), '');
console.log(JSON.stringify({pages, original, release, metadata}, null, 2));
