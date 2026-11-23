const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{cwd:root,env,encoding:'utf8',timeout:360000});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output/train-layer-probes',process.env.WILDBOUND_MATRIX_STAGE||(process.env.WILDBOUND_VERIFY_APP?'packaged':'before'));fs.mkdirSync(out,{recursive:true});app.setPath('userData',path.join(out,'isolated-profile'));app.commandLine.appendSwitch('mute-audio');const deadline=setTimeout(()=>app.exit(1),350000);
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
 await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await win.webContents.executeJavaScript('wildboundBoot.ready');
 if(process.env.WILDBOUND_VERIFY_NO_COAL_GPU)await win.webContents.executeJavaScript(`(()=>{const create=document.createElement.bind(document);document.createElement=(name,...args)=>{const node=create(name,...args);if(name==='canvas'){const context=node.getContext.bind(node);node.getContext=(kind,...options)=>kind==='webgl'?null:context(kind,...options);}return node;};})()`);
 const result=await win.webContents.executeJavaScript(`(async()=>{try{
 const {drawTrainCar,trainPartSprite,trainViewIndex}=await import('./src/train-art.mjs'),{drawTrainRiderLayer}=await import('./src/train-rider-layer.mjs');
 const {defaultTrainDesign}=await import('./src/train-design.mjs');
 const checks=[],images={},ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 function probe(kind,angle,local,height=0,{objects,doors={},painted=false,roof=0}={}){
  const d=defaultTrainDesign(),def=d.cars.find(c=>c.kind===kind),car={...def,index:d.cars.indexOf(def),x:200,y:240,z:0,a:angle};if(objects)d.interiors[car.id]=objects;
  if(painted){const view=trainViewIndex(angle);const sprite=trainPartSprite(d,car,'furniture',view);sprite.palette=sprite.palette.map(c=>c==='transparent'?c:'#53c5a1');d.art[kind+':furniture:'+view]=sprite;}
  const ca=Math.cos(angle),sa=Math.sin(angle),rider={x:local.x,y:local.y,height},actor={x:car.x+ca*local.x-sa*local.y,y:car.y+sa*local.x+ca*local.y-20,jumpHeight:height};
  const canvas=document.createElement('canvas');canvas.width=canvas.height=400;const c=canvas.getContext('2d');c.fillStyle='#223745';c.fillRect(0,0,400,400);
  const options={design:d,riders:[rider],time:1,distance:0,speed:0,doors,cocoaTaken:new Set(),roofAlpha:roof};drawTrainCar(c,d,car,options);
  c.fillStyle='#23d4e7';c.fillRect(Math.floor(actor.x)+15,Math.floor(actor.y-height)-30,8,15);const before=c.getImageData(0,0,400,400).data;
  const rect={x:Math.floor(actor.x)-10,y:Math.floor(actor.y-height)-40,w:20,h:40};
  drawTrainRiderLayer(c,{},actor,[{car,rider,options}],pen=>{pen.fillStyle='#ff00ff';pen.fillRect(rect.x,rect.y,rect.w,rect.h);});
  const after=c.getImageData(0,0,400,400).data;let outside=0,magenta=0,occluded=0,customPixels=0,insideChanges=0;
  for(let y=0;y<400;y++)for(let x=0;x<400;x++){const i=(y*400+x)*4,inside=x>=rect.x&&x<rect.x+rect.w&&y>=rect.y&&y<rect.y+rect.h,changed=after[i]!==before[i]||after[i+1]!==before[i+1]||after[i+2]!==before[i+2]||after[i+3]!==before[i+3];if(!inside&&changed)outside++;if(inside){if(changed)insideChanges++;if(after[i]===83&&after[i+1]===197&&after[i+2]===161)customPixels++;if(after[i]===255&&after[i+1]===0&&after[i+2]===255)magenta++;else occluded++;}}
  ok(outside===0,kind+' foreground never repaints neighbouring pixels '+angle.toFixed(3));return {magenta,occluded,customPixels,insideChanges,canvas};
 }
 const table={id:'probe-table',kind:'table',x:0,y:0,w:34,h:30};
 for(let v=0;v<8;v++){
  const a=v*Math.PI/4,nx=Math.sin(a),ny=Math.cos(a);
  const far=probe('caboose',a,{x:-nx*25,y:-ny*25},0,{objects:[table]}),near=probe('caboose',a,{x:nx*25,y:ny*25},0,{objects:[table]}),high=probe('caboose',a,{x:0,y:0},50,{objects:[table]});
  ok(far.occluded>0,'table covers far-side body '+v);const nearControl=probe('caboose',a,{x:nx*25,y:ny*25},0,{objects:[]});ok(near.magenta===nearControl.magenta,'near-side body stays in front of table '+v);ok(high.magenta===800,'jump above tabletop stays unobstructed '+v);
  const painted=probe('caboose',a,{x:-nx*25,y:-ny*25},0,{objects:[table],painted:true});ok(painted.occluded>0,'painted table keeps its foreground coverage '+v);ok(painted.customPixels>0,'authored table palette is preserved '+v);
  probe('engine',a,{x:-80,y:24});probe('tender',a,{x:0,y:-35});const closedRoof=probe('caboose',a,{x:0,y:0},0,{objects:[],roof:1}),fadingRoof=probe('caboose',a,{x:0,y:0},0,{objects:[],roof:.4});ok(closedRoof.insideChanges===0,'opaque roof leaves no body-shaped redraw '+v);ok(fadingRoof.insideChanges>0,'fading roof retains the actor underneath '+v);
 }
 for(const a of [.13,.71,1.83,3.41,5.8])probe('caboose',a,{x:0,y:-25},0,{objects:[table]});
 const door={id:'probe-door',kind:'door',x:0,y:0,w:22,h:5,open:false},closed=probe('compartments',0,{x:0,y:-16},0,{objects:[door]}),open=probe('compartments',0,{x:0,y:-16},0,{objects:[door],doors:{'compartments:probe-door':true}});
 ok(closed.occluded>open.occluded,'open doorway restores body pixels hidden by closed leaf');
 return {checks,images};
 }catch(e){throw Error(e.stack)}})()`);
 for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
 if(errors.length)throw Error(errors.join('\n'));const report={passed:result.checks.length,failed:0,...result,muted:win.webContents.isAudioMuted(),errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e.stack,errors);clearTimeout(deadline);app.exit(1);}});
