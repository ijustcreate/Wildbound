const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'settings-')));
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:820,height:680,webPreferences:{backgroundThrottling:false}});
 win.webContents.on('console-message',(_e,_level,message)=>console.log(message));
 await win.loadFile(path.join(root,'index.html'));
 await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const assert=(v,m)=>{if(!v)throw Error(m);};
  const wait=()=>new Promise(r=>setTimeout(r,600));
  const $=s=>document.querySelector(s),dialog=$('#settings-dialog');
  assert(getComputedStyle(dialog).display==='none','Closed settings visible');
  $('#settings-button').click();
  for(const id of ['display','explorer','controls']){
   $('[data-settings-tab="'+id+'"]').click();
   const visible=[...dialog.querySelectorAll('[data-settings-panel]')].filter(p=>p.getClientRects().length);
   assert(visible.length===1&&visible[0].dataset.settingsPanel===id,'Panels overlap: '+id);
   assert($('.settings-panels').scrollTop===0,'Tab did not reset scroll');
  }
  $('[data-settings-tab="display"]').click();
  const plays=[],pauses=[];
  const nativePlay=HTMLMediaElement.prototype.play,nativePause=HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.play=function(){plays.push(this);return Promise.resolve();};
  HTMLMediaElement.prototype.pause=function(){pauses.push(this);};
  try{
   window.dispatchEvent(new Event('pointerdown'));await wait();
   const lobby=plays.at(-1),src=lobby.src;
   const picker=$('.music-picker');picker.open=true;await wait();
   const sample=$('[data-track="village-gate"]');sample.focus();sample.dispatchEvent(new PointerEvent('pointerenter'));await wait();
   const preview=plays.find(p=>p!==lobby&&p.src.endsWith('beyond-the-village-gate.mp3'));
   assert(preview,'Wrong preview: '+JSON.stringify(plays.map(p=>p.src))+' open='+picker.open+' focus='+document.activeElement.outerHTML+' status='+$('#music-status').textContent+' rect='+sample.getClientRects().length);
   assert(lobby.src===src&&lobby.volume<preview.volume*.3,'Lobby not ducked');
   picker.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait();
   assert(!picker.open&&pauses.includes(preview)&&preview.volume===0,'Preview did not stop');
   assert(lobby.src===src&&lobby.volume>.3,'Lobby not restored');
   picker.open=true;await wait();sample.focus();await wait();sample.click();await wait();
   assert(localStorage.getItem('wildbound-level-music')==='village-gate'&&!picker.open,'Track not saved');
   picker.open=true;await wait();sample.focus();await wait();
   $('[data-settings-tab="controls"]').click();await wait();assert(!picker.open&&preview.volume===0,'Tab switch left preview playing');
   $('[data-settings-tab="display"]').click();picker.open=true;await wait();sample.focus();await wait();
   $('#close-settings').click();await wait();assert(!picker.open&&preview.volume===0,'Dialog close left preview playing');
  }finally{HTMLMediaElement.prototype.play=nativePlay;HTMLMediaElement.prototype.pause=nativePause;}
  $('#settings-button').click();await wait();
  return {tabs:3,preview:true,ducking:true,restore:true,selection:true};
 })()`);
 await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 fs.writeFileSync(path.join(out,'settings-layout.png'),(await win.webContents.capturePage()).toPNG());
 console.log(JSON.stringify(result));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
