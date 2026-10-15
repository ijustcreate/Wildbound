// Run with Electron so fs can read packaged app.asar files directly.
const {app}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP;
app.whenReady().then(()=>{
 try{
  if(!base)throw Error('Set WILDBOUND_VERIFY_APP to the exact packaged application.');
  // Electron packaging removes scripts/devDependencies from package.json.
  const files=['authored/rigs.json',...fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isFile()&&/\.(?:cjs|mjs|html|css)$/.test(e.name)).map(e=>e.name)];
  function walk(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
   const rel=dir+'/'+e.name;if(/^assets\/(?:shore-goblin\/source|(?:spider|boar|elephant)-wow)(?:\/|$)/.test(rel))continue;
   if(e.isDirectory())walk(rel);else if(e.isFile())files.push(rel);
  }}
  walk('src');walk('assets');
  let bytes=0;for(const file of files){const source=fs.readFileSync(path.join(root,file));if(!source.equals(fs.readFileSync(path.join(base,file))))throw Error('Stale packaged content: '+file);bytes+=source.length;}
  const identity=JSON.parse(fs.readFileSync(path.join(base,'../../wildbound-build.json'),'utf8'));
  const sourcePackage=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')),packedPackage=JSON.parse(fs.readFileSync(path.join(base,'package.json'),'utf8'));
  for(const key of ['name','version','main','dependencies'])if(JSON.stringify(sourcePackage[key])!==JSON.stringify(packedPackage[key]))throw Error('Wrong packaged manifest: '+key);
  const version=sourcePackage.version;
  if(identity.version!==version||identity.preview)throw Error('Wrong desktop build identity.');
  const report={...identity,byteMatchedFiles:files.length,byteMatchedBytes:bytes,packagedApp:base};
  fs.writeFileSync(path.join(root,'test-output/desktop-content-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1);}
});
