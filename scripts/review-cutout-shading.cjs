const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','cutout-shading');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
 await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {drawPlayer,playerMotion,directionVector}=await import('./src/player-motion.mjs');
  const {DEFAULT_APPEARANCE}=await import('./src/appearance.mjs');
  const {loadHumanoidArt}=await import('./src/humanoid-hd.mjs');await loadHumanoidArt();
  const {ITEMS}=await import('./src/items.mjs');
  const cel=await import('./src/cel-shading.mjs');
  const {cutoutSurface}=await import('./src/cutout-art.mjs');
  const {Animator}=await import('./src/animation.mjs');
  let old=null;try{old=await import('./test-output/cel-shading-before.mjs');}catch{}
  const images=[],checks=[],modes=['Original','Shared-edge smoothing'];
  const hood=Object.keys(ITEMS).find(id=>/hood/.test(id));
  const rows=[{direction:5,label:'Back / touching cape, armor, hair and shoulder',equipment:{head:'banshee_hood',back:'banshee_quiver',cape:'banshee_cape',chest:'armor',shoulders:'banshee_shoulders',hand1:'sword',hand2:'shield'}},{direction:2,label:'Profile / face, ear, collar and equipment',equipment:{back:'leather_quiver',chest:'armor',shoulders:'shoulder_armor',hand1:'sword'}},{direction:0,label:'Front / face, eyes and shirt',equipment:{}}];
  const sheet=document.createElement('canvas');sheet.width=modes.length*400;sheet.height=rows.length*390+60;const sc=sheet.getContext('2d');sc.fillStyle='#12241e';sc.fillRect(0,0,sheet.width,sheet.height);
  modes.forEach((mode,i)=>{sc.fillStyle='#f4e4bd';sc.font='bold 22px Georgia';sc.fillText(mode,i*400+20,35);});
  const timings=[];
  for(let row=0;row<rows.length;row++)for(let col=0;col<modes.length;col++){
   const canvas=document.createElement('canvas');canvas.width=400;canvas.height=390;const c=canvas.getContext('2d');c.fillStyle='#747a76';c.fillRect(0,0,400,390);c.imageSmoothingEnabled=false;
   const art=document.createElement('canvas');art.width=400;art.height=390;const ac=art.getContext('2d');
   const [faceX,faceY]=directionVector(rows[row].direction);ac.save();ac.translate(200,330);ac.scale(6,6);drawPlayer(ac,{hp:100,faceX,faceY,appearance:DEFAULT_APPEARANCE,equipment:rows[row].equipment,inventory:[]},.12,playerMotion);ac.restore();c.drawImage(art,0,0);
   if(modes[col]==='Previous smoothing'){old.setCelShading(true);old.applyCelShading(c);}
   if(col===1){cel.setCelShading(true);const start=performance.now();const image=cutoutSurface(art,{pixelScale:6,outputScale:6});c.resetTransform();c.fillStyle='#747a76';c.fillRect(0,0,400,390);c.imageSmoothingEnabled=true;c.drawImage(image,0,0,400,390);timings.push(performance.now()-start);}
   sc.drawImage(canvas,col*400,row*390+60);if(col===modes.length-1)images.push({name:'cutout-'+row,png:canvas.toDataURL().split(',')[1]});
  }
  images.push({name:'comparison',png:sheet.toDataURL().split(',')[1]});
  const probe=document.createElement('canvas');probe.width=320;probe.height=240;const pc=probe.getContext('2d');
  pc.fillStyle='#208040';pc.fillRect(0,0,320,240);pc.fillStyle='#d8a56e';pc.fillRect(40,30,120,180);pc.fillStyle='#315f91';pc.fillRect(160,30,120,180);
  pc.fillStyle='#141c21';pc.fillRect(78,76,8,8);pc.fillRect(110,76,8,8);
  cel.setCelShading(false);const original=probe.toDataURL();if(cel.applyCelShading(pc)!==false||probe.toDataURL()!==original)throw Error('Off changed source');checks.push('Off retains exact original pixels');
  cel.setCelShading(true);cel.applyCelShading(pc,{pixelSize:6});const pixels=pc.getImageData(0,0,320,240).data;let cracks=0,transparent=0;
  for(let y=55;y<185;y++)for(let x=151;x<169;x++){const i=(y*320+x)*4;if(pixels[i+3]!==255)transparent++;if(pixels[i+1]>pixels[i]*1.5&&pixels[i+1]>pixels[i+2]*1.5)cracks++;}
  if(cracks||transparent)throw Error('Touching regions acquired a gap '+JSON.stringify({cracks,transparent}));checks.push('Touching color regions have zero background cracks or alpha holes');
  const eye=pc.getImageData(82,80,1,1).data,skin=pc.getImageData(90,100,1,1).data;
  if(eye[0]+eye[1]+eye[2]>(skin[0]+skin[1]+skin[2])*.65)throw Error('High contrast eye detail was erased');checks.push('High contrast eye detail survives simplification');
  images.push({name:'seam-probe',png:probe.toDataURL().split(',')[1]});
  const native=document.createElement('canvas');native.width=native.height=64;const nc=native.getContext('2d');nc.fillStyle='#d4aa75';nc.fillRect(8,8,24,48);nc.fillStyle='#367a70';nc.fillRect(32,8,24,48);
  const joined=cutoutSurface(native),jp=joined.getContext('2d').getImageData(0,0,joined.width,joined.height).data;let holes=0;
  for(let y=60;y<190;y++)for(let x=124;x<132;x++)if(jp[(y*joined.width+x)*4+3]<250)holes++;
  if(holes)throw Error('Native shared-edge mesh opened '+holes+' seam pixels');checks.push('Native geometry has no transparent seam between touching materials');
  const runtime=document.createElement('canvas');runtime.width=800;runtime.height=450;const rc=runtime.getContext('2d');rc.fillStyle='#747a76';rc.fillRect(0,0,800,450);const animator=new Animator();
  const actor={sprite:'explorer-teal',hp:100,x:200,y:390,faceX:-1,faceY:-1,equipment:rows[0].equipment,appearance:DEFAULT_APPEARANCE,inventory:[]};
  cel.setCelShading(false);animator.draw(rc,actor,.12,240);cel.setCelShading(true);animator.draw(rc,{...actor,x:600},.12,240);
  if(!animator.cutoutSource)throw Error('Runtime character did not use native Cutout geometry');
  images.push({name:'runtime-original-and-smoothed',png:runtime.toDataURL().split(',')[1]});checks.push('Actual Animator routes equipped humanoids through the native shared mesh');
  const repeatStart=performance.now();for(let i=0;i<12;i++)animator.draw(rc,{...actor,x:600},.12,240);const cachedMs=(performance.now()-repeatStart)/12;
  const {HouseBuilder}=await import('./src/house-builder.mjs'),house=await import('./src/house-design.mjs');
  const first={...house.defaultHouse(),name:'The Living House (original layout)'},draft={...house.defaultHouse(),name:'Unfinished original-house draft'};
  localStorage.setItem(house.HOUSE_KEY,JSON.stringify({active:'old',designs:[{id:'default',house:house.defaultHouse()},{id:'old',house:first},{id:'draft-old',house:draft}]}));
  const root=document.createElement('div');document.body.append(root);new HouseBuilder().mount(root);const options=[...root.querySelector('[aria-label="Saved house version"]').options].map(o=>o.textContent);
  if(options.some(name=>/original layout|Unfinished original-house draft/.test(name)))throw Error('Retired house remains selectable');checks.push('Actual house editor dropdown excludes both removed layouts');root.remove();
  const repeat=probe.toDataURL();cel.setCelShading(false);if(cel.applyCelShading(pc)!==false||probe.toDataURL()!==repeat)throw Error('Disabled pass mutated canvas');
  return {images,checks,timings,cachedCharacterDrawMs:cachedMs,hood};
 })()`);
 for(const image of result.images)fs.writeFileSync(path.join(out,image.name+'.png'),Buffer.from(image.png,'base64'));delete result.images;
 result.rendererErrors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(errors.length?1:0);
 }catch(error){console.error(error);app.exit(1);}
});
