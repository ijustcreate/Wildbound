const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'test-output/blaise-compact-pass');
const phase=process.argv.includes('--before')?'before':'after';
fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-blaise-compact-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);const errors=[];
 win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message)});
 try{
  await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,r)=>setTimeout(()=>r(Error('boot timeout')),30000))])`);
  const refs=['front','side','rear','opposite-side'].map(v=>fs.readFileSync(path.join(root,`test-output/modelviewer-references/204217-blaise-${v}-idle.png`)).toString('base64'));
  const before=phase==='after'?fs.readFileSync(path.join(out,'before.png')).toString('base64'):null;
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {CREATURE_PACK}=await import('./src/creature-packs/constructs.mjs');
   const {Animator}=await import('./src/animation.mjs');
   const {Assets}=await import('./src/assets.mjs');
   const {drawBush,drawStump}=await import('./src/forest.mjs');
   const {actorRenderSize}=await import('./src/render-settings.mjs');
   const assets=new Assets();await assets.load();const animator=new Animator(assets);
   const subject=CREATURE_PACK.subjects.blaise,model=subject.defaults(),dirs=['S','SW','W','NW','N','NE','E','SE'];
   const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').imageSmoothingEnabled=false;return c};
   const canvas=make(1792,340),c=canvas.getContext('2d');
   c.fillStyle='#153329';c.fillRect(0,0,1792,340);c.fillStyle='#eadbb5';c.font='bold 16px system-ui';c.fillText('${phase.toUpperCase()} · BLAISE · UNAPPROVED · identical idle pose and lighting',14,24);
   c.font='11px system-ui';c.fillText('GAMEPLAY · Animator.draw at actorRenderSize = 47 · real forest bush/stump for pixel-density comparison',14,43);
   for(let d=0;d<8;d++){
    const a=d*Math.PI/4,x=112+d*224,actor={id:'blaise-review-'+d,kind:'blaise',sprite:'blaise',skin:'blaise',x,y:123,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',poseFrame:0,playerFrame:0,moving:false,aggro:false,hp:100,maxHp:100,equipment:{},inventory:[]};
    c.fillStyle='#204533';c.fillRect(x-110,62,220,82);
    drawBush(c,{x:x-46,y:117,size:22},0);drawStump(c,{x:x+47,y:118,size:18});
    animator.draw(c,actor,0,actorRenderSize(actor));
    c.fillStyle='#d8cdae';c.textAlign='center';c.fillText(dirs[d],x,59);
    // Draw once at native logical resolution, enlarge the raster by an integer.
    const tile=make(112,64),t=tile.getContext('2d');t.translate(56,54);subject.draw(t,{...actor,x:0,y:0},0,model);
    c.drawImage(tile,x-112,178,224,128);
   }
   c.textAlign='left';c.fillStyle='#d8cdae';c.fillText('2× nearest-neighbor detail',14,154);
   const actions=['idle','walk','run','attack','special','death'],cycle=make(1792,actions.length*4*72+35),cc=cycle.getContext('2d');cc.fillStyle='#153329';cc.fillRect(0,0,cycle.width,cycle.height);cc.fillStyle='#eadbb5';cc.font='12px system-ui';cc.fillText('AFTER · 4 phases × 8 facings · existing native clips unchanged',12,22);
   for(let ai=0;ai<actions.length;ai++)for(let f=0;f<4;f++){
    const action=actions[ai],frame=Math.round(f*(model.clips[action].length-1)/3),y=35+(ai*4+f)*72;
    cc.fillStyle='#adc7b1';cc.font='10px system-ui';cc.fillText(action+' '+frame,2,y+12);
    for(let d=0;d<8;d++){const a=d*Math.PI/4;cc.save();cc.translate(112+d*224,y+62);subject.draw(cc,{kind:'blaise',x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),animationAction:action,poseFrame:frame,moving:action==='run'||action==='walk'},0,model);cc.restore()}
   }
   let card=null;
   if(${JSON.stringify(before)}!==null){
    const board=make(1792,990),bc=board.getContext('2d');bc.fillStyle='#10271f';bc.fillRect(0,0,board.width,board.height);bc.fillStyle='#eadbb5';bc.font='bold 18px system-ui';bc.fillText('BLAISE · REFERENCE / BEFORE / AFTER · DRAFT FOR REVIEW',14,25);
    const names=['FRONT','SIDE','REAR','OTHER SIDE'];
    for(let i=0;i<4;i++){const im=new Image();im.src='data:image/png;base64,'+${JSON.stringify(refs)}[i];await im.decode();bc.drawImage(im,275,55,340,390,150+i*420,47,184,211);bc.font='11px system-ui';bc.fillText('REFERENCE · '+names[i],150+i*420,277)}
    bc.fillStyle='#adc7b1';bc.fillText('Four captured model angles; diagonal reference captures unavailable. Borrow compact flame body and lowered arms, preserve native rig.',14,299);
    const old=new Image();old.src='data:image/png;base64,'+${JSON.stringify(before)};await old.decode();bc.drawImage(old,0,310);bc.drawImage(canvas,0,650);card=board.toDataURL('image/png').split(',')[1];
   }
   return {png:canvas.toDataURL('image/png').split(',')[1],cycle:cycle.toDataURL('image/png').split(',')[1],card,model,directions:dirs};
  })()`);
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(out,phase+'.png'),Buffer.from(result.png,'base64'));
  if(phase==='before')fs.writeFileSync(path.join(out,'before-model.json'),JSON.stringify(result.model,null,2));
  else{
   const old=JSON.parse(fs.readFileSync(path.join(out,'before-model.json'),'utf8'));
   for(const key of ['joints','clips','shape','palette','visibility'])if(JSON.stringify(old[key])!==JSON.stringify(result.model[key]))throw Error('Unexpected model change: '+key);
   fs.writeFileSync(path.join(out,'reference-before-after.png'),Buffer.from(result.card,'base64'));
   fs.writeFileSync(path.join(out,'motion-8-views.png'),Buffer.from(result.cycle,'base64'));
  }
  const report={phase,artStatus:'unapproved',audioMuted:win.webContents.isAudioMuted(),rendererErrors:errors,facings:result.directions,renderer:'actual Animator.draw, actorRenderSize 47; subject.draw 2x nearest neighbor detail',rigClipsPaletteShapeVisibilityUnchanged:phase==='after',source:'modified working tree; no packaging'};
  fs.writeFileSync(path.join(out,phase+'-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,...report}));
 }catch(e){console.error(e.stack||e);process.exitCode=1}finally{win.destroy();app.quit()}
});

