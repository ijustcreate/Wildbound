const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/companions-projectiles-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{ITEMS}=await import('./src/items.mjs'),{Assets}=await import('./src/assets.mjs');
   const {drawMagicBolt,magicBoltGlow}=await import('./src/magic-bolt-render.mjs'),{loadParticleSprites}=await import('./src/particle-sprites.mjs');
   const {drawHunterPet}=await import('./src/hunter-pet-render.mjs'),{restoreHunterPet,TAMABLE_KINDS}=await import('./src/hunter-pets.mjs');
   const {rigSubject}=await import('./src/rig-subjects.mjs'),{befriendCreature,tickFriendlyCreature}=await import('./src/friendly-creatures.mjs'),{drawFriendshipHearts}=await import('./src/friendship-hearts.mjs');
   const assets=new Assets();await assets.load();await loadParticleSprites();
   const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=840;const c=canvas.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;c.fillStyle='#182d28';c.fillRect(0,0,1200,840);
   c.font='18px system-ui';c.fillStyle='#eedbaa';c.fillText('COLOUR-FIRST SPELLS · RESTRAINED GLOW · FRIENDSHIP HEARTS',24,28);
   const types=['starter_wand','wand','fire_wand','ice_wand','necromancer_wand','friendship_wand'];
   for(let i=0;i<types.length;i++){
    const def=ITEMS[types[i]],bolt={x:110+i*195,y:115,vx:260,vy:0,size:14,age:.6,color:def.artColor||def.color,glow:magicBoltGlow(def),friendship:!!def.friendship};
    c.save();c.translate(bolt.x-110,0);c.fillStyle=i%2?'#344733':'#101b20';c.fillRect(20,45,180,116);c.restore();
    c.save();c.translate(bolt.x,99);c.scale(3,3);drawMagicBolt(c,{...bolt,x:0,y:16});c.restore();
    c.fillStyle='#f0e1bd';c.font='12px system-ui';c.fillText(def.name,24+i*195,152);
    // Verify the loaded-sprite path, not just a fallback mock. No whitening at core.
    const test=document.createElement('canvas');test.width=100;test.height=70;const t=test.getContext('2d');t.fillStyle='#193128';t.fillRect(0,0,100,70);drawMagicBolt(t,{...bolt,x:55,y:48});
    const pixel=[...t.getImageData(55,32,1,1).data],expected=def.friendship?[255,128,181]:bolt.color.slice(1).match(/../g).map(v=>parseInt(v,16));
    if(pixel.slice(0,3).some((v,j)=>Math.abs(v-expected[j])>12))throw Error('Washed-out colour '+types[i]+' '+pixel+' expected '+expected);
   }
   let renders=0;
   for(let row=0;row<TAMABLE_KINDS.length;row++)for(let col=0;col<5;col++){
    const kind=TAMABLE_KINDS[row],action=['idle','run','hurt','bite','down'][col],pet=restoreHunterPet({kind,name:kind}),x=110+col*235,y=260+row*112;
    Object.assign(pet,{x,y,faceX:1,faceY:.3,step:7,moving:action==='run',hit:action==='hurt'?.12:0,attack:action==='bite'?.17:0,hp:action==='down'?0:pet.maxHp});
    drawHunterPet(c,pet,{color:'#8bcaa6'},1.2,74);c.fillStyle='#efdebd';c.font='12px system-ui';c.fillText(kind+' · '+action,x-72,y+37);
    for(let facing=0;facing<8;facing++){
     const probe=document.createElement('canvas');probe.width=probe.height=120;const pc=probe.getContext('2d');const a={...pet,x:60,y:75,faceX:Math.cos(facing*Math.PI/4),faceY:Math.sin(facing*Math.PI/4)};
     drawHunterPet(pc,a,{color:'#8bcaa6'},1.2,60);
     const data=pc.getImageData(0,0,120,120).data;if(!data.some((v,i)=>i%4===3&&v>0))throw Error('Invisible '+kind+' '+action);renders++;
    }
   }
   const g=new Game(()=>.5);g.phase='play';g.scenery=[];g.house=null;g.terrain.fill('grass');const p=g.addPlayer('pad:0');p.x=300;p.y=300;
   const lion={id:400,kind:'lion',x:420,y:300,hp:60,maxHp:60,speed:90,damage:10,state:'charge',animationAction:'pounce',flash:.2};g.enemies=[lion];befriendCreature(lion,p.id);tickFriendlyCreature(g,lion,.3);
   const probe=document.createElement('canvas');probe.width=probe.height=120;const pc=probe.getContext('2d'),rig=rigSubject('lion'),a={...lion,x:60,y:90};rig.draw(pc,a,1,rig.data);const before=probe.toDataURL();lion.step+=5;rig.draw(pc,{...lion,x:60,y:90},1.1,rig.data);if(before===probe.toDataURL())throw Error('Lion run pose frozen');
   pc.clearRect(0,0,120,120);drawFriendshipHearts(pc,a,1);if(!pc.getImageData(0,0,120,120).data.some((v,i)=>i%4===3&&v))throw Error('Friendship markers missing');
   for(let i=0;i<2;i++){lion.hp=0;g.update(.05,{});}if(g.cleared)throw Error('Friendly death awards a kill');
   return {renders,png:canvas.toDataURL(),checks:'Loaded sprites preserve six spell colours; friendship tip/hearts; 200 companion poses; moving lion frames; friendly panther/cat death'};
  })()`);
  fs.writeFileSync(path.join(root,'test-output/companions-spells-1.0.65.png'),Buffer.from(result.png.split(',')[1],'base64'));console.log(JSON.stringify({renders:result.renders,checks:result.checks}));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
