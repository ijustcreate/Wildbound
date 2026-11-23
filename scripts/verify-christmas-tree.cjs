const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:180000});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/christmas-tree',process.env.WILDBOUND_VERIFY_APP?'packaged':'source');fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'isolated-profile'));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),170000);
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await win.webContents.executeJavaScript('wildboundBoot.ready');
const result=await win.webContents.executeJavaScript('('+ (async function(){try{
window.requestAnimationFrame=()=>0;window.Worker=undefined;
const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
const {drawChristmasTree,drawChristmasGift,unwrapChristmasGift,CHRISTMAS_SURPRISES}=await import('./src/holiday-decor.mjs'),{drawBreakable}=await import('./src/structure-destruction.mjs');
const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
const assets=new Assets();await assets.load();const g=new Game(()=>.5),p=g.addPlayer('keyboard','SCOUT');g.environment='house';g.start();g.persist=()=>{};g.onSound=()=>{};g.openingBoard=false;g.weather=null;g.event=null;g.effects=[];g.enemies=[];g.time=4;g.sky.elapsed=100;g.spriteLibrary=assets.library;
const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=850;canvas.style.cssText='width:1280px;height:850px';document.body.replaceChildren(canvas);const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=false;
const tree=g.house.furniture.find(f=>f.kind==='christmas_tree'),gift=g.house.furniture.find(f=>f.kind==='wrapped_gift');ok(tree&&gift,'existing tree and gift in live house');
p.x=tree.x-20;p.y=tree.y+55;p.appearance={...DEFAULT_APPEARANCE};renderer.camera={x:tree.x+15,y:tree.y-5,zoom:1.8};renderer.cameraOverride={...renderer.camera};renderer.cameraFollowSpeed=3;renderer.splitChild=true;
renderer.portalActors=null;renderer.portalEpoch=0;g.portalTransition=null;renderer.draw(g,0);images['house-interior']=canvas.toDataURL();
const decor=document.createElement('canvas');decor.width=680;decor.height=700;const c=decor.getContext('2d');c.fillStyle='#394b3e';c.fillRect(0,0,680,700);c.imageSmoothingEnabled=false;
c.fillStyle='#e4d6ad';c.font='16px sans-serif';c.fillText('Native scale',25,34);c.fillText('4x pixel review',260,34);
const prop=document.createElement('canvas');prop.width=140;prop.height=160;const pc=prop.getContext('2d');pc.translate(60-tree.x-tree.w/2,105-tree.y-tree.h);drawBreakable(pc,g,tree,drawChristmasTree);drawChristmasGift(pc,gift);renderer.animator.draw(pc,{...p,x:tree.x-27,y:tree.y+tree.h},1,43);
for(const [scale,x,y]of [[1,85,170],[4,400,435]])c.drawImage(prop,x-60*scale,y-105*scale,140*scale,160*scale);
images['tree-review']=decor.toDataURL();
const surface=()=>{const a=document.createElement('canvas');a.width=80;a.height=140;const pen=a.getContext('2d');pen.translate(40-tree.x-tree.w/2,110-tree.y-tree.h);return [a,pen];};
const [direct,dc]=surface(),[cached,cc]=surface();drawChristmasTree(dc,tree);drawBreakable(cc,g,tree,drawChristmasTree);
const a=direct.getContext('2d').getImageData(0,0,80,140).data,b=cached.getContext('2d').getImageData(0,0,80,140).data;ok(a.every((v,i)=>v===b[i]),'destructible furniture cache preserves entire crown and planter');
for(let i=0;i<CHRISTMAS_SURPRISES.length;i++){gift.opened=false;g.random=()=>(i+.5)/CHRISTMAS_SURPRISES.length;p.x=gift.x+10;p.y=gift.y+20;const count=g.loot.length;ok(unwrapChristmasGift(g,p,gift)&&g.loot.length===count+1&&gift.surpriseType===CHRISTMAS_SURPRISES[i],'unwrap exactly one '+CHRISTMAS_SURPRISES[i]);ok(!unwrapChristmasGift(g,p,gift),'opened gift stays opened '+i);}
return {checks,images};
}catch(e){return {testFailure:e?.stack||String(e),details:JSON.stringify(e)}}
}).toString()+')()');
if(result.testFailure)throw Error(result.testFailure+' '+result.details);
for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,failed:0,...result,muted:win.webContents.isAudioMuted(),errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
}catch(e){console.error(e?.stack||String(e),errors);clearTimeout(deadline);app.exit(1);}});

