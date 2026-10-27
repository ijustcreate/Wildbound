const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output','chat-transfer');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1000,height:780,useContentSize:true,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);win.showInactive();
 const errors=[];win.webContents.on('console-message',(_e,level,message)=>{if(level===3){errors.push(message);console.error('Renderer:',message);}});
 await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const report=[];
 for(const [width,height]of [[1280,850],[1000,700]]){
  win.setContentSize(width,height);
  await win.webContents.executeJavaScript(`document.getElementById('settings-button').click()`);
  await new Promise(r=>setTimeout(r,150));
  report.push(await win.webContents.executeJavaScript(`(()=>{const d=document.querySelector('#settings-dialog'),r=d.getBoundingClientRect();const bad=[...d.querySelectorAll('#settings-display input,#settings-display select,#settings-display button,#close-settings')].filter(e=>e.checkVisibility()&&!e.closest('details:not([open])')).filter(e=>{const b=e.getBoundingClientRect();return b.bottom>r.bottom||b.top<r.top});if(bad.length||d.scrollHeight>d.clientHeight+2)throw Error('Settings overflow '+bad.map(e=>e.id||e.textContent));return {viewport:[innerWidth,innerHeight],settings:[r.width,r.height],scroll:d.scrollHeight-d.clientHeight};})()`));
  fs.writeFileSync(path.join(out,`settings-${width}.png`),(await win.webContents.capturePage()).toPNG());
  await win.webContents.executeJavaScript(`document.querySelector('#close-settings').click()`);
 }
 report.push(await win.webContents.executeJavaScript(`(()=>{const q=window.previewCharacterSelect();q.lobby.open(q.first,'choose');const p=q.lobby.nodes.get(q.first.id);window.chatLobbyQA=q;return {chooser:p.textContent,animated:!!p._idlePreview};})()`));
 report.push(await win.webContents.executeJavaScript(`(()=>{const q=window.chatLobbyQA,s=q.lobby.state.members.get(q.first.id);s.panel='create';q.lobby.renderPanel(q.first);const p=q.lobby.nodes.get(q.first.id),c=p.querySelector('.creation-preview-row canvas');return {creator:p.textContent,preview:[c.clientWidth,c.clientHeight],colors:p.querySelectorAll('.creation-colors button').length};})()`));
 await win.webContents.executeJavaScript(`(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const q=window.chatLobbyQA,p=q.lobby.nodes.get(q.first.id);document.body.append(p);Object.assign(p.style,{position:'fixed',left:'20px',top:'20px',zIndex:99999,transform:'none',maxHeight:'calc(100vh - 40px)'});})()`);
 await new Promise(r=>setTimeout(r,300));fs.writeFileSync(path.join(out,'creator.png'),(await win.webContents.capturePage()).toPNG());
 report.push(await win.webContents.executeJavaScript(`(async()=>{const {playerMotion,playerPose,drawPlayer,directionVector}=await import('./src/player-motion.mjs');const c=document.createElement('canvas');c.width=960;c.height=600;const g=c.getContext('2d');g.fillStyle='#132b24';g.fillRect(0,0,960,600);for(const [i,action]of ['idle','run','swim','cast','death'].entries())for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d);g.save();g.translate(60+d*120,115+i*115);g.scale(2.5,2.5);drawPlayer(g,{faceX,faceY,hp:100,animationAction:action,equipment:{head:'ranger_hood'}},.4,playerMotion);g.restore();}return {stance:playerMotion.relaxedStanceRevision,swim:playerMotion.breaststrokeRevision,picture:c.toDataURL()};})()`));
 const last=report.at(-1);fs.writeFileSync(path.join(out,'poses.png'),Buffer.from(last.picture.split(',')[1],'base64'));delete last.picture;
 report.push(await win.webContents.executeJavaScript(`(()=>{const q=window.chatLobbyQA,s=q.lobby.state.members.get(q.first.id);s.panel='choose';q.lobby.renderPanel(q.first);const p=q.lobby.nodes.get(q.first.id),c=p._idlePreview.canvas;q.lobby.paintIdlePreview(p,0);const a=c.toDataURL();q.lobby.paintIdlePreview(p,.5);if(c.toDataURL()===a)throw Error('Chooser preview is static');[...p.querySelectorAll('button')].find(b=>b.textContent==='Drop from game').click();if(q.game.players.some(p=>p.id===q.first.id)||q.lobby.state.members.has(q.first.id))throw Error('Drop did not remove player');return {idleAnimation:true,dropFromGame:true};})()`));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({report,errors},null,2));console.log(JSON.stringify({report,errors}));app.exit(errors.length?1:0);
}).catch(async e=>{console.error(e);const w=BrowserWindow.getAllWindows()[0];if(w){console.log(await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('#settings-dialog');return [...d.querySelectorAll('.settings-heading,.settings-panels,.settings-panel,.settings-card,#close-settings')].map(e=>({id:e.id,cls:e.className,height:e.clientHeight,scroll:e.scrollHeight,display:getComputedStyle(e).display})).concat([{dialog:d.clientHeight,scroll:d.scrollHeight}]);})()`));fs.writeFileSync(path.join(out,'error.png'),(await w.webContents.capturePage()).toPNG());}app.exit(1);});
