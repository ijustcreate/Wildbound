const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/polish');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});w.webContents.setAudioMuted(true);
 const errors=[];w.webContents.on('console-message',(_e,level,m)=>{if(level>=3&&!m.includes('Autofill'))errors.push(m);});
 try{
  await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
    const assert=(value,msg)=>{if(!value)throw Error(msg)};
    const {Game,EVENTS}=await import('./src/core.mjs'),{ENCOUNTER_CUES}=await import('./src/encounter-cues.mjs');
    const {RIG_SUBJECTS}=await import('./src/rig-subjects.mjs'),{Animator}=await import('./src/animation.mjs');
    const {loadHumanoidArt}=await import('./src/humanoid-hd.mjs');await loadHumanoidArt();
    const {Renderer}=await import('./src/render.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{FieldKit}=await import('./src/field-kit.mjs');
    const {saveSession,restoreSession}=await import('./src/session.mjs');
    const {trialSummary,defeatTrialMember}=await import('./src/expedition-trials.mjs');
    const {vendingStock}=await import('./src/shops.mjs'),{beginHouseWorldTravel,tickHouseWorldTravel}=await import('./src/house-worlds.mjs');
    const context=new OfflineAudioContext(1,22050,22050);let decoded=0;
    for(const cue of Object.values(ENCOUNTER_CUES)){const response=await fetch(cue.files[0]);assert(response.ok,'Missing '+cue.files[0]);const buffer=await context.decodeAudioData(await response.arrayBuffer());assert(buffer.duration>.5&&buffer.duration<=2.6,'Bad cue duration');decoded++;}
    const g=new Game(()=>.5);g.houseWorldsEnabled=true;g.addPlayer('keyboard','Review explorer');g.start();g.openingBoard=false;g.persist=()=>{};g.onSound=()=>{};
    const p=g.players[0];g.spawnEvent(0);for(const e of g.enemies.filter(e=>e.trialId)){e.hp=0;defeatTrialMember(g,e);}
    const score=trialSummary(g).score;g.houseWorlds.bag=['forest'];
    assert(beginHouseWorldTravel(g,5),'Travel start failed');for(let n=0;n<200&&g.worldTravel;n++){await new Promise(r=>setTimeout(r,20));tickHouseWorldTravel(g,.05,{});}assert(!g.worldTravel,'Travel failed');assert(trialSummary(g).score===score,'Travel lost trial credit');
    const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert(trialSummary(restored).score===score,'Save lost trial credit');
    const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=900;document.body.append(canvas);
    const renderer=new Renderer(canvas,{});renderer.draw(g,.016);assert(canvas.getContext('2d').getImageData(0,0,1280,900).data.some((v,i)=>i%4===3&&v),'Blank game');
    const frame=canvas.toDataURL();
    const animator=new Animator({}),names=Object.keys(RIG_SUBJECTS),grid=document.createElement('canvas');grid.width=1024;grid.height=names.length*112;
    const c=grid.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;c.fillStyle='#172d28';c.fillRect(0,0,grid.width,grid.height);let rendered=0;
    for(const [row,name]of names.entries()){
      c.fillStyle='#eddbad';c.font='12px monospace';c.fillText(name,8,row*112+15);
      for(let d=0;d<8;d++){const x=d*128+64,y=row*112+91;c.save();c.translate(x,y);c.scale(2,2);
        const subject=RIG_SUBJECTS[name];animator.draw(c,{kind:name,sprite:subject.sprite,x:0,y:0,hp:100,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction:'idle',playerFrame:0,villagerId:name==='villager'?'april':undefined,equipment:{},appearance:{hair:'crop',hairColor:'#593923',skin:'#d3a079',shirt:'#568778',pants:'#334e58'}},0,48);c.restore();rendered++;
      }
    }
    const gallery=grid.toDataURL();
    const uiRoot=document.createElement('div');uiRoot.id='polish-ui';document.body.append(uiRoot);const ui=new HeroUI(uiRoot);g.portals.push({id:987654,owner:p.id,x:p.x,y:p.y,closing:null});p.room=987654;p.roomX=160;p.roomY=140;p.vendingStock=vendingStock();p.coins=100;g.openShop(p,'vending');ui.draw(g,renderer);
    assert(uiRoot.textContent.includes('Expedition essentials'),'Vending title');assert(uiRoot.textContent.includes('×8'),'Arrow bundle label');
    const catalog=uiRoot.innerHTML;
    p.ui=null;p.room=null;p.level=4;p.field.trainingVersion=1;p.field.trainingPoints=3;p.field.skillScrolls={long_jump:true};
    const kit=new FieldKit({game:()=>g,profiles:{},metrics:{},mapping:{},onPause:()=>{},onResume:()=>{}});kit.tab='Skills';kit.open(p);assert(kit.dialog.textContent.includes('Training Points: 3'),'Training UI');kit.close();
    g.completeVictory();g.openInventory(p,'victory');ui.draw(g,renderer);assert(uiRoot.textContent.includes('trials cleared'),'Victory debrief');p.inventory=[{type:'trial_letter',qty:1}];p.ui=null;g.openInventory(p);p.ui.panel='pack';p.ui.index=0;ui.draw(g,renderer);const read=uiRoot.querySelector('[data-action="use"]');assert(read&&!read.disabled&&read.textContent.includes('Read'),'Read button');read.click();assert(p.ui.notice.includes('The dice may hurry'),'Letter read');
    return {report:{decoded,rigs:names.length,directions:rendered,trialTravel:true,trialSave:true,vendingBundles:true,trainingUI:true,victoryDebrief:true,letterRead:true,muted:true},gallery,frame,catalog};
  })()`);
  fs.writeFileSync(path.join(out,'rig-review.png'),Buffer.from(result.gallery.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'runtime.png'),Buffer.from(result.frame.split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'vending.html'),'<meta charset="utf-8">'+result.catalog);
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({...result.report,errors},null,2));console.log(JSON.stringify(result.report));app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1);}
});
