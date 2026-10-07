const fs = require('node:fs');
const path = require('node:path');
const {checkSyntax} = require('./check-syntax.cjs');
const root = path.resolve(__dirname, '..');
// Publish only game files. Never include desktop saves, credentials, or tooling.
const version=require('../package.json').version,versioned=process.argv.includes('--versioned');
const output = path.join(root, 'dist', versioned?'web-'+version:'web-' + new Date().toISOString().replace(/[:.]/g, '-'));
if(fs.existsSync(output))throw Error('Web output already exists; preserve it and choose a new version: '+output);
checkSyntax(root);
fs.mkdirSync(output, {recursive: true});
for (const file of ['index.html', 'app.mjs']) fs.copyFileSync(path.join(root, file), path.join(output, file));
if(versioned){const index=path.join(output,'index.html');fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace('<title>Wildbound — The Living Board</title>','<title>Wildbound — The Living Board · v'+version+'</title>'));}
for (const folder of ['src', 'assets']) fs.cpSync(path.join(root, folder), path.join(output, folder), {recursive: true});
fs.mkdirSync(path.join(output, 'authored'));
if (fs.existsSync(path.join(root, 'authored', 'rigs.json'))) fs.copyFileSync(path.join(root, 'authored', 'rigs.json'), path.join(output, 'authored', 'rigs.json'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
const {execFileSync}=require('node:child_process'),git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
fs.writeFileSync(path.join(output,'web-build.json'),JSON.stringify({version,sourceCommit:git('rev-parse','HEAD'),sourceDirty:!!git('status','--porcelain','--untracked-files=no'),builtAt:new Date().toISOString(),path:versioned?'releases/'+version+'/':null},null,2)+'\n');
console.log(output);
