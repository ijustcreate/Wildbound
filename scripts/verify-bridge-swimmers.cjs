const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','bridge-swimmers');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-bridge-swimmers-')));
app.commandLine.appendSwitch('mute-audio');

async function verifyBridges(){
  if(wildboundBoot.error||!wildboundBoot.finished)throw Error('Game boot failed: '+wildboundBoot.error);
  window.requestAnimationFrame=()=>0;
  const {Game}=await import('./src/core.mjs');
  const {Renderer}=await import('./src/render.mjs');
  const {drawBridges}=await import('./src/bridges.mjs');
  const {tickSwimming}=await import('./src/swimming.mjs');
  const {enterTrainTest,updateTrainWater}=await import('./src/train-test.mjs');
  const {defaultTrainDesign}=await import('./src/train-design.mjs');
  const {nearestTrainTrack,trainCars,trainWorld}=await import('./src/train-track.mjs');
  const {stopRailwayStream}=await import('./src/railway-stream.mjs');
  const checks=[],pictures={};
  function check(test,label){
    if(!test)throw Error(label);
    checks.push(label);
  }

  const game=new Game(()=>.4);
  let player=game.addPlayer('keyboard','Swimmer');
  game.start();
  Object.assign(game,{openingBoard:false,scenery:[],enemies:[],onSound:()=>{},persist:()=>{}});
  game.terrain.fill('water');
  for(let x=9;x<=15;x++)game.terrain[12*50+x]='bridge';
  Object.assign(player,{x:400,y:400,swimming:true});
  tickSwimming(game,player,{},.02);
  check(player.underBridge&&player.swimming,'A real swimmer enters the water under the wooden deck');
  const bridge=document.createElement('canvas');
  bridge.width=600;
  bridge.height=460;
  const pen=bridge.getContext('2d',{willReadFrequently:true});
  const woodBounds={sx:9,sy:12,ex:16,ey:13};
  function paintWoodenBridge(under){
    player.underBridge=under;
    pen.fillStyle='#326777';
    pen.fillRect(0,0,bridge.width,bridge.height);
    drawBridges(pen,game,false,woodBounds);
    drawBridges(pen,game,true,woodBounds);
    return [400,480].map(x=>[...pen.getImageData(x,400,1,1).data].join(','));
  }
  const opaqueWood=paintWoodenBridge(false),fadedWood=paintWoodenBridge(true);
  check(opaqueWood[0]!==fadedWood[0],'Wood deck fades over the swimmer');
  check(opaqueWood[1]===fadedWood[1],'Wood deck stays opaque away from the swimmer');
  check(paintWoodenBridge(false)[0]===opaqueWood[0],'Wood deck restores full opacity when the swimmer leaves');

  check(enterTrainTest(game,defaultTrainDesign()).ok,'Native woodland railway opens');
  const railway=game.trainTest;
  player=game.players[0];
  const crossing=nearestTrainTrack(railway.route,railway.design.river.x,3500);
  Object.assign(player,{x:crossing.x,y:crossing.y+7,swimming:true,moving:true,faceX:0,faceY:1});
  railway.distance=0;
  updateTrainWater(railway,player);
  check(player.underBridge&&player.swimming&&!player.trainDeck,'Railway simulation keeps the swimmer below the track');

  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:700px;height:480px';
  document.body.append(canvas);
  const renderer=new Renderer(canvas,wildboundPolishTest.assets);
  renderer.cameraOverride={x:player.x,y:player.y,zoom:1};
  game.spriteLibrary=wildboundPolishTest.assets.library;
  const nativeDraw=renderer.animator.draw.bind(renderer.animator);
  let hideSwimmer=false;
  renderer.animator.draw=(context,actor,time,size)=>{
    if(!hideSwimmer||actor.id!==player.id)nativeDraw(context,actor,time,size);
  };
  function frame(under,hide=false){
    player.underBridge=under;
    hideSwimmer=hide;
    renderer.draw(game,0);
    const centerX=canvas.width/2,centerY=canvas.height/2;
    return [renderer.ctx.getImageData(centerX-44,centerY-70,88,72).data,
      renderer.ctx.getImageData(centerX+124,centerY-70,60,92).data];
  }
  function changedPixels(before,after){
    let count=0;
    for(let i=0;i<before.length;i+=4){
      if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2])>12)count++;
    }
    return count;
  }
  function verifyTrack(label){
    const [opaque,outside]=frame(false);
    const [faded,fadedOutside]=frame(true);
    pictures[label]=canvas.toDataURL();
    const [fadedNoActor]=frame(true,true);
    const [restored]=frame(false);
    check(changedPixels(opaque,faded)>30,label+' rails and deck fade near the swimmer');
    check(changedPixels(outside,fadedOutside)===0,label+' rails outside the crossing fade retain their opacity');
    check(changedPixels(faded,fadedNoActor)>20,label+' swimmer pixels stay visible through the deck');
    check(changedPixels(opaque,restored)===0,label+' bridge restores full opacity after exit');
  }

  railway.streamDisabled=true;
  verifyTrack('Fallback railway');
  railway.streamDisabled=false;
  for(let i=0;i<250;i++){
    frame(false);
    if(railway.terrainStream?.failed)throw Error(railway.terrainStream.errors.join('; '));
    if(railway.terrainStream?.ready.size>0)break;
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  check(railway.terrainStream?.ready.size>0,'Railway terrain worker is active');
  railway.preparing=false;
  verifyTrack('Streamed railway');
  stopRailwayStream(railway);
  railway.streamDisabled=true;

  const messages=[],fillText=renderer.ctx.fillText.bind(renderer.ctx);
  renderer.ctx.fillText=(message,...args)=>{messages.push(message);fillText(message,...args);};
  const cab=trainCars(railway)[0],seat={car:cab.index,x:-80,y:0,driving:true};
  Object.assign(player,trainWorld(cab,seat.x,seat.y),{swimming:false,underBridge:false,trainRide:seat});
  Object.assign(renderer.camera,{x:player.x,y:player.y});
  renderer.cameraOverride={...renderer.camera};
  railway.notice='Railway test notice';
  railway.noticeUntil=railway.time+4;
  renderer.draw(game,0);
  check(!messages.some(message=>/PARKED.*px\/s|^Throttle \d+%/.test(message)),'Shared view omits the railway status panel');
  check(messages.some(message=>message.trim()===railway.notice),'Transient railway notice still appears');
  check(messages.some(message=>message.includes('WHISTLE')&&message.includes('BRAKE')),'Driver controls still appear near the explorer');
  messages.length=0;
  renderer.splitChild=true;
  renderer.draw(game,0);
  check(!messages.some(message=>/PARKED.*px\/s|^Throttle \d+%/.test(message)),'Fixed split view omits the railway status panel');
  return {checks,pictures};
}

app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:900,height:620,webPreferences:{backgroundThrottling:false}});
  window.webContents.setAudioMuted(true);
  const errors=[];
  window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
  try{
    await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
    await window.webContents.executeJavaScript('wildboundBoot.ready');
    const {checks,pictures,failure}=await window.webContents.executeJavaScript(`(${verifyBridges})().catch(error=>({failure:error.stack}))`);
    if(failure)throw Error(failure);
    fs.mkdirSync(output,{recursive:true});
    for(const [name,data] of Object.entries(pictures)){
      fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
    }
    const report={checks,errors,audioMuted:window.webContents.isAudioMuted()};
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
    app.exit(errors.length||!report.audioMuted?1:0);
  }catch(error){
    console.error(error);
    app.exit(1);
  }
});
