const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base=path.resolve(process.argv[2]),out=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'test-output/tv-arena/file-receipt.json');
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
// Local backup/temp files are not runtime inputs and may be omitted by packaging.
const plates=fs.existsSync(path.join(root,'assets/tv-arena'))?walk('assets/tv-arena'):[];
const files=[...walk('src'),...walk('authored'),...plates,...['app.mjs','main.cjs','preload.cjs','package.json','index.html']].filter(f=>!['.bak','.tmp','.log'].includes(path.extname(f).toLowerCase())).map(f=>f.replaceAll('\\','/'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const normalizedFiles=['package.json'];
const packageFields=['name','version','description','main','dependencies'];
const runtimePackage=file=>{const data=JSON.parse(fs.readFileSync(file,'utf8'));return JSON.stringify(Object.fromEntries(packageFields.map(k=>[k,data[k]])));};
const mismatches=files.filter(f=>!fs.existsSync(path.join(base,f))||(f==='package.json'?runtimePackage(path.join(root,f))!==runtimePackage(path.join(base,f)):hash(path.join(root,f))!==hash(path.join(base,f))));
const own=['src/board-art.mjs','src/board-scenery-skin.mjs','src/board-layout.mjs','src/board.mjs','src/tv-journey-board.mjs','src/tv-wildbound.mjs','src/tv-arena-level.mjs','src/tv-arena-art.mjs','src/tv-arena-parallax.mjs','src/tv-arena-creatures.mjs','src/tv-arena-creature-design.mjs','src/tv-arena-design-merge.mjs','src/tv-arena-run.mjs','src/tv-arena-run-art.mjs','src/tv-arena-roster.mjs','src/tv-arena-roster-art.mjs','src/tv-crouch.mjs','src/player-motion.mjs','src/frog-art.mjs','src/boundless-generation.mjs','src/rig-subjects.mjs','src/project-rigs.mjs','src/definitions.mjs','src/playable-lobby.mjs','authored/rigs.json','package.json',...plates.map(f=>f.replaceAll('\\','/'))];
const report={verifiedAt:new Date().toISOString(),appPath:base,files:files.length,normalizedFiles,mismatches,requestedFilesMatch:own.every(f=>!mismatches.includes(f)),manifest:JSON.parse(fs.readFileSync(path.join(base,'../../wildbound-build.json'),'utf8'))};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));process.exitCode=mismatches.length?1:0;
