const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/creature-art-review');
const rosterOut = path.join(root, 'test-output/creature-roster-engine');
const stage = process.env.WILDBOUND_RETRIEVER_STAGE || 'after';
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(rosterOut, { recursive: true });
app.disableHardwareAcceleration(); app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-retriever-review-')));

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1280, height: 800, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_e, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const references = Object.fromEntries(['front','side','rear','opposite-side'].map(view => [view, fs.readFileSync(path.join(root, `test-output/modelviewer-references/120973-golden-retriever-${view}-idle.png`)).toString('base64')]));
    const beforeData = stage === 'after' ? fs.readFileSync(path.join(out, 'golden-retriever-before.png')).toString('base64') : null;
    const payload = await window.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const views=['S','SW','W','NW','N','NE','E','SE'];
      const subject=CREATURE_PACK.subjects.golden_retriever;
      const makeGrid=(label)=>{const canvas=document.createElement('canvas');canvas.width=960;canvas.height=450;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#e8d8ad';c.font='bold 20px system-ui';c.fillText('GOLDEN RETRIEVER · '+label+' · runtime native art',20,30);c.fillStyle='#9ed6b8';c.font='11px system-ui';c.fillStyle='#cbb991';c.font='bold 10px system-ui';c.textAlign='left';c.fillText(label+' · NATIVE',14,92);c.fillText(label+' · CLOSE-UP 3×',14,215);return {canvas,c}};
      const draw8=(c)=>{const model=subject.defaults();for(let f=0;f<8;f++){const a=f*Math.PI/4,cx=70+f*112,actor={id:'golden-retriever-review-'+f,kind:'golden_retriever',x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',playerFrame:0,moving:false,equipment:{}};c.textAlign='center';c.fillStyle='#9ed6b8';c.font='11px system-ui';c.fillText(views[f],cx,58);c.save();c.translate(cx,130);subject.draw(c,actor,0,model);c.restore();c.fillText(views[f],90+f*112,200);c.save();c.translate(90+f*112,350);c.scale(3,3);subject.draw(c,actor,0,model);c.restore()}};
      const after=makeGrid(${JSON.stringify(stage.toUpperCase())});draw8(after.c);
      const refData=${JSON.stringify(references)};
      const refImages=[];for(const view of ['front','side','rear','opposite-side']){const image=new Image();image.src='data:image/png;base64,'+refData[view];await new Promise((r,j)=>{image.onload=r;image.onerror=j});refImages.push({view,image})}
      let cardPng=null,beforeLabelPng=null;
      if(${stage === 'after'}){
        const card=document.createElement('canvas');card.width=1536;card.height=940;const c=card.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,card.width,card.height);c.fillStyle='#e8d8ad';c.font='bold 22px system-ui';c.fillText('GOLDEN RETRIEVER · REFERENCE-BACKED ART REVIEW · UNAPPROVED DRAFT',20,30);c.fillStyle='#a9c3b5';c.font='12px system-ui';c.fillText('Same editable rig, idle pose, camera and native scale. Native rows first; close-up is 3× nearest-neighbor.',20,51);
        const old=new Image();old.src='data:image/png;base64,${beforeData}';await new Promise((r,j)=>{old.onload=r;old.onerror=j});const beforeCanvas=document.createElement('canvas');beforeCanvas.width=old.width;beforeCanvas.height=old.height;const bc=beforeCanvas.getContext('2d');bc.drawImage(old,0,0);bc.fillStyle='#10271f';bc.fillRect(0,0,720,40);bc.fillStyle='#e8d8ad';bc.font='bold 20px system-ui';bc.fillText('GOLDEN RETRIEVER · BEFORE · runtime native art',20,30);bc.fillRect(0,78,170,22);bc.fillRect(0,200,190,22);bc.fillStyle='#cbb991';bc.font='bold 10px system-ui';bc.fillText('BEFORE · NATIVE',14,92);bc.fillText('BEFORE · CLOSE-UP 3×',14,215);beforeLabelPng=beforeCanvas.toDataURL('image/png').split(',')[1];c.drawImage(beforeCanvas,16,62,960,450);c.drawImage(after.canvas,16,480,960,450);c.fillStyle='#e8d8ad';c.font='bold 13px system-ui';c.fillText('SOURCE MODELVIEWER · STAND IDLE',1000,74);
        const put=(img,x,y,w,h)=>c.drawImage(img,x,y,w,h);for(let i=0;i<refImages.length;i++){const {view,image}=refImages[i],x=1000+(i%2)*258,y=88+Math.floor(i/2)*230,maxW=246,maxH=205,s=Math.min(maxW/image.width,maxH/image.height),w=image.width*s,h=image.height*s;c.fillStyle='#cbb991';c.font='bold 10px system-ui';c.fillText(view.toUpperCase(),x,y+10);c.fillStyle='#081815';c.fillRect(x,y+16,maxW,maxH);put(image,x+(maxW-w)/2,y+16+(maxH-h)/2,w,h)}cardPng=card.toDataURL('image/png').split(',')[1];
      }
      const roster=document.createElement('canvas');roster.width=214+112*8;roster.height=76+14*122;const rc=roster.getContext('2d');rc.imageSmoothingEnabled=false;rc.fillStyle='#10271f';rc.fillRect(0,0,roster.width,roster.height);rc.fillStyle='#e8d8ad';rc.font='bold 22px system-ui';rc.fillText('Wildlife · eight directions · native game scale',18,30);rc.font='12px system-ui';rc.textAlign='center';rc.fillStyle='#9ed6b8';views.forEach((v,i)=>rc.fillText(v,214+i*112+56,64));rc.textAlign='left';const entries=Object.entries(CREATURE_PACK.subjects);if(entries.length!==14)throw Error('Expected 14 wildlife subjects, got '+entries.length);for(let row=0;row<entries.length;row++){const[k,s]=entries[row],model=s.defaults(),top=76+row*122;rc.fillStyle=row%2?'#17372e':'#153329';rc.fillRect(0,top,roster.width,122);rc.fillStyle='#f2e4c4';rc.font='12px system-ui';rc.fillText(s.name,8,top+15);for(let f=0;f<8;f++){const a=f*Math.PI/4;rc.save();rc.translate(214+f*112+56,top+84);rc.scale(2.3,2.3);s.draw(rc,{id:'wildlife-review-'+k+'-'+f,kind:k,x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',playerFrame:0,moving:false,hp:100,maxHp:100,equipment:{}},0,model);rc.restore()}}
      return {after:after.canvas.toDataURL('image/png').split(',')[1],before:beforeLabelPng,card:cardPng,roster:roster.toDataURL('image/png').split(',')[1]};
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    if (stage === 'before') fs.writeFileSync(path.join(out,'golden-retriever-before.png'),Buffer.from(payload.after,'base64'));
    else { fs.writeFileSync(path.join(out,'golden-retriever-before.png'),Buffer.from(payload.before,'base64')); fs.writeFileSync(path.join(out,'golden-retriever-after.png'),Buffer.from(payload.after,'base64')); fs.writeFileSync(path.join(out,'golden-retriever-reference-before-after.png'),Buffer.from(payload.card,'base64')); fs.writeFileSync(path.join(rosterOut,'wildlife.png'),Buffer.from(payload.roster,'base64')); }
    console.log(JSON.stringify({stage,before:stage==='before'?path.join(out,'golden-retriever-before.png'):undefined,after:stage==='after'?path.join(out,'golden-retriever-after.png'):undefined,comparison:stage==='after'?path.join(out,'golden-retriever-reference-before-after.png'):undefined,wildlifeRoster:stage==='after'?path.join(rosterOut,'wildlife.png'):undefined,renderer:'muted Electron runtime subject.draw',audioMuted:true,errors:errors.length}));
  } catch (error) { console.error(error.stack||error); process.exitCode=1; }
  finally { window.destroy(); app.quit(); }
});
