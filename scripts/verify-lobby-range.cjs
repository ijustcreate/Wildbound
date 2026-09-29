const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'range-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false});await win.loadFile(path.join(root,'index.html'));
 const png=await win.webContents.executeJavaScript(`(async()=>{
 const {Game}=await import('./src/core.mjs');const {PlayableLobby}=await import('./src/playable-lobby.mjs');const g=new Game(),p=g.addPlayer('keyboard');p.profileId='test';
 const root=document.createElement('div');root.innerHTML='<div class="party-heading"><h1></h1></div><div class="party-help"></div><div id="player-slots"></div><div id="party-status"></div>';document.body.append(root);
 const lobby=new PlayableLobby({root,game:()=>g,profiles:{data:{heroes:[]}},start:()=>{},sound:()=>{}});lobby.state.sync(g.players);const s=lobby.state.members.get(p.id);Object.assign(s,{spawned:true,panel:null,x:930,y:365});
 lobby.update(.05,{keyboard:{interact:true}});if(!lobby.practice.targetsMoving||s.panel)throw Error('Lever did not start targets');lobby.update(.05,{keyboard:{interact:true}});if(!lobby.practice.targetsMoving)throw Error('Held button retriggered');lobby.update(.05,{});lobby.update(.05,{keyboard:{interact:true}});if(lobby.practice.targetsMoving)throw Error('Lever did not stop targets');
 Object.assign(s,{x:230,y:200});const a=lobby.practice.players[0];a.equipment.hand1='bow';Object.assign(a,{x:230,y:200,groundHeight:16,bowAiming:true,faceX:1,faceY:-.3});await lobby.difficultyArt.decode();lobby.draw();return lobby.canvas.toDataURL('image/png').split(',')[1];})()`);
 fs.writeFileSync(path.join(out,'lobby-range.png'),Buffer.from(png,'base64'));console.log('Lobby constructor, lever edges, target toggling and table-top rendering passed.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
