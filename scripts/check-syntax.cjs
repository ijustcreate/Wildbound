const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
function checkSyntax(root = path.resolve(__dirname, '..')) {
  const files = [];
  function collect(directory, recursive) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory() && recursive) collect(file, true);
      else if (entry.isFile() && /\.(?:mjs|cjs|js)$/.test(entry.name)) files.push(file);
    }
  }
  collect(root, false);
  collect(path.join(root, 'src'), true);
  for (const file of files) execFileSync(process.execPath, ['--check', file], {stdio: 'inherit'});
  console.log(`Syntax checked ${files.length} runtime files.`);
}
module.exports = {checkSyntax};
if (require.main === module) checkSyntax();
