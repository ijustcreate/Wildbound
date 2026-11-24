const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','menu-art-restoration',base===root?'source':'packaged');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-menu-art-')));
app.commandLine.appendSwitch('mute-audio');

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1120,height:860,useContentSize:true,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 const errors=[];
 window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 const run=code=>window.webContents.executeJavaScript(code);
 const settle=()=>run('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
 const capture=async(name,selector)=>{
  await settle();
  const bounds=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y),width:Math.floor(r.width),height:Math.floor(r.height)};})()`);
  await window.webContents.capturePage(bounds);
  await settle();
  fs.writeFileSync(path.join(output,name+'.png'),(await window.webContents.capturePage(bounds)).toPNG());
 };
 try{
  await window.loadURL('about:blank');
  window.webContents.debugger.attach('1.3');
  await window.webContents.debugger.sendCommand('Debugger.enable');
  await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await window.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.qaContext=ctx,false)'});
  await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await run('wildboundBoot.ready');
  await run(`(async()=>{
   const ctx=qaContext,game=ctx.game,lobby=ctx.playableLobby,checks=[];
   const assert=(label,value)=>{if(!value)throw Error(label);checks.push(label);};
   game.players=[];game.phase='lobby';game.houseWorldsEnabled=true;
   const player=game.addPlayer('keyboard','Ember Fox');
   ctx.show('lobby');
   document.querySelector('.lobby-landing').hidden=true;
   lobby.reset();lobby.sync();
   const open=person=>{
    lobby.state.members.get(person.id).spawned=true;
    lobby.open(person,'environment');
    return lobby.nodes.get(person.id);
   };
   const panel=open(player);
   await Promise.all([...panel.querySelectorAll('img')].map(image=>image.decode()));
   const skin=(name)=>panel.querySelector('.expedition-skin.'+name);
   assert('Original illustrated rolled and unrolled frames decode',skin('rolled').naturalWidth&&skin('unrolled').naturalWidth);
   assert('Original painted Classic sign decodes',panel.querySelector('.expedition-sign').naturalWidth);
   assert('Wildbound mode begins with the rolled parchment and Daily Seed',panel.classList.contains('is-wildbound')&&!panel.querySelector('.expedition-daily').hidden);
   assert('Chooser identifies the player',panel.querySelector('.expedition-owner').textContent==='Ember Fox');
   assert('The Wilds is an illustrated third mode',panel.querySelectorAll('.expedition-mode').length===3&&getComputedStyle(panel.querySelector('.expedition-wilds')).backgroundImage.includes('choice-v1.png'));
   assert('Mode names and descriptions fit their painted rows',[...panel.querySelectorAll('.expedition-mode')].every(row=>{
    const box=row.getBoundingClientRect(),copy=row.querySelector('.expedition-copy').getBoundingClientRect();
    return copy.top>=box.top&&copy.bottom<=box.bottom;
   }));
   window.menuArtQa={ctx,game,lobby,player,panel,checks,assert,open};
  })()`);
  await capture('wildbound','.expedition-menu');
  await run(`(()=>{
   const {game,panel,assert,lobby,player}=menuArtQa;
   panel.querySelector('.expedition-classic').click();
   const list=panel.querySelector('.expedition-map-list'),style=getComputedStyle(list);
   assert('Classic shows all ten maps in the original five-by-two gallery',panel.classList.contains('is-classic')&&list.children.length===10&&style.gridTemplateColumns.split(' ').length===5&&style.gridTemplateRows.split(' ').length===2&&list.scrollHeight<=list.clientHeight+1);
   assert('Classic Accept remains below the complete map gallery',panel.querySelector('.expedition-accept').getBoundingClientRect().top>panel.querySelector('.expedition-starting').getBoundingClientRect().bottom);
   assert('Classic exposes both Boundless World and Daily Seed',!panel.querySelector('.expedition-boundless').hidden&&!panel.querySelector('.expedition-daily').hidden);
   panel.querySelector('[data-map=ice]').click();
   panel.querySelector('.expedition-daily').click();
   assert('Classic map preview and Daily Seed continue to work',panel.querySelector('.expedition-map-name').textContent==='Ice'&&panel.querySelector('.expedition-daily').getAttribute('aria-checked')==='true');
   assert('Selection remains a draft before Accept',game.houseWorldsEnabled&&lobby.state.members.get(player.id).expeditionDraft.map==='ice');
  })()`);
  await capture('classic','.expedition-menu');
  await run(`(()=>{
   const {panel,assert}=menuArtQa;
   panel.querySelector('.expedition-wilds').click();
   assert('The Wilds rolls the parchment and hides map-only choices',panel.classList.contains('is-wilds')&&panel.querySelector('.expedition-daily').hidden&&panel.querySelector('.expedition-starting').hidden&&!panel.querySelector('.expedition-accept').disabled);
  })()`);
  await capture('wilds','.expedition-menu');
  await run(`(()=>{
   const {ctx,lobby,player,assert,game,open}=menuArtQa;
   lobby.close(player);open(player);
   assert('Cancel restores the committed expedition choice',lobby.nodes.get(player.id).classList.contains('is-wildbound'));
   for(let index=1;index<4;index++)game.addPlayer('pad:'+index,'Explorer '+(index+1));
   lobby.sync();
   for(const explorer of game.players.slice(1))open(explorer);
   lobby.positionPanels();
   const boxes=[...document.querySelectorAll('.expedition-menu')].map(panel=>panel.getBoundingClientRect());
   assert('Four illustrated player menus stay inside the viewport',boxes.length===4&&boxes.every(box=>box.left>=0&&box.top>=0&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1));
   assert('Four player menus retain individually visible Accept controls',[...document.querySelectorAll('.expedition-menu')].every(panel=>panel.querySelector('.expedition-accept').getBoundingClientRect().height>0));
   const compact=lobby.nodes.get(player.id);
   compact.querySelector('.expedition-classic').click();
   const [firstMap,secondMap]=compact.querySelectorAll('.expedition-map');
   const focus=()=>compact.querySelectorAll('button')[lobby.state.members.get(player.id).focus];
   firstMap.click();lobby.navigate(player,{x:1});
   assert('Controller reaches the next map in the four-player gallery',focus()===secondMap);
   lobby.navigate(player,{x:-1});
   assert('Controller returns to the nearest map on the left',focus()===firstMap);
   for(const explorer of game.players)lobby.close(explorer);
   game.players=[player];lobby.sync();
   wildboundPolishTest.pause();
   const camp=document.querySelector('#settings-dialog'),actions=document.querySelector('#camp-session-actions');
   assert('Pause opens the portrait Camp Settings directly',camp.open&&camp.dataset.pauseMenu==='true'&&getComputedStyle(document.querySelector('#pause-dialog')).opacity==='0');
   assert('Camp retains the three illustrated tabs and its previous Done control',camp.querySelectorAll('[role=tab]').length===3&&camp.querySelector('#close-settings').textContent.includes('DONE'));
   assert('Camp shows prior Lobby actions and retains both continuation options',!actions.hidden&&actions.querySelector('summary').textContent==='Lobby actions'&&!!actions.querySelector('#pause-continue-expedition')&&!!actions.querySelector('#pause-continue-wilds'));
   actions.open=true;
   assert('Pause retains save, recovery, developer, World and encounter controls',['progress-save-now','progress-save-status','recover-ground','pause-dev','pause-worlds','pause-last-encounter'].every(id=>actions.querySelector('#'+id)));
  })()`);
  await capture('lobby-camp','#settings-dialog');
  await run(`(()=>{
   const {ctx,assert,game}=menuArtQa;
   document.querySelector('#close-settings').click();
   assert('Done resumes immediately',!ctx.paused&&!document.querySelector('#settings-dialog').open);
   game.phase='play';ctx.show('play');wildboundPolishTest.pause();
   const actions=document.querySelector('#camp-session-actions');
   assert('Expedition opens the same Camp with context-specific actions',actions.querySelector('summary').textContent==='Expedition actions'&&!actions.querySelector('#recover-ground').hidden&&actions.querySelector('#pause-continue-wilds').hidden);
   actions.open=true;
  })()`);
  await capture('expedition-camp','#settings-dialog');
  const checks=await run('menuArtQa.checks');
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({checks,rendererErrors:errors},null,2));
  console.log(JSON.stringify({checks:checks.length,rendererErrors:errors,output}));
  app.exit(0);
 }catch(error){console.error(error.stack,errors);app.exit(1);}
});
