const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/creature-art-review');
const stage = process.argv[2] || 'before';
if (!['before', 'after'].includes(stage)) throw new Error('Use before or after');
fs.mkdirSync(output, { recursive: true });

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-eldritch-owl-pass-')));
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1280, height: 800, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const refs = stage === 'after' ? Object.fromEntries(['front','side','rear','opposite-side'].map(view => [view, fs.readFileSync(path.join(root, `test-output/modelviewer-references/85676-archimedes-${view}-idle.png`)).toString('base64')])) : {};
    const before = stage === 'after' ? fs.readFileSync(path.join(output, 'great-owl-pass-before.png')).toString('base64') : '';
    const result = await window.webContents.executeJavaScript(`(async()=>{
      const { CREATURE_PACK } = await import('./src/creature-packs/eldritch.mjs');
      const subject=CREATURE_PACK.subjects.great_owl,model=subject.defaults(),dirs=['S','SW','W','NW','N','NE','E','SE'];
      const canvas=document.createElement('canvas');canvas.width=920;canvas.height=340;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,920,340);c.fillStyle='#e8d8ad';c.font='bold 18px system-ui';c.fillText('GREAT OWL · '+${JSON.stringify(stage.toUpperCase())}+' · editable runtime pixel renderer',12,24);c.fillStyle='#9ed6b8';c.font='12px system-ui';
      for(let f=0;f<8;f++){const a=f*Math.PI/4,x=112+f*96;c.textAlign='center';c.fillText(dirs[f],x,53);c.save();c.translate(x,105);subject.draw(c,{id:'owl-pass-'+${JSON.stringify(stage)}+'-'+f,kind:'great_owl',x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',moving:false},0,model);c.restore();c.fillText(dirs[f],x,195);c.save();c.translate(x,255);c.scale(2.3,2.3);subject.draw(c,{id:'owl-pass-zoom-'+${JSON.stringify(stage)}+'-'+f,kind:'great_owl',x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',moving:false},0,model);c.restore();}
      const render=canvas.toDataURL('image/png').split(',')[1];
      if(${JSON.stringify(stage)}==='before') return {render};
      const refData=${JSON.stringify(refs)},old=new Image();old.src='data:image/png;base64,'+${JSON.stringify(before)};await new Promise((resolve,reject)=>{old.onload=resolve;old.onerror=reject});
      const card=document.createElement('canvas');card.width=1540;card.height=940;const cc=card.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#10271f';cc.fillRect(0,0,card.width,card.height);cc.fillStyle='#e8d8ad';cc.font='bold 20px system-ui';cc.fillText('GREAT OWL / ARCHIMEDES · ART QUALITY PASS · DRAFT',16,27);cc.fillStyle='#a9c3b5';cc.font='12px system-ui';cc.fillText('Matched renderer, pose, eight facings and native pixel scale; enlarged row is nearest-neighbor only.',16,46);
      const fresh=new Image();fresh.src='data:image/png;base64,'+render;await new Promise((resolve,reject)=>{fresh.onload=resolve;fresh.onerror=reject});cc.drawImage(old,0,55,920,340);cc.drawImage(fresh,0,420,920,340);
      cc.fillStyle='#cbb991';cc.font='bold 12px system-ui';cc.fillText('SOURCE MODELVIEWER · ARCHIMEDES · STAND',944,66);
      for(let i=0;i<4;i++){const view=['front','side','rear','opposite-side'][i],image=new Image();image.src='data:image/png;base64,'+refData[view];await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject});const x=944+(i%2)*286,y=78+Math.floor(i/2)*225,scale=Math.min(270/image.width,205/image.height),w=image.width*scale,h=image.height*scale;cc.fillStyle='#cbb991';cc.font='bold 10px system-ui';cc.fillText(view.toUpperCase(),x,y);cc.fillStyle='#081815';cc.fillRect(x,y+12,270,205);cc.drawImage(image,x+(270-w)/2,y+12+(205-h)/2,w,h);}
      cc.fillStyle='#cbb991';cc.font='bold 12px system-ui';cc.fillText('BEFORE · NATIVE / 2.3×',8,53);cc.fillText('AFTER · NATIVE / 2.3×',8,418);
      return {render,card:card.toDataURL('image/png').split(',')[1]};
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(output, `great-owl-pass-${stage}.png`), Buffer.from(result.render, 'base64'));
    if (stage === 'after') fs.writeFileSync(path.join(output, 'great-owl-pass-reference-before-after.png'), Buffer.from(result.card, 'base64'));
    console.log(JSON.stringify({ stage, image:path.join(output,`great-owl-pass-${stage}.png`), comparison:stage==='after'?path.join(output,'great-owl-pass-reference-before-after.png'):null, renderer:'muted Electron; CREATURE_PACK subject.draw', reference:stage==='after'?'Wowhead NPC 85676 Archimedes, Stand, four actual captures':'not required', audioMuted:true, rendererErrors:errors.length }));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { window.destroy(); app.quit(); }
});
