// Separate, non-overwriting desktop snapshot. Never replaces a release or save.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
async function build(){
 const recover=arg('--verify-only');
 if(!recover)require('./check-syntax.cjs').checkSyntax(root);
 const zipDir=arg('--electron-zip-dir');
 if(!recover&&(!zipDir||!fs.existsSync(path.join(zipDir,'electron-v41.10.7-win32-x64.zip'))))
  throw Error('Supply --electron-zip-dir with the existing Electron 41.10.7 ZIP directory.');
 const name='event-variety-'+new Date().toISOString().replace(/[:.]/g,'-');
 const out=path.join(root,'dist',name);
 if(fs.existsSync(out))throw Error('Refusing to overwrite '+out);
 const sourceFiles={};
 function collect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);
  if(e.isDirectory())collect(file);
  else if(/\.(mjs|cjs|js|css|html)$/.test(e.name))sourceFiles[path.relative(root,file).replaceAll('\\','/')]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 }}
 for(const e of fs.readdirSync(root,{withFileTypes:true}))if(e.isFile()&&/\.(mjs|cjs|js|css|html)$/.test(e.name)){
  sourceFiles[e.name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,e.name))).digest('hex');
 }
 collect(path.join(root,'src'));
 let packages;
 if(recover){
  const packageDir=path.resolve(recover),relative=path.relative(path.join(root,'dist'),packageDir);
  if(!/^event-variety-[^\\/]+[\\/]Wildbound-win32-x64$/.test(relative)||fs.existsSync(path.join(packageDir,'wildbound-build.json')))
   throw Error('Verification recovery requires a new incomplete event-variety snapshot, never an existing release.');
  packages=[packageDir];
 }else packages=await require('@electron/packager').packager({
  dir:root,out,name:'Wildbound',platform:'win32',arch:'x64',overwrite:false,
  asar:true,prune:true,icon:path.join(root,'assets','wildbound-icon.ico'),
  electronVersion:'41.10.7',electronZipDir:path.resolve(zipDir),
  ignore:[/^\/Progress pictures/,/^\/design/,/^\/scripts/,/^\/\.tools/,/^\/test-output/,
   /^\/art\/player\/detail-native-v[234]/,/^\/tests/,/^\/dist/,/^\/\.git/,/^\/Concept Art Pixel/],
 });
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
 const manifest={version:require('../package.json').version,variant:'Varied Events Test',
  sourceCommit:git('rev-parse','HEAD'),sourceDirty:!!git('status','--porcelain','--untracked-files=no'),
  builtAt:new Date().toISOString(),preview:false,eventDirectorVersion:2,wingHover:true,sourceFiles};
 const asar=require('@electron/asar');
 for(const packageDir of packages){
  const archive=path.join(packageDir,'resources','app.asar');
  for(const [file,hash]of Object.entries(sourceFiles)){
   const shipped=asar.extractFile(archive,file.split('/').join(path.sep));
   if(crypto.createHash('sha256').update(shipped).digest('hex')!==hash)throw Error('Packaged source differs: '+file);
  }
  fs.writeFileSync(path.join(packageDir,'wildbound-build.json'),JSON.stringify(manifest,null,2)+'\n');
 }
 const executable=path.join(packages[0],'Wildbound.exe'),launcher=path.join(root,'Play Wildbound Varied Events.cmd');
 // The text launcher is intentionally generic. Its small identity file pins an
 // exact snapshot, not whichever dist folder happens to be newest.
 fs.writeFileSync(path.join(root,'test-output','event-variety-build.json'),JSON.stringify({executable,packageDir:packages[0],manifest:path.join(packages[0],'wildbound-build.json')},null,2)+'\n');
 console.log(JSON.stringify({packageDir:packages[0],executable,launcher,sourceCommit:manifest.sourceCommit,verifiedSourceFiles:Object.keys(sourceFiles).length},null,2));
}
build().catch(error=>{console.error(error.stack);process.exitCode=1;});
