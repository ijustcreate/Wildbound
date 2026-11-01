const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/creature-art-review');
const roster = path.join(root, 'test-output/creature-roster-engine');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(roster, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-owl-review-')));

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1280, height: 800, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_e, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const referenceData = Object.fromEntries(['front','side','rear','opposite-side'].map(view => [view, fs.readFileSync(path.join(root, `test-output/modelviewer-references/85676-archimedes-${view}-idle.png`)).toString('base64')]));
    const beforeData = fs.readFileSync(path.join(out, 'great-owl-before.png')).toString('base64');
    const payload = await window.webContents.executeJavaScript(`(async()=>{
      const { CREATURE_PACK } = await import('./src/creature-packs/eldritch.mjs');
      const subject=CREATURE_PACK.subjects.great_owl, model=subject.defaults();
      const views=['S','SW','W','NW','N','NE','E','SE'];
      const after=document.createElement('canvas');after.width=960;after.height=450;const ac=after.getContext('2d');ac.imageSmoothingEnabled=false;ac.fillStyle='#10271f';ac.fillRect(0,0,after.width,after.height);ac.fillStyle='#e8d8ad';ac.font='bold 20px system-ui';ac.fillText('GREAT OWL · AFTER · runtime native art',20,30);ac.fillStyle='#9ed6b8';ac.font='11px system-ui';
      for(let f=0;f<8;f++){const angle=f*Math.PI/4,cx=70+f*112;ac.textAlign='center';ac.fillText(views[f],cx,58);ac.save();ac.translate(cx,130);subject.draw(ac,{id:'owl-after-'+f,kind:'great_owl',x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',moving:false},0,model);ac.restore();ac.fillText(views[f],90+f*112,200);ac.save();ac.translate(90+f*112,350);ac.scale(3,3);subject.draw(ac,{id:'owl-after-close-'+f,kind:'great_owl',x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',moving:false},0,model);ac.restore()}
      ac.fillStyle='#cbb991';ac.font='bold 10px system-ui';ac.textAlign='left';ac.fillText('AFTER · NATIVE',14,92);ac.fillText('AFTER · CLOSE-UP 3×',14,215);
      const referenceData=${JSON.stringify(referenceData)};
      const card=document.createElement('canvas');card.width=1536;card.height=940;const cc=card.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#10271f';cc.fillRect(0,0,card.width,card.height);cc.fillStyle='#e8d8ad';cc.font='bold 22px system-ui';cc.fillText('GREAT OWL / ARCHIMEDES · REFERENCE-BACKED ART REVIEW · DRAFT',20,30);cc.fillStyle='#a9c3b5';cc.font='12px system-ui';cc.fillText('Same editable rig, pose, camera and native pixel scale. Native rows first; 3× is nearest-neighbor detail only.',20,51);
      const oldImage=new Image();oldImage.src='data:image/png;base64,${beforeData}';await new Promise((resolve,reject)=>{oldImage.onload=resolve;oldImage.onerror=reject});
      const put=(img,x,y,w,h)=>cc.drawImage(img,x,y,w,h);put(oldImage,16,62,960,450);put(after,16,480,960,450);
      // Keep linked model screenshots separate, correctly oriented, and aspect-fit.
      cc.fillStyle='#e8d8ad';cc.font='bold 13px system-ui';cc.fillText('SOURCE MODELVIEWER · IDLE TURNAROUND',1000,74);
      const referencePngs=[];for(const view of ['front','side','rear','opposite-side']){const image=new Image();image.src='data:image/png;base64,'+referenceData[view];await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject});referencePngs.push({view,image})}
      for(let i=0;i<referencePngs.length;i++){const {view, image}=referencePngs[i],x=1000+(i%2)*258,y=88+Math.floor(i/2)*230;cc.fillStyle='#cbb991';cc.font='bold 10px system-ui';cc.fillText(view.toUpperCase(),x,y+10);const maxW=246,maxH=205,scale=Math.min(maxW/image.width,maxH/image.height),w=image.width*scale,h=image.height*scale;cc.fillStyle='#081815';cc.fillRect(x,y+16,maxW,maxH);put(image,x+(maxW-w)/2,y+16+(maxH-h)/2,w,h)}
      const roster=document.createElement('canvas');roster.width=112*8+214;roster.height=60+12*90;const rc=roster.getContext('2d');rc.imageSmoothingEnabled=false;rc.fillStyle='#10271f';rc.fillRect(0,0,roster.width,roster.height);rc.fillStyle='#e8d8ad';rc.font='bold 22px system-ui';rc.fillText('Eldritch · eight directions · native game scale',12,30);rc.font='12px system-ui';rc.fillStyle='#9ed6b8';['S','SW','W','NW','N','NE','E','SE'].forEach((v,i)=>{rc.textAlign='center';rc.fillText(v,214+i*112+56,50)});const entries=Object.entries(CREATURE_PACK.subjects);for(let row=0;row<entries.length;row++){const [kind,s]=entries[row],m=s.defaults(),top=60+row*90;rc.fillStyle=row%2?'#17372e':'#153329';rc.fillRect(0,top,roster.width,90);rc.fillStyle='#f2e4c4';rc.font='12px system-ui';rc.textAlign='left';rc.fillText(s.name,12,top+17);for(let f=0;f<8;f++){const angle=f*Math.PI/4;rc.save();rc.translate(214+f*112+56,top+58);s.draw(rc,{id:'eldritch-roster-'+kind+'-'+f,kind,x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',moving:false},0,m);rc.restore()}}
      return {after:after.toDataURL('image/png').split(',')[1],card:card.toDataURL('image/png').split(',')[1],eldritchRoster:roster.toDataURL('image/png').split(',')[1]};
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(out,'great-owl-after.png'),Buffer.from(payload.after,'base64'));
    fs.writeFileSync(path.join(out,'great-owl-reference-before-after.png'),Buffer.from(payload.card,'base64'));
    fs.writeFileSync(path.join(roster,'eldritch.png'),Buffer.from(payload.eldritchRoster,'base64'));
    console.log(JSON.stringify({after:path.join(out,'great-owl-after.png'),comparison:path.join(out,'great-owl-reference-before-after.png'),roster:path.join(roster,'eldritch.png'),renderer:'muted Electron runtime subject.draw',audioMuted:true,errors:errors.length}));
  } catch (error) { console.error(error.stack||error);process.exitCode=1; }
  finally { window.destroy(); app.quit(); }
});
