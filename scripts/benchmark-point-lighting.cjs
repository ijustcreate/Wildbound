const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','lighting-perf');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});win.webContents.setAudioMuted(true);await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {WorldLightRenderer,worldLightField}=await import('./src/world-lighting.mjs'),{shadeCharacterSurface}=await import('./src/character-lighting.mjs');
 const canvas=document.createElement('canvas');canvas.width=canvas.height=800;const c=canvas.getContext('2d');
 const props=Array.from({length:28},(_,i)=>({id:'bench'+i,kind:i%4===0?'rock':'tree',x:400+Math.cos(i*2.4)*(80+i%4*30),y:400+Math.sin(i*2.4)*(80+i%4*30),rootY:400+Math.sin(i*2.4)*(80+i%4*30),size:100}));
 const source={owner:'actor:hero',x:400,y:400,height:30,radius:300,color:'#ffc76f',intensity:1},game={scenery:props,players:[{id:'hero',x:400,y:400,hp:100}]},renderer=new WorldLightRenderer();
 const paint=p=>pen=>{pen.fillStyle='#365638';pen.fillRect(p.x-36,p.y-95,72,85);pen.fillStyle='#635234';pen.fillRect(p.x-5,p.y-20,10,20);};
 let reads=0;const original=CanvasRenderingContext2D.prototype.getImageData;CanvasRenderingContext2D.prototype.getImageData=function(...args){reads++;return original.apply(this,args);};
 const times=[],fieldTimes=[],cold=[];
 for(let i=0;i<72;i++){
  source.x=400+i*1.5;game.players[0].x=source.x;const begin=performance.now(),field=worldLightField(game,[source]);fieldTimes.push(performance.now()-begin);
  const frame={sources:[source],field,time:i/60};const start=performance.now();renderer.drawGround(c,frame);
  for(const p of props)renderer.drawProp(c,p,paint(p),frame);
  const elapsed=performance.now()-start;(i<12?cold:times).push(elapsed);
 }
 const actor=document.createElement('canvas');actor.width=actor.height=192;const pen=actor.getContext('2d');const character=[];
 for(let i=0;i<60;i++){pen.clearRect(0,0,192,192);pen.fillStyle='#456345';pen.fillRect(75,35,40,120);const start=performance.now();shadeCharacterSurface(actor,{bodyHeight:22,lights:[{dx:-100,dy:-40,strength:.7,color:'#ffc76f'}]},{pixelsPerWorld:3});character.push(performance.now()-start);}
 CanvasRenderingContext2D.prototype.getImageData=original;
 const stats=a=>{a=a.toSorted((a,b)=>a-b);return {median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1),mean:a.reduce((a,b)=>a+b,0)/a.length};};
 return {softwareRenderer:true,props:props.length,frames:72,movingLight:stats(times),cold:stats(cold),field:stats(fieldTimes),character:stats(character),readbacks:reads,cacheBytes:renderer.bytes};})()`);
 fs.writeFileSync(path.join(out,(process.env.WILDBOUND_PERF_LABEL||'after')+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
