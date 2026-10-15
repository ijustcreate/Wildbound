const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'wing-shape-')));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{offscreen:true}}),errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
   const {drawSuccubus,succubusMotion}=await import('./src/succubus-motion.mjs');
   const {ITEMS}=await import('./src/items.mjs');const {detailedItemCanvas}=await import('./src/item-art.mjs');
   const before=JSON.stringify([playerMotion,succubusMotion]),sheet=document.createElement('canvas');sheet.width=1440;sheet.height=780;
   const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#1b2b2d';c.fillRect(0,0,1440,780);c.fillStyle='#e8d5a8';c.font='22px sans-serif';c.fillText('Upright bat wings and compact branching antlers',22,30);
   const wearer={appearance:{skin:'#d9ab76',hair:'crop',hairColor:'#33292e',shirt:'#39745b',pants:'#454d69',shoes:'#49372d'},equipment:{head:'keeper_crown',shoulders:'succubus_wings'},animationAction:'idle',playerFrame:0};
   const cases=[['Equipped / idle',wearer,drawPlayer,playerMotion],['Succubus / idle',{hp:180,animationAction:'idle',playerFrame:0},drawSuccubus,succubusMotion],['Succubus / flight',{hp:180,animationAction:'fly',playerFrame:2},drawSuccubus,succubusMotion]];
   cases.forEach(([label,actor,draw,model],row)=>{
    c.fillStyle='#e8d5a8';c.font='14px sans-serif';c.fillText(label,22,55+row*240);
    for(let d=0;d<8;d++){const [faceX,faceY]=directionVector(d);c.save();c.translate(90+d*180,250+row*240);c.scale(3.5,3.5);draw(c,{...actor,faceX,faceY},0,model);c.restore();}
   });
   const compare=document.createElement('canvas');compare.width=600;compare.height=330;const p=compare.getContext('2d');p.imageSmoothingEnabled=false;p.fillStyle='#1b2b2d';p.fillRect(0,0,600,330);
   for(const [i,shape]of ['scalloped','upright'].entries()){
    const original=ITEMS.succubus_wings.wingShape;
    try{ITEMS.succubus_wings.wingShape=shape;p.save();p.translate(150+i*300,270);p.scale(4.5,4.5);drawPlayer(p,{...wearer,faceX:0,faceY:1},0,playerMotion);p.restore();}
    finally{ITEMS.succubus_wings.wingShape=original;}
    p.fillStyle='#e8d5a8';p.font='16px sans-serif';p.fillText(i?'Corrected wings':'Original wing outline',75+i*300,315);
   }
   const corrected=document.createElement('canvas');corrected.width=360;corrected.height=350;const q=corrected.getContext('2d');q.imageSmoothingEnabled=false;q.fillStyle='#1b2b2d';q.fillRect(0,0,360,350);
   q.save();q.translate(180,300);q.scale(5,5);drawPlayer(q,{...wearer,faceX:0,faceY:1},0,playerMotion);q.restore();
   let poses=0;const scratch=document.createElement('canvas');scratch.width=scratch.height=384;const pen=scratch.getContext('2d');
   for(const action of ['idle','walk','fly','whip','kiss','death'])for(let d=0;d<8;d++)for(const frame of [0,2,4,6]){
    const [faceX,faceY]=directionVector(d);pen.clearRect(0,0,384,384);pen.save();pen.translate(192,240);pen.scale(3,3);drawSuccubus(pen,{hp:180,faceX,faceY,animationAction:action,playerFrame:frame},0,succubusMotion);pen.restore();poses++;
   }
   if(JSON.stringify([playerMotion,succubusMotion])!==before)throw Error('Wing drawing changed authored rigs');
   const icon=detailedItemCanvas('succubus_wings');
   return {sheet:sheet.toDataURL(),comparison:compare.toDataURL(),corrected:corrected.toDataURL(),icon:icon.toDataURL(),poses,rigUnchanged:true};
  })()`);
  for(const [key,name]of [['sheet','succubus-wings-eight-directions'],['comparison','succubus-wings-before-after'],['corrected','succubus-wings-corrected'],['icon','succubus-wings-icon']])fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(result[key].split(',')[1],'base64'));
  fs.writeFileSync(path.join(out,'succubus-wings-report.json'),JSON.stringify({poses:result.poses,rigUnchanged:true,rendererErrors:errors},null,2));
  if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({poses:result.poses,rigUnchanged:true,rendererErrors:errors}));app.exit(0);
 }catch(error){console.error(error.stack);app.exit(1);}
});
