const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/car-front-clearance');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1100,height:780,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 const errors=[];win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message)});
 try{
  await win.loadURL('about:blank');win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Debugger.enable');
  await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.carQA=ctx,false)'});
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   const ctx=carQA,raf=requestAnimationFrame;requestAnimationFrame=()=>0;await new Promise(raf);
   const {defaultHouse}=await import('./src/house-design.mjs');
   const {VEHICLE_SEATS,vehicleDoorPoint}=await import('./src/house-vehicles.mjs');
   const {drawCar,drawCarWheelArches}=await import('./src/car-art.mjs');
   const {carInteractionPrompt,drawCarPrompts}=await import('./src/car-prompts.mjs');
   const checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
   const g=ctx.game;Object.assign(g,{house:defaultHouse(),generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false,enemies:[],scenery:[],portals:[],players:[]});g.blocked=()=>false;g.terrain.fill('grass');
   ctx.screen='play';document.body.dataset.screen='play';for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
   const pad={index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});ctx.previousPads.clear();
   const p=g.addPlayer('pad:0'),v=g.house.vehicles[0],step=()=>g.update(.05,ctx.inputFrame()),button=on=>{pad.buttons[3]={pressed:on,value:on?1:0};step();};
   for(let d=0;d<8;d++)for(const seat of VEHICLE_SEATS){
    v.heading=d*Math.PI/4;v.speed=0;v.seats={};v.occupiedBy=null;Object.assign(p,vehicleDoorPoint(v,seat),{vehicleId:null,vehicleSeat:null,previousInput:{},interactTime:0,interactUsed:false,ui:null});button(false);
    assert(carInteractionPrompt(g,p)?.text.includes(seat.label),'Door hint '+d+'/'+seat.id);
    button(true);button(false);assert(p.vehicleSeat===seat.id,'Actual inputFrame enters '+d+'/'+seat.id);
    button(true);for(let n=0;n<5;n++)step();button(false);step();assert(p.vehicleId===null,'Exit stays outside through hold/release '+d+'/'+seat.id);
    button(true);button(false);assert(p.vehicleSeat===seat.id,'Fresh tap re-enters '+d+'/'+seat.id);
   }
   const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=620;const c=canvas.getContext('2d');c.fillStyle='#30473d';c.fillRect(0,0,1280,620);c.font='18px sans-serif';c.fillStyle='#eee2bd';c.fillText('Car corrections · eight views · native size and enlarged',20,28);
   for(let d=0;d<8;d++){
    const x=160+(d%4)*320,y=150+Math.floor(d/4)*300,actor={...v,x,y,heading:d*Math.PI/4,w:80,h:128,wheelAngle:.58,seats:{driver:p.id}};
    c.fillStyle='#eee2bd';c.font='12px monospace';c.fillText(d*45+' degrees',x-50,y-95);
    drawCar(c,{...actor,y:y-30},g);c.save();c.translate(x,y+110);c.scale(1.7,1.7);drawCar(c,{...actor,x:0,y:0},g);c.restore();
   }
   const frames=[];for(let n=0;n<48;n++){
    const frame=document.createElement('canvas');frame.width=440;frame.height=360;const pen=frame.getContext('2d');pen.fillStyle='#30473d';pen.fillRect(0,0,440,360);pen.save();pen.translate(220,190);pen.scale(2,2);
    drawCar(pen,{...v,x:0,y:0,heading:n*Math.PI/24,wheelAngle:Math.sin(n*Math.PI/12)*.58,wheelRotation:n*.35,seats:{driver:p.id}},g);pen.restore();frames.push(frame.toDataURL());
    const arch=document.createElement('canvas');arch.width=arch.height=300;const a=arch.getContext('2d'),car={...v,x:150,y:150,heading:n*Math.PI/24,wheelAngle:-.58};drawCarWheelArches(a,car);const before=arch.toDataURL();a.clearRect(0,0,300,300);drawCarWheelArches(a,{...car,wheelAngle:.58,wheelRotation:10});assert(before===arch.toDataURL(),'Arch pixels fixed at heading '+n);
   }
   const hints=document.createElement('canvas');hints.width=900;hints.height=340;const pen=hints.getContext('2d');pen.fillStyle='#30473d';pen.fillRect(0,0,900,340);
   for(const [i,seat]of VEHICLE_SEATS.slice(0,2).entries()){
    Object.assign(v,{x:0,y:0,heading:.9,seats:{},occupiedBy:null,speed:0});Object.assign(p,vehicleDoorPoint(v,seat),{vehicleId:null,vehicleSeat:null,ui:null});
    pen.save();pen.translate(225+i*450,180);pen.scale(1.7,1.7);drawCar(pen,v,g);pen.restore();
    pen.save();pen.translate(i*450,0);drawCarPrompts(pen,g,{x:0,y:0,zoom:1.7},450,360);pen.restore();
   }
   const steering=document.createElement('canvas');steering.width=2040;steering.height=900;const sc=steering.getContext('2d');sc.fillStyle='#30473d';sc.fillRect(0,0,2040,900);sc.font='17px sans-serif';sc.fillStyle='#eee2bd';sc.fillText('Wheel clearance: left lock / straight / right lock',20,26);
   for(let d=0;d<12;d++)for(let lock=0;lock<3;lock++){
    const col=d%4,row=Math.floor(d/4),x=col*510+85+lock*170,y=row*280+180,actor={...v,x,y,w:80,h:128,heading:d*Math.PI/6,wheelAngle:(lock-1)*.58,seats:{driver:p.id},sink:0};
    drawCar(sc,actor,g);
   }
   const grid=document.createElement('canvas');grid.width=grid.height=240;const gc=grid.getContext('2d');
   const enlarged=document.createElement('canvas');enlarged.width=enlarged.height=720;const ec=enlarged.getContext('2d');
   for(let d=0;d<32;d++)for(const lock of[-.58,0,.58]){
    gc.clearRect(0,0,240,240);ec.clearRect(0,0,720,720);const actor={...v,x:120,y:150,w:80,h:128,heading:d*Math.PI/16,wheelAngle:lock,seats:{driver:p.id},sink:0};
    drawCar(gc,actor,g);ec.save();ec.scale(3,3);drawCar(ec,actor,g);ec.restore();const native=gc.getImageData(0,0,240,240).data,big=ec.getImageData(0,0,720,720).data;
    let tested=0;for(let y=0;y<240;y++)for(let x=0;x<240;x++){const i=(y*240+x)*4;if(native[i+3]!==255)continue;tested++;
     for(let yy=0;yy<3;yy++)for(let xx=0;xx<3;xx++){const j=((y*3+yy)*720+x*3+xx)*4;if(big[j]!==native[i]||big[j+1]!==native[i+1]||big[j+2]!==native[i+2]||big[j+3]!==255)throw Error('Non-pixel edge at '+d+'/'+lock);}
    }
    assert(tested>1000,'Crisp pixel grid at heading '+d+' / steering '+lock);
   }
   const {carProject,carWheelGeometry}=await import('./src/car-art.mjs');
   const clearCanvas=document.createElement('canvas');clearCanvas.width=320;clearCanvas.height=360;const clearPen=clearCanvas.getContext('2d');
   const sample=q=>clearPen.getImageData(Math.floor(q.x),Math.floor(q.y),1,1).data;
   for(const [heading,point]of [[Math.PI/2,[80*.47,0,4]],[3*Math.PI/2,[-80*.47,0,4]],[Math.PI,[0,-128*.5-2,4]],[0,[0,128*.5+2,4]]]){
    const actor={...v,x:160,y:150,w:80,h:128,heading,wheelAngle:0,seats:{driver:p.id},sink:0};clearPen.clearRect(0,0,320,360);drawCar(clearPen,actor,g);
    assert(sample(carProject(actor,...point))[3]<128,'Air gap under body/bumper at heading '+heading);
    if(heading===Math.PI/2||heading===3*Math.PI/2){const sign=Math.sign(Math.sin(heading)),wheel=carWheelGeometry(actor,sign,-1);assert(sample(wheel.point(sign*wheel.halfWidth,0,2))[3]===255,'Tyre stays near ground at heading '+heading);}
   }
   const nose={...v,x:160,y:150,w:80,h:128,heading:Math.PI,wheelAngle:0,seats:{driver:p.id},sink:0};clearPen.clearRect(0,0,320,360);drawCar(clearPen,nose,g);
   for(const side of[-1,1]){const lamp=sample(carProject(nose,side*80*.31,-128*.5-2,19.5));assert(lamp[0]>170&&lamp[1]>150&&lamp[3]===255,'Readable front headlight '+side);}
   const grille=sample(carProject(nose,-80*.205,-128*.5-2,19)),bumper=sample(carProject(nose,0,-128*.5-2,13));
   assert(grille[3]===255&&grille[0]<100,'Inset front grille is distinct');assert(bumper[3]===255&&bumper[0]>grille[0]+16,'Separate raised front bumper');
   clearPen.clearRect(0,0,320,360);drawCar(clearPen,nose,{...g,sky:{elapsed:330}});
   for(const side of[-1,1]){const beam=sample(carProject(nose,side*80*.31,-128,0));assert(beam[3]>0&&beam[3]<128&&beam[0]>beam[2],'Warm night headlight beam '+side);}
   const nightPreview=document.createElement('canvas');nightPreview.width=640;nightPreview.height=720;const nightPen=nightPreview.getContext('2d');nightPen.fillStyle='#14251e';nightPen.fillRect(0,0,640,720);nightPen.imageSmoothingEnabled=false;nightPen.drawImage(clearCanvas,0,0,640,720);
   const {carCabinWindows}=await import('./src/car-interior.mjs');
   const {drawWeather}=await import('./src/hazards.mjs');
   for(const heading of [Math.PI/2,Math.PI*3/2])for(const seat of VEHICLE_SEATS){
    const target=document.createElement('canvas');target.width=target.height=300;const pen=target.getContext('2d'),actor={...v,x:150,y:170,heading,seats:{},occupiedBy:null};
    drawCar(pen,actor,g);const empty=pen.getImageData(0,0,300,300).data;
    pen.clearRect(0,0,300,300);actor.seats={[seat.id]:p.id};drawCar(pen,actor,g);const occupied=pen.getImageData(0,0,300,300).data;let changed=0;
    for(let i=0;i<empty.length;i+=4)if(empty[i]!==occupied[i]||empty[i+1]!==occupied[i+1]||empty[i+2]!==occupied[i+2])changed++;
    assert(changed>8,'Occupant visible through '+(heading<Math.PI?'passenger':'driver')+' side / '+seat.id+' ('+changed+' pixels)');
   }
   const {Renderer}=await import('./src/render.mjs');const world=document.createElement('canvas');world.style.cssText='width:1100px;height:780px';document.body.append(world);const renderer=new Renderer(world,ctx.assets);renderer.dynamicShadows=false;
   Object.assign(v,{x:400,y:1168,heading:Math.PI*1.25,wheelAngle:.35,seats:{driver:p.id},occupiedBy:p.id});Object.assign(p,{x:v.x,y:v.y,vehicleId:v.id,vehicleSeat:'driver'});g.explored=new Set(Array.from({length:2500},(_,i)=>i));g.sky={elapsed:0};renderer.camera={x:v.x,y:v.y,zoom:2.4};renderer.draw(g,0);const carScene=world.toDataURL();
   g.houseWorldsEnabled=false;g.environment='ice';g.generatedEnvironment=null;g.start();for(const player of g.players){player.vehicleId=null;player.vehicleSeat=null;player.x=800;player.y=850;}g.openingBoard=false;g.weather=null;g.time=12;g.visionEnabled=false;g.explored=new Set(Array.from({length:2500},(_,i)=>i));
   renderer.camera={x:g.players[0].x,y:g.players[0].y,zoom:1.3};
   renderer.draw(g,0);const snowScene=world.toDataURL();
   const weather=document.createElement('canvas');weather.width=640;weather.height=480;const wc=weather.getContext('2d');drawWeather(wc,g,640,480);
   const mask=wc.getImageData(0,0,640,480).data;let snowPixels=0;for(let i=3;i<mask.length;i+=4)if(mask[i])snowPixels++;
   assert(snowPixels>100,'New ice expedition renders default snowfall without an event: '+g.generatedEnvironment+'/'+snowPixels);assert(g.weather===null,'Ambient snow does not create a timed hazard');
   const snowPreview=weather.toDataURL();
   return {checks,images:{'eight-views':canvas.toDataURL(),'door-prompts':hints.toDataURL(),'snow-level':snowScene,'snowfall-mask':snowPreview,'wheel-clearance':steering.toDataURL(),'car-in-world':carScene,'night-front':nightPreview.toDataURL()},frames};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  for(const [i,data]of result.frames.entries())fs.writeFileSync(path.join(out,'turn-'+String(i).padStart(2,'0')+'.png'),Buffer.from(data.split(',')[1],'base64'));
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:result.checks,errors},null,2));console.log(JSON.stringify({checks:result.checks.length,errors}));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
