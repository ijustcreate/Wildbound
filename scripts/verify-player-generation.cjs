const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {PNG}=require('pngjs');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'art/player/detail-native-v'+(process.env.WILDBOUND_ART_GENERATION||3));
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json')));
let cells=0;
for(const variant of manifest.variants)for(const animation of manifest.animations){
  const file=path.join(folder,'native',variant.id,animation.action+'.png');
  const png=PNG.sync.read(fs.readFileSync(file));
  assert.equal(png.width,animation.frames*128);assert.equal(png.height,8*128);
  for(let d=0;d<8;d++)for(let f=0;f<animation.frames;f++){
    let opaque=0;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const alpha=png.data[((d*128+y)*png.width+f*128+x)*4+3];
      if(!alpha)continue;
      opaque++;
      assert.ok(x>0&&x<127&&y>0&&y<127,`Clipping: ${variant.id}/${animation.action}/${d}/${f}`);
    }
    assert.ok(opaque>50,`Empty sprite: ${file}/${d}/${f}`);cells++;
  }
}
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1280,height:960,webPreferences:{offscreen:true,backgroundThrottling:false}});
  await win.loadFile(path.join(folder,'index.html'));
  const screenshots=path.join(root,'test-output/player-generation');fs.mkdirSync(screenshots,{recursive:true});
  for(const [label,width,height] of [['desktop',1280,960],['mobile',390,844]]){
    win.setContentSize(width,height);
    const result=await win.webContents.executeJavaScript(`(async()=>{
      document.getElementById('action').value='run';document.getElementById('action').dispatchEvent(new Event('change'));
      await new Promise(resolve=>setTimeout(resolve,160));
      const read=()=>Array.from(document.querySelectorAll('canvas.current')).map(c=>Array.from(c.getContext('2d').getImageData(0,0,128,128).data));
      const first=read();await new Promise(resolve=>setTimeout(resolve,180));const second=read();
      const nonempty=second.every(p=>p.some((v,i)=>i%4===3&&v>0));
      const moving=first.some((p,n)=>p.some((v,i)=>v!==second[n][i]));
      document.getElementById('play').click();
      const slider=document.getElementById('frame');slider.value=3;slider.dispatchEvent(new Event('input'));
      await new Promise(resolve=>setTimeout(resolve,40));
      return {nonempty,moving,frame:document.getElementById('counter').textContent,overflow:document.documentElement.scrollWidth>innerWidth};
    })()`);
    assert.ok(result.nonempty);assert.ok(result.moving);assert.equal(result.frame,'4 / 8');assert.equal(result.overflow,false);
    fs.writeFileSync(path.join(screenshots,label+'.png'),(await win.webContents.capturePage()).toPNG());
    const comparison=await win.webContents.executeJavaScript(`(async()=>{
      const compare=document.getElementById('compare');compare.checked=true;compare.dispatchEvent(new Event('change'));
      const pixels=document.getElementById('pixels');pixels.value='1';pixels.dispatchEvent(new Event('change'));
      const speed=document.getElementById('speed');speed.value='.25';speed.dispatchEvent(new Event('change'));
      await new Promise(resolve=>setTimeout(resolve,80));
      return {previous:[...document.querySelectorAll('canvas.previous')].every(c=>c.getBoundingClientRect().width>0&&c.getContext('2d').getImageData(0,0,128,128).data.some((v,i)=>i%4===3&&v>0)),overflow:document.documentElement.scrollWidth>innerWidth,native:[...document.querySelectorAll('canvas.current')].every(c=>c.getBoundingClientRect().width<=128)};
    })()`);
    assert.ok(comparison.previous);assert.ok(comparison.native);assert.equal(comparison.overflow,false);
    fs.writeFileSync(path.join(screenshots,label+'-comparison.png'),(await win.webContents.capturePage()).toPNG());
    await win.webContents.executeJavaScript("for(const [id,value] of [['compare',false],['pixels','fit'],['speed','1']]){const e=document.getElementById(id);if(id==='compare')e.checked=value;else e.value=value;e.dispatchEvent(new Event('change'));}");
    // Restore playback before testing the next viewport.
    await win.webContents.executeJavaScript("document.getElementById('play').click()");
  }
  console.log(JSON.stringify({cells,sheets:manifest.variants.length*manifest.animations.length,clipped:0,viewer:'desktop + mobile controls and animation passed'}));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
