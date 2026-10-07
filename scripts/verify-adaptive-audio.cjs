// Isolated source QA. Launch via Node spawnSync with the supplied Electron binary.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
const base=process.env.WILDBOUND_VERIFY_APP||root;
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'adaptive-audio-profile-')));
app.disableHardwareAcceleration();app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
app.commandLine.appendSwitch('disable-renderer-backgrounding');app.commandLine.appendSwitch('disable-background-timer-throttling');
app.whenReady().then(async()=>{
 const deadline=setTimeout(()=>{console.error('Adaptive audio QA timed out',JSON.stringify(errors));app.exit(1);},85000);
 const win=new BrowserWindow({show:false,width:1000,height:760,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);const errors=[];
 win.webContents.on('console-message',(_event,level,message)=>{if(typeof level==='object'){message=level.message;level=level.level;}if(level==='error'||level===3){errors.push(message);console.error('Renderer:',message);}});
 const run=source=>win.webContents.executeJavaScript(`(async()=>{${source}})()`);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 let mediaHookReady;
 win.webContents.on('dom-ready',()=>{mediaHookReady=run(`if(!window.__qaMedia){window.__qaMedia=new Set();const qaPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__qaMedia.add(this);return qaPlay.call(this);};}`);});
 try{
  // Observe autoplay from the first document frame, not after the slow decode audit.
  console.log('Adaptive audio QA: loading '+base);await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});console.log('Adaptive audio QA: document loaded');await mediaHookReady;await run('await window.wildboundBoot.ready;');console.log('Adaptive audio QA: app booted');
  const audit=process.argv.includes('--reuse-audit')?JSON.parse(fs.readFileSync(path.join(out,'adaptive-music-audit.json'),'utf8')):await run(`
   const {MUSIC_TRACKS}=await import('./src/music.mjs'),ctx=new AudioContext(),rows=[];
   for(const track of MUSIC_TRACKS){
    const response=await fetch(track.file),bytes=await response.arrayBuffer(),b=await ctx.decodeAudioData(bytes.slice(0));
    let peak=0,sum=0,count=0;const windows=[];
    for(let start=0;start<b.length;start+=b.sampleRate){let energy=0,n=0;
     for(let c=0;c<b.numberOfChannels;c++){const data=b.getChannelData(c);for(let i=start;i<Math.min(b.length,start+b.sampleRate);i+=16){const v=data[i];peak=Math.max(peak,Math.abs(v));sum+=v*v;count++;energy+=v*v;n++;}}
     windows.push(Math.sqrt(energy/n));
    }
    const db=v=>Math.round(20*Math.log10(Math.max(v,1e-8))*10)/10,sorted=windows.slice().sort((a,b)=>a-b);
    rows.push({id:track.id,bytes:bytes.byteLength,duration:Math.round(b.duration*100)/100,sampleRate:b.sampleRate,channels:b.numberOfChannels,sampledPeakDb:db(peak),sampledRmsDb:db(Math.sqrt(sum/count)),quietWindowDb:db(sorted[Math.floor(sorted.length*.1)]),loudWindowDb:db(sorted[Math.floor(sorted.length*.9)]),leadingWindowDb:db(windows[0]),trailingWindowDb:db(windows.at(-1))});
   }
   await ctx.close();return rows;
  `);
  fs.writeFileSync(path.join(out,'adaptive-music-audit.json'),JSON.stringify(audit,null,2));
  console.log('Adaptive audio QA: decoded '+audit.length+' tracks');
  const ui=await run(`
   const assert=(v,m)=>{if(!v)throw Error(m);},wait=ms=>new Promise(r=>setTimeout(r,ms)),$=s=>document.querySelector(s);
   const {Game}=await import('./src/core.mjs'),start=Game.prototype.start;
   Game.prototype.start=function(...args){window.__qaGame=this;if(window.__qaContext)this.environment=window.__qaContext;return start.apply(this,args);};
   window.dispatchEvent(new Event('pointerdown'));for(let i=0;i<40;i++){await wait(250);if([...window.__qaMedia].some(a=>a.src.endsWith('curious-groove.mp3')&&!a.paused&&a.currentTime>0&&a.volume>.3))break;}
   const lobby=[...window.__qaMedia].find(a=>a.src.endsWith('curious-groove.mp3'));
   assert(lobby&&!lobby.paused&&lobby.volume>.3&&lobby.currentTime>0,'Lobby media did not play/advance '+JSON.stringify([...window.__qaMedia].map(a=>({src:a.src,paused:a.paused,volume:a.volume,time:a.currentTime,ready:a.readyState,error:a.error?.message}))));
   $('#settings-button').click();const dialog=$('#settings-dialog'),select=$('#music-track');
   assert(dialog.open&&dialog.getBoundingClientRect().width>300,'Settings did not render');
   assert(select.value==='adaptive'&&select.options.length===13,'Adaptive/random/custom options missing');
   const picker=$('.music-picker');picker.open=true;await wait(200);const sample=$('[data-track="village-gate"]');sample.focus();sample.dispatchEvent(new PointerEvent('pointerenter'));await wait(750);
   const preview=[...window.__qaMedia].find(a=>a.src.endsWith('beyond-the-village-gate.mp3'));
   assert(preview&&!preview.paused&&preview.volume>.25&&lobby.volume<preview.volume*.3,'Native preview/duck failed');
   $('#sound-toggle').checked=false;$('#sound-toggle').dispatchEvent(new Event('change'));await wait(100);assert(preview.paused&&preview.volume===0,'Mute did not stop preview');
   $('#sound-toggle').checked=true;$('#sound-toggle').dispatchEvent(new Event('change'));await wait(650);assert(!preview.paused&&preview.volume>.25,'Unmute did not restore preview');
   picker.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(800);
   assert(!picker.open&&preview.paused&&preview.volume===0&&lobby.volume>.3,'Preview close/restore failed');
   picker.open=true;await wait(100);sample.focus();sample.click();assert(select.value==='village-gate'&&localStorage.getItem('wildbound-level-music')==='village-gate','Custom selection lost');
   $('#music-volume').value='0';$('#music-volume').dispatchEvent(new Event('input'));await wait(100);
   assert([...window.__qaMedia].every(a=>a.paused||a.volume===0),'Zero slider left audio active');
   $('#music-volume').value='.45';$('#music-volume').dispatchEvent(new Event('input'));await wait(650);assert(!lobby.paused&&lobby.volume>.3,'Music slider restore failed');
   $('#sound-toggle').checked=false;$('#sound-toggle').dispatchEvent(new Event('change'));await wait(100);assert([...window.__qaMedia].every(a=>a.paused||a.volume===0),'Mute left audible voice');
   $('#sound-toggle').checked=true;$('#sound-toggle').dispatchEvent(new Event('change'));await wait(650);assert(!lobby.paused,'Unmute did not resume');
   select.value='adaptive';select.dispatchEvent(new Event('change'));
   return {renderedSettings:true,options:select.options.length,nativePreview:true,duckRestore:true,customSelection:true,slider:true,mute:true};
  `);
  fs.writeFileSync(path.join(out,'adaptive-audio-settings.png'),(await win.webContents.capturePage()).toPNG());
  console.log('Adaptive audio QA: rendered controls passed');
  const rendered=[];
  for(const [context,source] of [['forest',`await window.showcase('game');`],['ice',`await window.expansionPreview('ice');`],['house',`await window.expansionPreview('house');`],['temple',`await window.templePreview('upper');`]]){
   await run(`window.__qaContext='${context}';${source}`);
   rendered.push(await run(`const {levelMusicPair}=await import('./src/music.mjs');const pair=levelMusicPair('${context}');let media;for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,250));media=[...window.__qaMedia].find(a=>a.src.endsWith(pair.calm.file.split('/').at(-1))&&!a.paused&&a.currentTime>0);if(media)break;}if(!media)throw Error('Rendered ${context} routing failed '+JSON.stringify({environment:window.__qaGame.environment,generated:window.__qaGame.generatedEnvironment,media:[...window.__qaMedia].map(a=>({src:a.src,paused:a.paused,time:a.currentTime,ready:a.readyState}))}));const canvas=document.querySelector('#game-canvas');if(canvas.getBoundingClientRect().width<100)throw Error('Game canvas hidden');return {context:'${context}',track:pair.calm.id,mediaTime:media.currentTime,canvas:[canvas.width,canvas.height]};`));
  }
  const combat=await run(`
   const assert=(v,m)=>{if(!v)throw Error(m);},wait=ms=>new Promise(r=>setTimeout(r,ms));
   window.__qaContext='forest';await window.showcase('game');const g=window.__qaGame;g.update=()=>{};g.phase='play';g.environment=g.generatedEnvironment='forest';g.openingBoard=false;
   const p=g.players[0];p.hp=100;p.room=null;p.x=800;p.y=800;
   const e=g.enemies.find(e=>e.hp>0)||{kind:'lion',id:99001,hp:100,maxHp:100,state:'hunt',faceX:1,faceY:0};g.enemies=[e];Object.assign(e,{x:900,y:800,hp:100,state:'hunt',aggro:true,moving:true,faction:'enemy'});
   document.querySelector('#pause-dialog').showModal();document.querySelector('#resume-button').click();
   await wait(2200);const {levelMusicPair}=await import('./src/music.mjs'),pair=levelMusicPair('forest');
   const calm=[...window.__qaMedia].find(a=>a.src.endsWith(pair.calm.file.split('/').at(-1))&&!a.paused),up=[...window.__qaMedia].find(a=>a.src.endsWith(pair.combat.file.split('/').at(-1))&&!a.paused);
   assert(calm&&up&&up.volume>.25&&calm.volume<.1,'Rendered combat mix failed');const times=[calm.currentTime,up.currentTime];
   for(let i=0;i<8;i++){e.aggro=i%2===0;e.moving=e.aggro;await wait(65);}
   assert(calm.currentTime>=times[0]&&up.currentTime>=times[1],'Rapid toggles restarted timelines');
   e.faction='ally';e.attack=1;for(let i=0;i<60;i++){await wait(250);if(calm.volume>.3&&up.volume<.025)break;}assert(calm.volume>.3&&up.volume<.025,'Friendly actor sustained combat '+JSON.stringify({calm:calm.volume,combat:up.volume,state:e.state,faction:e.faction}));
   return {nearbyCombat:true,rapidToggleContinuous:true,friendlyRelease:true,times:[calm.currentTime,up.currentTime]};
  `);
  const actual=await run(`
   const {GameAudio,AUDIO_LIMITS}=await import('./src/audio.mjs'),{CUES}=await import('./src/sound-bank.mjs'),audio=new GameAudio();audio.unlock();audio.listeners=[{x:100,y:100,hp:100}];
   const raw=await audio.buffer(CUES.grass.files[0]);if(!raw||raw.duration<=0)throw Error('CC0 footstep decode failed');
   const voices=await Promise.all(Array.from({length:40},(_,i)=>audio.play({...CUES.attack,key:'qa:'+i,cooldown:0,group:'qa',polyphony:24,priority:20},{x:100,y:100})));
   const peak=audio.voices.size;if(peak>AUDIO_LIMITS.voices||audio.pending.size)throw Error('Actual voice cap failed');
   await audio.play('hurt',{x:100,y:100});const critical=[...audio.voices].filter(s=>audio.voiceInfo.get(s)?.priority===85).length;if(!critical)throw Error('Critical cue starved');
   audio.enabled=false;audio.apply();await new Promise(r=>setTimeout(r,80));if(audio.voices.size||audio.pending.size)throw Error('Mute leaked decoded effects');
   await audio.ctx.close();return {decodedFootstep:raw.duration,peakVoices:peak,priority:critical,muteCleanup:true};
  `);
  const report={ui,rendered,combat,actual,auditTracks:audit.length,errors};
  fs.writeFileSync(path.join(out,'adaptive-audio-report.json'),JSON.stringify(report,null,2));
  if(errors.length)throw Error('Renderer errors: '+errors.join('\n'));
  console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error);fs.writeFileSync(path.join(out,'adaptive-audio-failure.json'),JSON.stringify({error:String(error),errors},null,2));app.exit(1);}
});
