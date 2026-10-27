const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','car-controls');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});win.webContents.setAudioMuted(true);
 try{
  await win.loadURL('about:blank');
  win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Debugger.enable');
  await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.carControlsContext=ctx,false)'});
  console.log('Loading isolated car test');await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  console.log('Testing actual inputFrame');const result=await win.webContents.executeJavaScript(`(async()=>{
   const ctx=window.carControlsContext,raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {defaultHouse}=await import('./src/house-design.mjs');
   const {enterOrExitHouseVehicle}=await import('./src/house-vehicles.mjs');
   const {drawForestTree}=await import('./src/forest.mjs');
   const {drawHouseCar,drawVehicleWheels}=await import('./src/house-render.mjs');
   const checks=[],assert=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const g=ctx.game;Object.assign(g,{house:defaultHouse(),generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false,enemies:[],scenery:[],portals:[],players:[]});
   ctx.screen='play';document.body.dataset.screen='play';for(const d of document.querySelectorAll('dialog[open]'))d.close();
   g.blocked=()=>false;g.house.walls=[];g.terrain=Array(2500).fill('grass');
   const pad={index:0,id:'Xbox Wireless Controller',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});ctx.previousPads.clear();
   const p=g.addPlayer('pad:0'),v=g.house.vehicles[0];Object.assign(p,{x:v.x,y:v.y,hp:100,inventory:[{type:'car_key',qty:1}]});enterOrExitHouseVehicle(g,p);v.enginePartInstalled=true;
   const step=()=>g.update(.05,ctx.inputFrame()),button=(i,on)=>pad.buttons[i]={pressed:on,value:on?1:0};
   pad.axes[1]=-1;for(let i=0;i<2;i++)step();assert(!v.speed,'Actual inputFrame stick up does not accelerate');
   button(0,true);pad.axes[0]=.7;for(let i=0;i<20;i++)step();assert(v.speed>50&&v.heading>0,'Actual bottom face gas drives and front steering turns');
   assert(!p.jumpHeight&&!p.dashTime&&!p.charge&&!p.bowAiming,'Driver cannot jump, dash or charge a weapon with pedals');
   button(0,false);button(2,true);for(let i=0;i<30;i++)step();assert(v.speed===0,'Actual left face brake stops without reversing');
   const heading=v.heading;for(let i=0;i<30;i++)step();assert(v.heading===heading,'Steering while parked does not rotate the car');
   button(2,false);button(0,true);pad.axes[1]=1;for(let i=0;i<8;i++)step();assert(v.speed<0,'Down plus bottom face gas selects reverse');
   button(0,false);button(2,true);for(let i=0;i<15;i++)step();assert(v.speed===0&&!p.attack,'Reverse brake stops with no weapon swing on release');
   // A second controller family uses the same physical positions.
   pad.id='Nintendo Switch Pro Controller';button(2,false);button(0,true);pad.axes[1]=0;for(let i=0;i<20;i++)step();assert(v.speed>0,'Switch bottom face position also accelerates');
   const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=660;const c=canvas.getContext('2d');c.fillStyle='#486345';c.fillRect(0,0,1000,660);
   c.fillStyle='#fff2cf';c.font='20px Georgia';c.fillText('Trimmed trunk ends — branching roots preserved',24,28);
   for(const [i,type] of ['oak','birch','pine'].entries()){
    const tree={kind:'tree',treeType:type,seed:13,x:170+i*320,y:290,size:160};drawForestTree(c,tree,0,{generatedEnvironment:'forest'});
    c.fillStyle='#fff2cf';c.fillText(type,130+i*320,390);
   }
   c.fillStyle='#fff2cf';c.fillText('Front wheels steer; rear wheels stay aligned with body',24,440);
   drawHouseCar(c,{x:500,y:555,w:96,h:144,heading:.6},g);drawVehicleWheels(c,{x:500,y:555,w:96,h:144,heading:.6,wheelAngle:.4});
   return {checks,physicalControllersTested:false,preview:canvas.toDataURL('image/png')};
  })()`);
  fs.writeFileSync(path.join(out,'trees-and-front-steering.png'),Buffer.from(result.preview.split(',')[1],'base64'));delete result.preview;
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
