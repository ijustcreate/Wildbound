const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const stage=process.env.WILDBOUND_CRITTER_STAGE||(base===root?'source':'packaged');
const output=path.join(root,'test-output','diagon-critters',stage);
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-diagon-critters-')));
app.commandLine.appendSwitch('mute-audio');
const timeout=setTimeout(()=>app.exit(1),120000);

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1120,height:820,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;window.Worker=undefined;
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {saveSession,restoreSession}=await import('./src/session.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs'),{leaveTrainTest}=await import('./src/train-test.mjs');
   const {alleyGate,alleyBlocked}=await import('./src/diagon-alley.mjs');
   const {visitDiagonCritters,diagonCritterPrompt}=await import('./src/diagon-critters.mjs');
   const {give,ITEMS}=await import('./src/items.mjs');
   const {paintItem}=await import('./src/item-art.mjs');
   const checks=[],pictures={},ok=(check,note)=>{if(!check)throw Error(note);checks.push(note);};
   const assets=wildboundPolishTest.assets,canvas=document.createElement('canvas');
   canvas.style.cssText='position:fixed;inset:0;width:1080px;height:780px';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=false;
   const settle=(g,n=1,input={})=>{for(let i=0;i<n;i++)g.update(.05,{keyboard:input});};
   const press=(g,control)=>{settle(g);settle(g,1,{[control]:true});settle(g);};
   const survey=g=>{const records=[];visitDiagonCritters(g,a=>records.push(a));return records;};
   const find=(g,kind)=>survey(g).find(a=>a.kind===kind);
   function fixture(persistent){
    const g=new Game(()=>.49),original=g.addPlayer('keyboard','Critter tester');
    g.start();g.openingBoard=false;g.spriteLibrary=assets.library;g.persist=()=>{};g.onSound=()=>{};
    original.equipment.hand1='starter_wand';original.inventory=[];give(original.inventory,'empty_jar');
    ok(enterWildLands(g,{persistent}).ok,'Normal Wild Lands entry '+persistent);
    g.trainTest.preparing=false;const hero=g.players[0],gate=alleyGate(g);
    Object.assign(hero,{x:gate.x,y:gate.y+55});press(g,'interact');settle(g,18);press(g,'interact');
    ok(g.trainTest.design.activeRoom==='diagon','The actual wand gate opens Diagon Alley '+persistent);
    hero.equipment.hand1=null;hero.equipment.hand2='critter_net';g.portalTransition=null;g.trainTest.noticeUntil=0;
    return {g,hero,original};
   }
   function aimAt(g,hero,a){
    for(let i=0;i<8;i++){
     const angle=i*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle);
     Object.assign(hero,{x:a.x-dx*24,y:a.y-dy*24,faceX:dx,faceY:dy});
     if(!alleyBlocked(g,hero.x,hero.y)&&diagonCritterPrompt(g,hero)==='CATCH '+ITEMS['caught_'+a.kind].name.toUpperCase())return;
    }
    throw Error('No safe approach to '+a.id);
   }
   const snap=(g,name)=>{renderer.trainScene=null;renderer.draw(g,.016);pictures[name]=canvas.toDataURL();};
   let {g,hero}=fixture(true);
   const wildlife=survey(g);ok(wildlife.length===8&&wildlife.every(a=>!alleyBlocked(g,a.x,a.y,3)),
    'Eight wildlife actors spawn on open habitat ground');
   const butterfly=find(g,'moonvein_butterfly');aimAt(g,hero,butterfly);
   const originalX=butterfly.x;settle(g,41);
   ok(Math.abs(butterfly.x-originalX)>10&&butterfly.altitude>0,'Moonvein butterflies travel with a visible flight height');
   aimAt(g,hero,butterfly);snap(g,'moonvein-in-habitat');press(g,'attack');
   let item=hero.inventory.find(i=>i?.type==='caught_moonvein_butterfly');
   ok(item?.captureContainer==='empty_jar'&&!survey(g).some(a=>a.id===butterfly.id),'Off-hand Attack catches a Moonvein in its jar and removes its actor');
   const rat=find(g,'gloamwhisker_rat');aimAt(g,hero,rat);
   const ratBefore={x:rat.x,y:rat.y};settle(g,66);
   ok(Math.hypot(rat.x-ratBefore.x,rat.y-ratBefore.y)>65&&!alleyBlocked(g,rat.x,rat.y,3),'Gloamwhisker runs a Nocturne route and respects solid props');
   aimAt(g,hero,rat);snap(g,'gloamwhisker-in-habitat');give(hero.inventory,'empty_jar');press(g,'attack');
   ok(!hero.inventory.some(i=>i?.type==='caught_gloamwhisker_rat')&&hero.inventory.some(i=>i?.type==='empty_jar'),'A rat cannot consume a critter bottle');
   give(hero.inventory,'critter_cage');aimAt(g,hero,rat);press(g,'attack');
   ok(hero.inventory.some(i=>i?.type==='caught_gloamwhisker_rat'&&i.captureContainer==='critter_cage'),'The actual Attack input catches the rat in a travel cage');
   const spider=survey(g).find(a=>a.id==='cobble-signpost');aimAt(g,hero,spider);snap(g,'cobble-jumper-in-habitat');
   press(g,'attack');ok(hero.inventory.some(i=>i?.type==='caught_cobble_jumper'&&i.captureContainer==='empty_jar'),'A Cobble-jumper fits in the standard critter bottle');
   g=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));hero=g.players[0];g.trainTest.preparing=false;g.spriteLibrary=assets.library;g.persist=()=>{};g.onSound=()=>{};settle(g);
   ok(g.trainTest.design.activeRoom==='diagon'&&hero.inventory.filter(i=>i?.type.startsWith('caught_')).length===3,'A Wilds checkpoint preserves all three catches');
   ok(!survey(g).some(a=>[butterfly.id,rat.id,spider.id].includes(a.id)),'Captured wildlife stays away after save restore');
   Object.assign(hero,{x:7230,y:3890});g.openInventory(hero);hero.ui.panel='pack';
   hero.ui.index=hero.inventory.findIndex(i=>i?.type==='caught_moonvein_butterfly');g.inventoryAction(hero,'use');hero.ui=null;settle(g,4);
   ok(hero.inventory.some(i=>i?.type==='empty_jar')&&survey(g).some(a=>a.released&&a.kind==='moonvein_butterfly'),
    'Inventory Use releases the butterfly to its habitat and returns its exact jar');
   const reloaded=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));reloaded.trainTest.preparing=false;reloaded.onSound=()=>{};settle(reloaded);
   ok(survey(reloaded).some(a=>a.released&&a.kind==='moonvein_butterfly'),'A released specimen remains in the habitat across Wilds checkpoints');
   const preview=fixture(false),captured=find(preview.g,'moonvein_butterfly');aimAt(preview.g,preview.hero,captured);press(preview.g,'attack');
   ok(preview.original.inventory.some(i=>i?.type==='empty_jar'),'An active preview capture leaves the original inventory untouched');
   leaveTrainTest(preview.g);
   ok(preview.original.inventory.some(i=>i?.type==='caught_moonvein_butterfly')&&!preview.original.inventory.some(i=>i?.type==='empty_jar'),
    'Returning from preview carries the catch and debits one actual container as one operation');
   const sheet=document.createElement('canvas');sheet.width=300;sheet.height=130;const c=sheet.getContext('2d');
   c.fillStyle='#22372f';c.fillRect(0,0,300,130);c.imageSmoothingEnabled=false;
   for(const [i,kind]of ['moonvein_butterfly','gloamwhisker_rat','cobble_jumper'].entries()){
    c.save();c.translate(i*100+14,20);c.scale(3,3);paintItem(c,'caught_'+kind);c.restore();
    c.fillStyle='#e4dac0';c.font='10px sans-serif';c.textAlign='center';c.fillText(ITEMS['caught_'+kind].name,i*100+50,113);
   }
   pictures.caughtIcons=sheet.toDataURL();
   return {checks,pictures};
  })()`);
  for(const [name,png]of Object.entries(result.pictures))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  const report={checks:result.checks,errors,muted:win.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.checks.length,errors,muted:report.muted}));
  clearTimeout(timeout);app.exit(errors.length||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);clearTimeout(timeout);app.exit(1);}
});
