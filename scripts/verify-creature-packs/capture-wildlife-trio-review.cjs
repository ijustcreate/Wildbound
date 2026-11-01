const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/creature-art-review');
const stage = process.env.WILDBOUND_WILDLIFE_TRIO_STAGE || 'before';
const targets = [
  { key: 'llama', label: 'Llama / Dottie', id: '151788-dottie' },
  { key: 'triceratops', label: 'Jammer / triceratops', id: '142151-jammer' },
];
const views = ['S','SW','W','NW','N','NE','E','SE'];
const archivedLlamaArt=fs.readFileSync(path.join(root,'test-output/followup-roster-art/wildlife/llama-after.png')).toString('base64');
fs.mkdirSync(out, { recursive: true });
app.disableHardwareAcceleration(); app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildlife-trio-review-')));

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1600, height: 900, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors=[];
  window.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message)});
  try {
    await window.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const refs={};
    for(const target of targets){refs[target.key]={};for(const view of ['front','side','rear','opposite-side'])refs[target.key][view]=fs.readFileSync(path.join(root,`test-output/modelviewer-references/${target.id}-${view}-idle.png`)).toString('base64')}
    const beforeData=stage==='after'?JSON.parse(fs.readFileSync(path.join(out,'wildlife-trio-before.json'),'utf8')):null;
    const payload=await window.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs');
      const views=${JSON.stringify(views)},targets=${JSON.stringify(targets)},refs=${JSON.stringify(refs)},archivedLlamaArt=${JSON.stringify(archivedLlamaArt)};
      const llamaOld=new Image();llamaOld.src='data:image/png;base64,'+archivedLlamaArt;await new Promise((r,j)=>{llamaOld.onload=r;llamaOld.onerror=j});
      const drawPack=(ctx,key)=>{const sub=CREATURE_PACK.subjects[key],model=sub.defaults();for(let i=0;i<8;i++){const a=i*Math.PI/4,actor={id:'trio-review-'+key+'-'+i,kind:key,x:0,y:0,faceX:-Math.sin(a),faceY:Math.cos(a),state:'idle',animationAction:'idle',playerFrame:0,moving:false,hp:100,maxHp:100,equipment:{}};const x=70+i*104;ctx.textAlign='center';ctx.fillStyle='#a6cfb8';ctx.font='11px system-ui';ctx.fillText(views[i],x,0);ctx.save();ctx.translate(x,62);sub.draw(ctx,actor,0,model);ctx.restore();ctx.save();ctx.translate(x,190);ctx.scale(2.25,2.25);sub.draw(ctx,actor,0,model);ctx.restore()} };
      const drawArchivedLlama=(ctx)=>{ctx.fillStyle='#10271f';ctx.fillRect(0,0,880,250);ctx.textAlign='left';ctx.fillStyle='#e8d8ad';ctx.font='bold 18px system-ui';ctx.fillText('Llama · BEFORE · archived pixel art study',16,25);ctx.fillStyle='#cbb991';ctx.font='bold 10px system-ui';ctx.fillText('NATIVE ART',16,83);ctx.fillText('ENLARGED ART',16,208);const sw=llamaOld.width/8,sh=llamaOld.height;for(let i=0;i<8;i++){const x=70+i*104;ctx.textAlign='center';ctx.fillStyle='#a6cfb8';ctx.font='11px system-ui';ctx.fillText(views[i],x,45);ctx.imageSmoothingEnabled=false;ctx.drawImage(llamaOld,i*sw,0,sw,sh,x-28,50,56,61);ctx.drawImage(llamaOld,i*sw,0,sw,sh,x-45,146,90,98)}};
      const sections=[];
      for(const t of targets){const before=document.createElement('canvas');before.width=880;before.height=250;const b=before.getContext('2d');b.imageSmoothingEnabled=false;b.fillStyle='#10271f';b.fillRect(0,0,before.width,before.height);b.fillStyle='#e8d8ad';b.font='bold 18px system-ui';b.fillText(t.label+' · BEFORE · native art',16,25);b.fillStyle='#cbb991';b.font='bold 10px system-ui';b.fillText('NATIVE VIEW',16,83);b.fillText('CLOSE-UP 2.25×',16,208);drawPack(b,t.key);
        if(t.key==='llama')drawArchivedLlama(b);
        sections.push({key:t.key,before:before.toDataURL('image/png').split(',')[1]});
      }
      if(${JSON.stringify(stage)}==='before')return {sections};
      const card=document.createElement('canvas');card.width=1540;card.height=1210;const c=card.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,card.width,card.height);c.fillStyle='#e8d8ad';c.font='bold 22px system-ui';c.fillText('WILDLIFE SILHOUETTE PASS · REFERENCE / BEFORE / AFTER · UNAPPROVED DRAFT',20,30);c.fillStyle='#a9c3b5';c.font='12px system-ui';c.fillText('Same eight facings, native rig and idle pose. Top rows are native gameplay scale; lower rows are enlarged nearest-neighbor previews.',20,52);
      const beforeByKey=Object.fromEntries(${JSON.stringify(beforeData)}.sections.map(x=>[x.key,x.before]));
      const refByKey=${JSON.stringify(refs)};
      for(let i=0;i<targets.length;i++){
        const t=targets[i],top=68+i*560;c.fillStyle=i%2?'#153329':'#17372e';c.fillRect(12,top,1516,548);c.fillStyle='#f2e4c4';c.font='bold 19px system-ui';c.fillText(t.label,22,top+24);
        const old=new Image();old.src='data:image/png;base64,'+beforeByKey[t.key];await new Promise((r,j)=>{old.onload=r;old.onerror=j});c.drawImage(old,16,top+34,880,250);
        const after=document.createElement('canvas');after.width=880;after.height=250;const a=after.getContext('2d');a.imageSmoothingEnabled=false;a.fillStyle='#10271f';a.fillRect(0,0,880,250);a.fillStyle='#e8d8ad';a.font='bold 18px system-ui';a.fillText(t.label+' · AFTER · native art',16,25);a.fillStyle='#cbb991';a.font='bold 10px system-ui';a.fillText('NATIVE VIEW',16,83);a.fillText('CLOSE-UP 2.25×',16,208);drawPack(a,t.key);c.drawImage(after,16,top+288);
        c.fillStyle='#e8d8ad';c.font='bold 12px system-ui';c.fillText('SOURCE MODELVIEWER · STAND IDLE',920,top+22);
        for(let j=0;j<4;j++){const view=['front','side','rear','opposite-side'][j],img=new Image();img.src='data:image/png;base64,'+refByKey[t.key][view];await new Promise((r,k)=>{img.onload=r;img.onerror=k});const x=920+(j%2)*296,y=top+32+Math.floor(j/2)*210,maxW=284,maxH=188,s=Math.min(maxW/img.width,maxH/img.height),w=img.width*s,h=img.height*s;c.fillStyle='#cbb991';c.font='bold 10px system-ui';c.fillText(view.toUpperCase(),x,y+10);c.fillStyle='#081815';c.fillRect(x,y+16,maxW,maxH);c.drawImage(img,x+(maxW-w)/2,y+16+(maxH-h)/2,w,h)}
      }
      return {card:card.toDataURL('image/png').split(',')[1]};
    })()`);
    if(errors.length)throw Error(errors.join('\n'));
    if(stage==='before'){
      fs.writeFileSync(path.join(out,'wildlife-trio-before.json'),JSON.stringify(payload,null,2));
      for(const section of payload.sections)fs.writeFileSync(path.join(out,`wildlife-trio-${section.key}-before.png`),Buffer.from(section.before,'base64'));
    } else fs.writeFileSync(path.join(out,'wildlife-trio-reference-before-after.png'),Buffer.from(payload.card,'base64'));
    console.log(JSON.stringify({stage,output:stage==='before'?path.join(out,'wildlife-trio-before.json'):path.join(out,'wildlife-trio-reference-before-after.png'),renderer:'muted Electron runtime subject.draw',audioMuted:true,errors:errors.length}));
  }catch(error){console.error(error.stack||error);process.exitCode=1}
  finally{window.destroy();app.quit()}
});
