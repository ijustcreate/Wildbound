// Native Electron, isolated saves; mouse, menu actions, portraits and small-window QA.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','npc-quests');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const timer=setTimeout(()=>app.exit(1),120000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,useContentSize:true}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
  const result=await w.webContents.executeJavaScript(`(async()=>{
   await window.wildboundBoot.ready;window.requestAnimationFrame=()=>0;document.getElementById('loading')?.remove();
   const [{Game,EVENTS},{HeroUI},{Assets},{Renderer},q,{Profiles},{definitionPack,applyDefinitions},{ITEMS}]=await Promise.all([
    import('./src/core.mjs'),import('./src/hero-ui.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/npc-quests.mjs'),import('./src/profiles.mjs'),import('./src/definitions.mjs'),import('./src/items.mjs')]);
   const checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);},assets=new Assets();await assets.load();
   const g=new Game(()=>.31),p=g.addPlayer('pad:0','Ember'),other=g.addPlayer('pad:1','Cedar');p.controllerFamily='xbox';other.controllerFamily='switch';g.environment='forest';g.start();g.openingBoard=false;
   g.spawnEvent(EVENTS.findIndex(e=>e.type==='friendly_npc'));const npc=g.questNpcs[0];check(npc&&npc.faction==='ally','Event spawns protected friendly humanoid');
   Object.assign(p,{x:npc.x,y:npc.y+30});Object.assign(other,{x:npc.x+20,y:npc.y});q.openNpcDialogue(g,p);q.openNpcDialogue(g,other);
   const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=900;const r=new Renderer(canvas,assets);
   const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:99999;background:#26382e';document.body.append(host);const ui=new HeroUI(host);ui.draw(g,r);
   check(host.querySelectorAll('.npc-dialogue-portrait').length===4,'Two players each see player and NPC portraits');
   const panel=ui.panels.get(p.id),panel2=ui.panels.get(other.id),position=panel.style.left;
   check(panel.querySelector('.selected').textContent.includes('A'),'Xbox selected reply labels A');check(panel2.querySelector('.selected').textContent.includes('B'),'Switch selected reply labels B');
   const pixels=[...panel.querySelectorAll('canvas')].map(c=>{const bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let opaque=0;for(let i=3;i<bytes.length;i+=4)if(bytes[i])opaque++;return opaque;});check(pixels.every(n=>n>200),'Both portrait canvases contain visible humanoid pixels');
   panel.querySelector('[data-index="1"]').click();ui.draw(g,r);check(p.ui.node==='quests','Mouse navigates dialogue branch');check(other.ui.node==='greeting','Other player conversation unaffected');
   g.inventoryAction(p,'use');ui.draw(g,r);check(p.ui.node==='offer','Controller confirm previews chosen quest');g.inventoryAction(p,'use');ui.draw(g,r);check(q.npcQuestState(p).active?.branchId==='sticks','Controller accepts only own quest');
   const pictures={dialogue:host.outerHTML};window.npcQA={g,p,other,npc,host,ui,r,checks,check,position};
   other.ui=null;ui.draw(g,r);check(ui.panels.get(p.id).style.left===position,'Panel remains in own stable party slot');
   const profiles=new Profiles();profiles.save=()=>{};profiles.data.heroes=[{id:p.profileId}];profiles.capture(g);const copy=g.addPlayer('keyboard','Saved');profiles.assign(copy,profiles.data.heroes[0]);check(copy.npcQuests.rowan.active.branchId==='sticks','Profile capture and assign persist accepted contract');g.players.pop();
   const pack=structuredClone(definitionPack(EVENTS,ITEMS));check(pack.npcQuests.stages.length===6,'Designer export includes full six-stage quest configuration');applyDefinitions(pack,EVENTS,ITEMS);check(q.npcDialogueView(g,p).npc.name==='The Keeper','Definition import preserves live configuration');
   const {NpcQuestEditor}=await import('./src/npc-quest-editor.mjs');const editor=new NpcQuestEditor(ITEMS);check(editor.validate(),'Editor validates all six actual Keeper items and offhand compatibility');const editRoot=document.createElement('section');editor.mount(editRoot);check(editRoot.querySelectorAll('input,select,textarea').length>80,'Editor exposes editable story, appearance, equipment, stages and dialogue');
   return {checks,pixels};
  })()`);
  w.setContentSize(1281,900);
  await new Promise(resolve=>setTimeout(resolve,100));
  w.setContentSize(1280,900);
  await new Promise(resolve=>setTimeout(resolve,200));
  console.log('Native checks complete; capturing dialogue');
  await w.webContents.capturePage({x:0,y:0,width:1280,height:900},{stayHidden:true}).then(img=>fs.writeFileSync(path.join(out,'dialogue.png'),img.toPNG()));
  w.setContentSize(640,480);
  const small=await w.webContents.executeJavaScript(`(async()=>{const {g,p,other,ui,r,host,check,npc}=window.npcQA;other.x=npc.x+20;other.y=npc.y;other.room=null;const q=await import('./src/npc-quests.mjs');q.openNpcDialogue(g,other);ui.draw(g,r);const panels=[...host.querySelectorAll('.npc-dialogue-session')];check(panels.every(e=>e.getBoundingClientRect().right<=innerWidth&&e.getBoundingClientRect().bottom<=innerHeight),'Small-window panels fit viewport');check(panels.every(e=>e.scrollWidth<=e.clientWidth+2),'Small-window panels have no horizontal overflow');return {width:innerWidth,height:innerHeight};})()`);
  await new Promise(resolve=>setTimeout(resolve,150));
  await w.webContents.capturePage({x:0,y:0,width:640,height:480},{stayHidden:true}).then(img=>fs.writeFileSync(path.join(out,'small-window.png'),img.toPNG()));
  if(errors.length)throw Error(errors.join('\n'));const checks=await w.webContents.executeJavaScript('window.npcQA.checks');const report={...result,checks,small,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
