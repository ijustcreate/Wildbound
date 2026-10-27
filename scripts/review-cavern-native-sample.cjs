const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/cavern-native-sample');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1200,height:800});w.webContents.setAudioMuted(true);try{
 await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await w.webContents.executeJavaScript(`(async()=>{
 const {makeCavernNativeSample}=await import('./src/cavern-native-sample.mjs'),{drawProp,harvest}=await import('./src/environment.mjs'),{drawNativeBeachProp}=await import('./src/beach-props.mjs'),{realmProp,realmFootprint}=await import('./src/realm-world.mjs'),{validateSprite}=await import('./src/pixels.mjs'),{Assets}=await import('./src/assets.mjs'),{Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
 const library=Object.fromEntries(['limestone_shelf','cave_crystal'].map(k=>[k,makeCavernNativeSample(k)]));
 const assets=new Assets();await assets.load();Object.assign(assets.library,library);assets.cache.clear();
 const g=new Game(()=>.5,{deferWorld:true});g.environment='caverns';g.addPlayer('keyboard','Native art review');g.start();g.spriteLibrary=assets.library;g.weather=null;g.time=20;
 const rc=document.createElement('canvas');const renderer=new Renderer(rc,assets);
 const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=620;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const text=(s,x,y,size=16,col='#dddcc1')=>{c.fillStyle=col;c.font=size+'px sans-serif';c.fillText(s,x,y);};
 c.fillStyle='#182b26';c.fillRect(0,0,1100,620);text('WILDBOUND / NATIVE CAVERN SAMPLE',32,38,24);text('Existing assets beside two draft props — same world scale and drawing pipeline',32,66,16);
 const labels=['Forest rock / existing','Beach rock / existing','Limestone shelf / draft','Crystal seam / draft'];
 const props=[{kind:'rock',x:0,rootY:0,y:0,size:64,procedural:true},{kind:'rock',coastal:true,x:0,rootY:0,y:0,size:96},realmProp('limestone_shelf',0,0,'sample-rock'),realmProp('cave_crystal',0,0,'sample-crystal')];
 for(let i=0;i<4;i++){
  const x=26+i*269;text(labels[i],x+6,105,16);c.fillStyle='#38453c';c.fillRect(x,122,251,250);
  c.save();c.translate(x+126,315);c.scale(2.6,2.6);if(i===1)drawNativeBeachProp(c,props[i],0);else drawProp(c,props[i],0,g,{dynamicShadows:true,spriteLibrary:library});c.restore();
  text('2.6x enlargement',x+8,355,13,'#a3b5a4');
 }
 text('1x world scale / actual player renderer',32,410,17);c.fillStyle='#38453c';c.fillRect(26,430,1048,150);
 for(let i=0;i<4;i++){c.save();c.translate(145+i*269,536);if(i===1)drawNativeBeachProp(c,props[i],0);else drawProp(c,props[i],0,g,{dynamicShadows:true,spriteLibrary:library});c.restore();}
 const hero=g.players[0];Object.assign(hero,{x:550,y:540});renderer.animator.draw(c,hero,20,43);text('Draft only — no packaged assets replaced',32,605,14,'#a3b5a4');
 const checks=[];for(const [kind,s]of Object.entries(library)){if(!validateSprite(s))throw Error('Invalid '+kind);checks.push(kind+': native editable 64x64 sprite valid');}
 g.scenery=[realmProp('cave_crystal',800,800,'mine')];Object.assign(hero,{x:800,y:824,faceX:0,faceY:-1});for(let i=0;i<8;i++)harvest(g,hero,100,90);if(!g.scenery[0].depleted)throw Error('Mining failed');checks.push('Crystal uses existing harvest/depletion');
 if(!(realmFootprint(props[2]).height>0))throw Error('Missing rock support');checks.push('Shelf retains native collision/jump surface');
 return {image:canvas.toDataURL(),library,checks};})()`);
 fs.writeFileSync(path.join(out,'comparison.png'),Buffer.from(result.image.split(',')[1],'base64'));fs.writeFileSync(path.join(out,'editable-samples.json'),JSON.stringify(result.library));fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(result.checks,null,2));console.log(result.checks);w.destroy();app.quit();
 }catch(e){console.error(e);w.destroy();app.exit(1);}});
