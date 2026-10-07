// Refresh from an immutable desktop build, never from personal saves.
// node scripts/sync-wildbound.mjs <game checkout> <desktop version>
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const [gameRoot,version]=process.argv.slice(2);
if(!gameRoot||!/^\d+\.\d+\.\d+$/.test(version||''))throw Error('Provide the game checkout and desktop version.');
const require=createRequire(path.join(path.resolve(gameRoot),'package.json'));
const {listPackage,extractFile}=await import(pathToFileURL(require.resolve('@electron/asar')).href);
const buildRoot=path.join(path.resolve(gameRoot),'dist',version,'Wildbound-win32-x64');
const identity=JSON.parse(fs.readFileSync(path.join(buildRoot,'wildbound-build.json'),'utf8'));
if(identity.version!==version)throw Error('Desktop build identity does not match.');
const archive=path.join(buildRoot,'resources/app.asar');
const target=fileURLToPath(new URL('../public/viewer/',import.meta.url));
const files=listPackage(archive).map(file=>file.replaceAll('\\','/').replace(/^\//,''))
 .filter(file=>/^src\/.*\.mjs$/.test(file)||file==='authored/rigs.json'||/^assets\/[^/]+\.json$/.test(file)||/^assets\/humanoid-hd\/.*\.png$/.test(file)||file==='assets/murk-wolf/parts-source.png').sort();
const hashes={};let bytes=0;
for(const file of files){
 const data=extractFile(archive,path.normalize(file));
 const output=path.join(target,file);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,data);
 hashes[file]=createHash('sha256').update(data).digest('hex');bytes+=data.length;
}
const revision=createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
fs.writeFileSync(path.join(target,'snapshot.json'),JSON.stringify({version,...identity,revision,files:hashes},null,2)+'\n');
console.log(JSON.stringify({version,files:files.length,bytes,revision}));
