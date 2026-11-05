const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.resolve(process.argv[2]),out=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'test-output/tv-arena/file-receipt.json');
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
// Local backup/temp files are not runtime inputs and may be omitted by packaging.
const files=[...walk('src'),...walk('authored'),...['app.mjs','main.cjs','preload.cjs','package.json','index.html']].filter(f=>!['.bak','.tmp','.log'].includes(path.extname(f).toLowerCase())).map(f=>f.replaceAll('\\','/'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const normalizedFiles=['package.json'];
const packageFields=['name','version','description','main','dependencies'];
const runtimePackage=file=>{const data=JSON.parse(fs.readFileSync(file,'utf8'));return JSON.stringify(Object.fromEntries(packageFields.map(k=>[k,data[k]])));};
const mismatches=files.filter(f=>!fs.existsSync(path.join(base,f))||(f==='package.json'?runtimePackage(path.join(root,f))!==runtimePackage(path.join(base,f)):hash(path.join(root,f))!==hash(path.join(base,f))));
const own=['src/tv-wildbound.mjs','src/tv-arena-level.mjs','src/tv-arena-art.mjs','src/tv-arena-creatures.mjs','src/rig-subjects.mjs','src/project-rigs.mjs','src/definitions.mjs','src/playable-lobby.mjs','authored/rigs.json','package.json'];
const report={verifiedAt:new Date().toISOString(),appPath:base,files:files.length,normalizedFiles,mismatches,requestedFilesMatch:own.every(f=>!mismatches.includes(f)),manifest:JSON.parse(fs.readFileSync(path.join(base,'../../wildbound-build.json'),'utf8'))};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));process.exitCode=mismatches.length?1:0;
