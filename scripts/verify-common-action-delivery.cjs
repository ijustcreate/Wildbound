const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version;
const out=path.join(root,'test-output/common-action-polish');
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const candidates=fs.readdirSync(path.join(root,'dist'),{withFileTypes:true}).filter(d=>d.isDirectory()).flatMap(d=>{
 const folder=path.join(root,'dist',d.name,'Wildbound-win32-x64'),file=path.join(folder,'wildbound-build.json');
 if(!fs.existsSync(file))return [];
 try{const build=JSON.parse(fs.readFileSync(file,'utf8'));return build.version===version&&build.sourceCommit===commit&&!build.preview&&fs.existsSync(path.join(folder,'Wildbound.exe'))?[{folder,build}]:[];}catch{return [];}
}).sort((a,b)=>b.build.builtAt.localeCompare(a.build.builtAt));
const selected=candidates[0];if(!selected)throw Error('No matching normal desktop build.');
const files=['app.mjs','index.html','src/save-coordinator.mjs','src/profiles.mjs','src/rooms.mjs','src/worlds-ui.mjs','src/action-feedback.mjs','src/action-prompts.mjs','src/action-polish.css','src/safe-recovery.mjs','src/combat-feedback.mjs','src/adventure.mjs','src/enemy-damage.mjs','src/render.mjs','src/car-prompts.mjs','src/controller-glyphs.mjs','src/loot-progression.mjs','authored/rigs.json'];
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const appPath=path.join(selected.folder,'resources/app');
const comparisons=files.map(file=>{const source=hash(path.join(root,file)),packaged=hash(path.join(appPath,file));return {file,source,packaged,match:source===packaged};});
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const review=read(path.join(out,'packaged/report.json'));
const tooltip=read(path.join(root,'test-output/inventory-tooltips/common-polish-packaged/report.json'));
const boot=read(path.join(selected.folder,'test-output/boot-smoke.json'));
const sameReview=path.resolve(review.appPath)===path.resolve(appPath);
const sameTooltip=path.resolve(tooltip.appPath)===path.resolve(appPath);
const sameBoot=path.resolve(boot.appPath)===path.resolve(appPath);
const failed=comparisons.filter(c=>!c.match).length+review.failed+tooltip.failed+boot.failed+(!sameReview?1:0)+(!sameTooltip?1:0)+(!sameBoot?1:0);
const receipt={failed,commit,version,build:selected.build,exe:path.join(selected.folder,'Wildbound.exe'),appPath,normalProfile:true,automatedProfiles:'Isolated temporary test profiles',nativeChecks:review.checks.length,inventoryChecks:tooltip.checks.length,bootFailed:boot.failed,sameReview,sameTooltip,sameBoot,comparisons};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'delivery.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({failed,exe:receipt.exe,appPath,matched:comparisons.filter(c=>c.match).length,nativeChecks:receipt.nativeChecks,inventoryChecks:receipt.inventoryChecks}));
process.exitCode=failed?1:0;
