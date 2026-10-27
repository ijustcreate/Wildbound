// Keep immutable editions while avoiding another copy of identical media on Pages.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [pagesArg,version,baseline,sitePath='/Wildbound/']=process.argv.slice(2);
if(!pagesArg||!/^\d+\.\d+\.\d+$/.test(version||'')||!/^\d+\.\d+\.\d+$/.test(baseline||'')||version===baseline)throw Error('Usage: share-web-assets.cjs <pages checkout> <new version> <immutable asset version> [site path]');
const root=path.resolve(__dirname,'..'),pages=fs.realpathSync(pagesArg),release=fs.realpathSync(path.join(pages,'releases',version)),previous=fs.realpathSync(path.join(pages,'releases',baseline));
if(!release.startsWith(pages+path.sep)||!previous.startsWith(pages+path.sep))throw Error('Release paths must stay inside the Pages checkout');
const staging=path.resolve(root,'dist','shared-web-assets-'+version),dist=fs.realpathSync(path.join(root,'dist'));
if(!staging.startsWith(dist+path.sep)||fs.existsSync(staging))throw Error('Preserve the existing staging folder; choose a new release');
const hash=file=>{let data=fs.readFileSync(file);if(/\.(json|md|txt|gltf|css|html|js|mjs)$/i.test(file))data=Buffer.from(data.toString('utf8').replace(/\r\n/g,'\n'));return crypto.createHash('sha256').update(data).digest('hex');};
const list=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name)):e.isFile()?[path.join(dir,e.name)]:[]);
let files=0,bytes=0;
for(const folder of ['assets','authored'])for(const file of list(path.join(release,folder))){const relative=path.relative(release,file),old=path.join(previous,relative);if(!fs.existsSync(old)||hash(file)!==hash(old))throw Error('Cannot share a changed asset: '+relative);files++;bytes+=fs.statSync(file).size;}
const prefix=sitePath.replace(/\/$/,'')+'/releases/'+baseline+'/';let rewritten=0;
for(const file of list(release)){
 if(!/\.(html|css|js|mjs|json)$/i.test(file)||/^(assets|authored)[\\/]/.test(path.relative(release,file)))continue;
 const original=fs.readFileSync(file,'utf8');
 // A directory-only validation string such as startsWith('assets/') stays intact.
 const output=original.replace(/([\x22\x27\x60])(?:\.\.?\/)?(assets|authored)\/(?=[A-Za-z0-9_$])/g,(_,quote,folder)=>quote+prefix+folder+'/').replace(/url\((?:\.\.?\/)?(assets|authored)\/(?=[A-Za-z0-9_$])/g,(_,folder)=>'url('+prefix+folder+'/');
 if(output!==original){fs.writeFileSync(file,output);rewritten++;}
}
fs.mkdirSync(staging);
for(const folder of ['assets','authored']){const source=path.resolve(release,folder),target=path.resolve(staging,folder);if(!source.startsWith(release+path.sep)||!target.startsWith(staging+path.sep))throw Error('Unexpected generated asset move');fs.renameSync(source,target);}
const metadataPath=path.join(release,'web-build.json'),metadata=JSON.parse(fs.readFileSync(metadataPath));metadata.sharedAssets={version:baseline,prefix,verifiedFiles:files,savedBytes:bytes};fs.writeFileSync(metadataPath,JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify({version,baseline,files,savedMiB:Math.round(bytes/1024/1024),rewritten,staging}));
