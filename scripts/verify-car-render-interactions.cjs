const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/car-render-interactions');
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
   return {checks,images:{'eight-views':canvas.toDataURL(),'door-prompts':hints.toDataURL()},frames};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  for(const [i,data]of result.frames.entries())fs.writeFileSync(path.join(out,'turn-'+String(i).padStart(2,'0')+'.png'),Buffer.from(data.split(',')[1],'base64'));
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks:result.checks,errors},null,2));console.log(JSON.stringify({checks:result.checks.length,errors}));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
