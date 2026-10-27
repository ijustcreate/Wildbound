const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/blank-explorer');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 const errors=[],checks=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const js=s=>w.webContents.executeJavaScript(s),assert=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
 const frame=()=>js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))');
 const capture=async name=>{await frame();fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());};
 try{
  await w.loadURL('about:blank');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Debugger.enable');
  await w.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.blankCtx=ctx,false)'});
  if(process.env.WILDBOUND_VERIFY_URL)await w.loadURL(process.env.WILDBOUND_VERIFY_URL+'?tools=1');else await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await js('window.wildboundBoot.ready');
  for(let i=0;i<300;i++){if(await js(`!!window.blankCtx&&document.getElementById('loading').classList.contains('done')`))break;await new Promise(r=>setTimeout(r,30));}
  await js(`window.c=window.blankCtx;c.profiles.data.heroes=[];c.newLobby();window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',code:'KeyK',bubbles:true,cancelable:true}));void 0`);await frame();
  assert(await js(`JSON.stringify([...document.querySelector('.character-select').querySelectorAll('button')].map(b=>b.textContent))===JSON.stringify(['+ New character','Close'])`),'First-use chooser has exactly New character and Close');
  assert(await js(`c.profiles.data.heroes.length===0&&!c.game.players[0].equipment.chest&&[...c.playableLobby.nodes.values()][0]._idlePreview.hero.equipment.chest==='blank_explorer_costume'`),'Placeholder is a preview only, with no saved hero or granted equipment');
  await capture('first-use');
  await js(`window.first=c.game.players[0];window.hero=c.profiles.create('Claimed explorer');c.profiles.assign(first,hero);c.playableLobby.state.members.get(first.id).spawned=true;c.playableLobby.close(first);window.second=c.game.addPlayer('pad:0');c.playableLobby.sync();void 0`);await frame();
  assert(await js(`c.playableLobby.available(second).length===0&&JSON.stringify([...c.playableLobby.nodes.get(second.id).querySelectorAll('button')].map(b=>b.textContent))===JSON.stringify(['+ New character','Close'])`),'All characters claimed gives Player 2 the same empty chooser');
  await capture('all-claimed');
  await js(`c.playableLobby.nodes.get(second.id).querySelector('.choice-new').click();const panel=c.playableLobby.nodes.get(second.id),input=panel.querySelector('input[aria-label="Explorer name"]');input.value='New from blank';input.dispatchEvent(new Event('input'));panel.querySelector('.creation-primary').click();void 0`);
  assert(await js(`c.playableLobby.state.members.get(second.id).spawned&&second.name==='New from blank'&&second.equipment.chest!=='blank_explorer_costume'&&second.appearance.skin!=='#8b9596'`),'Creating a new character never inherits the placeholder costume or grey appearance');
  await js(`const id=second.profileId;c.profiles.data.heroes=c.profiles.data.heroes.filter(h=>h.id!==id);second.profileId=null;const s=c.playableLobby.state.members.get(second.id);s.spawned=false;s.panel='choose';c.playableLobby.renderPanel(second);void 0`);
  await js(`c.game.players=[second];c.playableLobby.sync();c.playableLobby.refreshChoosers();void 0`);await frame();
  assert(await js(`c.playableLobby.available(second).length===1&&[...c.playableLobby.nodes.get(second.id).querySelectorAll('button')].some(b=>b.textContent==='Choose')&&c.playableLobby.nodes.get(second.id)._idlePreview.hero.id===hero.id`),'A released character returns to the ordinary chooser and live preview');
  await js(`[...c.playableLobby.nodes.get(second.id).querySelectorAll('button')].find(b=>b.textContent==='Choose').click();void 0`);
  const gear=await js(`(async()=>{const {spawnDebugItem}=await import('./src/game-debug.mjs'),{equip}=await import('./src/items.mjs');const p=c.game.players[0];p.inventory=[];const result=spawnDebugItem(c.game,p.id,'blank_explorer_costume',1);return result.ok&&equip(p,0,'chest')&&p.equipment.chest==='blank_explorer_costume';})()`);
  assert(gear,'Existing dev console grants and equips the actual costume');
  await capture('dev-equipped');
  await js(`c.game.players[0].device='keyboard';c.game.openInventory(c.game.players[0]);void 0`);await frame();
  assert(await js(`!!document.querySelector('[aria-label*="Blank explorer costume"]')`),'Equipped costume is present in the actual inventory UI');
  await capture('inventory-costume');
  await js(`c.game.players[0].ui=null;document.getElementById('lobby-studio').click();const studio=c.designer.playerStudio;studio.previewEquipment={chest:'blank_explorer_costume'};studio.refresh();studio.animate(0);void 0`);await frame();
  assert(await js(`c.designer.playerStudio.actor().equipment.chest==='blank_explorer_costume'&&!!document.querySelector('dialog[open] .ps-canvas')`),'Studio previews the actual native costume');
  await capture('studio-costume');
  const art=await js(`(async()=>{
   const {blankExplorerPreview}=await import('./src/blank-explorer.mjs'),{drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs'),{paintItem}=await import('./src/item-art.mjs');
   const before=JSON.stringify(playerMotion),sheet=document.createElement('canvas');sheet.width=1120;sheet.height=500;const p=sheet.getContext('2d');p.fillStyle='#142b28';p.fillRect(0,0,1120,500);p.imageSmoothingEnabled=false;p.font='14px sans-serif';p.fillStyle='#ece4ce';
   for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d),a={...blankExplorerPreview(),faceX,faceY,animationAction:'idle',playerFrame:0};p.fillText(['Front','Front-left','Left','Back-left','Back','Back-right','Right','Front-right'][d],d*140+22,24);p.save();p.translate(d*140+70,98);drawPlayer(p,a,0);p.restore();p.save();p.translate(d*140+70,260);p.scale(3,3);drawPlayer(p,a,0);p.restore();}
   for(const [i,action]of ['idle','walk','run','slash','hurt','death'].entries()){p.fillStyle='#ece4ce';p.fillText(action,30+i*150,310);p.save();p.translate(65+i*150,455);p.scale(3,3);drawPlayer(p,{...blankExplorerPreview(),faceX:0,faceY:1,animationAction:action,playerFrame:2,moving:action==='run'||action==='walk'},.25);p.restore();}
   p.save();p.translate(1000,350);p.scale(3,3);paintItem(p,'blank_explorer_costume');p.restore();
   return {url:sheet.toDataURL(),preserved:before===JSON.stringify(playerMotion)};
  })()`);
  fs.writeFileSync(path.join(out,'native-costume-review.png'),Buffer.from(art.url.split(',')[1],'base64'));assert(art.preserved,'Eight directions and six poses preserve the authored model');
  assert(errors.length===0,'Zero renderer errors');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,base},null,2));console.log(JSON.stringify({checks,errors,base}));app.exit(0);
 }catch(error){console.error(error);console.error(JSON.stringify({checks,errors}));app.exit(1);}
});
