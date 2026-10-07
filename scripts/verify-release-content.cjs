// Exact runtime-content identity: packaging must include dirty and new source files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),asar=require('@electron/asar');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version;
const directory=path.resolve(process.argv[2]||path.join(root,'dist',version,'Wildbound-win32-x64'));
const manifest=JSON.parse(fs.readFileSync(path.join(directory,'wildbound-build.json'),'utf8'));
if(manifest.version!==version||manifest.preview)throw Error('Release version/profile does not match source');
const archive=path.join(directory,'resources','app.asar'),plain=path.join(directory,'resources','app');
const packaged=name=>fs.existsSync(archive)?asar.extractFile(archive,name):fs.readFileSync(path.join(plain,name));
const identity=JSON.parse(packaged('package.json'));
if(identity.version!==version||identity.main!=='main.cjs')throw Error('Packaged runtime identity mismatch');
const files=['app.mjs','index.html','main.cjs','preload.cjs'];
function visit(dir){for(const file of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=path.join(dir,file.name);if(file.isDirectory())visit(name);else if(file.isFile())files.push(name);}}
for(const dir of ['src','assets','authored'])visit(dir);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),mismatches=[],checks=[];
for(const name of files){const source=hash(fs.readFileSync(path.join(root,name)));try{const built=hash(packaged(name));checks.push({file:name,sha256:built});if(source!==built)mismatches.push(name);}catch(e){mismatches.push(name+': '+e.message);}}
const report={directory,manifest,checked:files.length,mismatches,checks};
fs.mkdirSync(path.join(root,'test-output'),{recursive:true});fs.writeFileSync(path.join(root,'test-output','build'+version.replaceAll('.','-')+'-content.json'),JSON.stringify(report,null,2));
if(mismatches.length)throw Error('Source/package mismatch: '+mismatches.join('\n'));
console.log(JSON.stringify({version,checked:files.length,mismatches:0,directory,manifest}));
