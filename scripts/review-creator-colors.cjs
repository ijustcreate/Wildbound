const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output','creator-colors');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);const errors=[];
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 win.webContents.on('render-process-gone',(_,d)=>errors.push(JSON.stringify(d)));
 try{
  await win.loadURL('about:blank');win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Debugger.enable');
  await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.creatorContext=ctx,false)'});
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const ctx=creatorContext,g=ctx.game,l=ctx.playableLobby,checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   g.players=[];l.reset();ctx.show('lobby');ctx.paused=false;
   const pads=['Xbox Wireless Controller','Nintendo Switch Pro Controller'].map((id,index)=>({id,index,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}));
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});ctx.previousPads.clear();
   const heroes=pads.map(pad=>g.addPlayer('pad:'+pad.index));l.sync();
   const setup=()=>{for(const p of heroes){Object.assign(l.state.members.get(p.id),{panel:'create',focus:0});l.renderPanel(p);}l.positionPanels();return heroes.map(p=>l.nodes.get(p.id));};
   const step=()=>l.update(.02,ctx.inputFrame());
   const press=(i,key)=>{pads[i].buttons[key]={pressed:true,value:1};step();pads[i].buttons[key]={pressed:false,value:0};step();};
   const [a,b]=setup();step();window.creatorQA={ctx,g,l,checks,assert,pads,heroes,setup,step,press,a,b};
   assert(a.textContent.includes('A: choose')&&b.textContent.includes('B: choose'),'Xbox and Nintendo confirm labels');
   const {CREATION_COLORS}=await import('./src/creation-menu.mjs');
   const rgb=hex=>'rgb('+hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')+')';
   for(const label of ['Skin','Hair color','Shirt','Pants','Shoes']){
    const row=a.querySelector('[data-label="'+label+'"]');row.click();const colors=[...a.querySelectorAll('.creation-palette button')];
    for(const [i,[name,color]] of CREATION_COLORS.entries()){const c=colors[i];assert(getComputedStyle(c).backgroundColor===rgb(color)&&getComputedStyle(c).backgroundImage==='none',label+' shows '+name);c.focus();assert(getComputedStyle(c).backgroundColor===rgb(color),label+' focus preserves '+name);}
    assert(getComputedStyle(colors[15]).backgroundImage.includes('conic-gradient'),label+' custom spectrum visible');
    const other=JSON.stringify(l.state.members.get(heroes[1].id).creationLook);const current=colors.findIndex(b=>b.classList.contains('lobby-focus'));for(let i=0;i<current%4;i++)press(0,14);for(let i=Math.floor(current/4);i<2;i++)press(0,13);for(let i=Math.floor(current/4);i>2;i--)press(0,12);press(0,0);
    const key={Skin:'skin','Hair color':'hairColor',Shirt:'shirt',Pants:'pants',Shoes:'shoes'}[label];
    assert(l.state.members.get(heroes[0].id).creationLook[key]===CREATION_COLORS[8][1],label+' controller applies color');
    assert(!a.querySelector('.creation-popup')&&!a.querySelector('.creation-body').inert&&row.classList.contains('lobby-focus'),label+' returns focus');assert(JSON.stringify(l.state.members.get(heroes[1].id).creationLook)===other,label+' preserves other player');
   }
   const row=a.querySelector('[data-label="Shirt"]'),s=l.state.members.get(heroes[0].id),before=s.creationLook.shirt;
   row.click();a.querySelector('.creation-rainbow').click();const canvas=a.querySelector('.creation-wheel');assert(canvas.getContext('2d').getImageData(150,100,1,1).data[3]>0,'Spectrum canvas paints');
   press(0,15);press(0,2);press(0,14);press(0,0);press(0,0);assert(!a.querySelector('.creation-popup')&&s.creationLook.shirt!==before,'Custom spectrum brightness commits');
   const custom=s.creationLook.shirt;row.click();press(0,1);assert(s.creationLook.shirt===custom,'Cancel preserves custom color');
   row.click();a.querySelector('.creation-rainbow').click();press(0,1);assert(!!a.querySelector('.creation-palette'),'Spectrum Back returns to palette');press(0,1);
   assert(a.querySelectorAll('.creation-stage-turns button').length===2,'Two preview rotation controls');const art=a.querySelector('.creation-preview-stage canvas'),front=art.toDataURL();a.querySelector('[aria-label="Rotate character view"]').click();assert(art.toDataURL()!==front,'Rotation changes native character');a.querySelector('[aria-label="Rotate character view left"]').click();
   const plate=new Image();plate.src=new URL('./assets/ui/creation/forest-preview-v1.png',location.href).href;await plate.decode();assert(plate.naturalWidth>0,'Forest artwork loads');
   const {drawCreationPreview}=await import('./src/creation-preview.mjs');drawCreationPreview(art.getContext('2d'),s.creationLook,{width:art.width,height:art.height,scene:true,time:0});l.draw();return {checks:checks.length};
  })()`);
  const run=code=>win.webContents.executeJavaScript(code);
  const capture=async name=>{await new Promise(r=>setTimeout(r,200));await win.webContents.capturePage();fs.writeFileSync(path.join(out,name),(await win.webContents.capturePage()).toPNG());};
  await capture('forest-preview.png');await run('creatorQA.a.querySelector(\'[data-label="Skin"]\').click()');await capture('palette.png');await run('creatorQA.a.creationNavigate({back:true})');
  for(const [width,height]of [[780,600],[600,430]]){win.setContentSize(width,height);await new Promise(r=>setTimeout(r,120));await run(`(()=>{const{setup,assert,l}=creatorQA,[a,b]=setup();creatorQA.a=a;creatorQA.b=b;for(const panel of[a,b]){panel.querySelector('[data-label="Skin"]').click();const popup=panel.querySelector('.creation-popup'),r=popup.getBoundingClientRect();assert(popup.scrollWidth<=popup.clientWidth+1,'No horizontal overflow ${width}');for(const button of popup.querySelectorAll('button')){const q=button.getBoundingClientRect();assert(q.top>=r.top&&q.bottom<=r.bottom+1,'Palette control fits ${width} '+button.ariaLabel);}panel.creationNavigate({back:true});}l.draw();})()`);await capture('compact-'+width+'.png');}
  win.setContentSize(1280,850);await new Promise(r=>setTimeout(r,120));await run(`(()=>{const{ctx,g,l,heroes,assert,step,pads,press}=creatorQA;for(const[i,p]of heroes.entries()){ctx.profiles.assign(p,ctx.profiles.create('Preview '+i));l.close(p);Object.assign(l.state.members.get(p.id),{spawned:true,panel:null,x:i?600:300,y:350,panelInputRelease:false,inventoryRelease:false});}g.houseWorldsEnabled=true;l.open(heroes[0],'environment');l.positionPanels();const panel=l.nodes.get(heroes[0].id),pseudo=getComputedStyle(l.panels,'::before');assert(pseudo.content==='none'||pseudo.content==='normal','Expedition has no shared backdrop');assert(pseudo.backdropFilter==='none','Expedition has no shared blur');assert(!ctx.paused&&!document.querySelector('dialog[open]'),'Expedition does not pause');assert(panel.offsetWidth<l.canvas.getBoundingClientRect().width*.5,'Expedition occupies one rail');const member=l.state.members.get(heroes[1].id),before=member.x,draft=JSON.stringify(l.state.members.get(heroes[0].id).expeditionDraft);pads[1].axes[0]=1;for(let i=0;i<20;i++)step();pads[1].axes[0]=0;step();assert(member.x>before+10,'Second player moves with Expedition open');press(1,0);assert(JSON.stringify(l.state.members.get(heroes[0].id).expeditionDraft)===draft,'Other controller preserves expedition draft');l.open(heroes[1],'dice-count');assert(l.nodes.has(heroes[0].id)&&l.nodes.has(heroes[1].id),'Second player opens own menu');const r=panel.getBoundingClientRect(),q=l.nodes.get(heroes[1].id).getBoundingClientRect();assert(r.right<=q.left||q.right<=r.left,'Independent menu rails');l.close(heroes[1]);ctx.renderRoster();l.draw();})()`);await capture('expedition-live-lobby.png');
  const checks=await run('creatorQA.checks');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,rendererErrors:errors,base,physicalControllersTested:false},null,2));
  console.log(JSON.stringify({checks:checks.length,rendererErrors:errors,base}));app.exit(errors.length?1:0);
 }catch(e){console.error(e);try{console.log(await win.webContents.executeJavaScript(`(()=>{const q=window.creatorQA;return q&&{players:q.g.players.map(p=>({id:p.id,device:p.device})),focus:[...q.a.querySelectorAll('.lobby-focus')].map(b=>b.ariaLabel),state:q.l.state.members.get(q.heroes[0].id),paused:q.ctx.paused}})()`));}catch{}app.exit(1);}
});
