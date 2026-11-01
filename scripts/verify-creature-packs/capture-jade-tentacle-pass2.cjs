const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root=path.resolve(__dirname,'../..');
const out=path.join(root,'test-output/final-three-pack-art-review/jade-tentacle-pass2');
const stage=process.env.WILDBOUND_FINAL_TRIO_STAGE||'before';
const targets=[
  {pack:'eldritch',module:'eldritch.mjs',key:'jade_tentacle',label:'Jade Tentacle / linked stalk',ref:'66450-jade-tentacle'},
];
const directions=['S','SW','W','NW','N','NE','E','SE'];
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-final-trio-')));

app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1600,height:900,webPreferences:{offscreen:true,backgroundThrottling:false}});win.webContents.setAudioMuted(true);
  const errors=[];win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message)});
  try{
    await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const refs={};for(const t of targets){refs[t.key]={};for(const view of ['front','side','rear','opposite-side'])refs[t.key][view]=fs.readFileSync(path.join(root,`test-output/modelviewer-references/${t.ref}-${view}-idle.png`)).toString('base64')}
    const beforeData=stage==='after'?JSON.parse(fs.readFileSync(path.join(out,'before.json'),'utf8')):null;
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const targets=${JSON.stringify(targets)},directions=${JSON.stringify(directions)},refs=${JSON.stringify(refs)};
      const packs={};
      for(const t of targets){const {CREATURE_PACK}=await import('./src/creature-packs/'+t.module);packs[t.key]=CREATURE_PACK.subjects[t.key];if(!packs[t.key])throw Error('Missing subject '+t.key)}
      const draw=(ctx,t)=>{const sub=packs[t.key],model=sub.defaults();for(let i=0;i<8;i++){const angle=i*Math.PI/4,actor={id:'final-art-review-'+t.key+'-'+i,kind:t.key,type:t.key,x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',playerFrame:0,poseTime:0,moving:false,hp:100,maxHp:100,equipment:{},faction:'enemy'};const x=72+i*104;ctx.textAlign='center';ctx.fillStyle='#a9c9b9';ctx.font='11px system-ui';ctx.fillText(directions[i],x,0);ctx.save();ctx.translate(x,66);sub.draw(ctx,actor,0,model);ctx.restore();ctx.save();ctx.translate(x,195);ctx.scale(2.4,2.4);sub.draw(ctx,actor,0,model);ctx.restore()}};
      const before=[];
      for(const t of targets){const canvas=document.createElement('canvas');canvas.width=900;canvas.height=260;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,900,260);c.fillStyle='#e8d8ad';c.font='bold 18px system-ui';c.fillText(t.label+' · BEFORE · current native art',18,25);c.fillStyle='#cbb991';c.font='bold 10px system-ui';c.fillText('NATIVE GAMEPLAY VIEW',14,85);c.fillText('CLOSE-UP · 2.4× NEAREST NEIGHBOR',14,215);draw(c,t);before.push({key:t.key,png:canvas.toDataURL('image/png').split(',')[1]})}
      if(${JSON.stringify(stage)}==='before')return {before};
      const card=document.createElement('canvas');card.width=1600;card.height=620;const c=card.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,card.width,card.height);c.fillStyle='#e8d8ad';c.font='bold 22px system-ui';c.fillText('JADE TENTACLE · REFERENCE / BEFORE / AFTER · UNAPPROVED DRAFT',20,30);c.fillStyle='#a9c3b5';c.font='12px system-ui';c.fillText('Same rig, idle pose and eight facings. Gameplay-size row above; 2.4× nearest-neighbor row below.',20,52);
      const oldByKey=Object.fromEntries(${JSON.stringify(beforeData)}.before.map(v=>[v.key,v.png]));
      for(let i=0;i<targets.length;i++){const t=targets[i],top=68+i*548;c.fillStyle=i%2?'#153329':'#17372e';c.fillRect(12,top,1576,536);c.fillStyle='#f2e4c4';c.font='bold 19px system-ui';c.fillText(t.label,22,top+24);
        const old=new Image();old.src='data:image/png;base64,'+oldByKey[t.key];await new Promise((r,j)=>{old.onload=r;old.onerror=j});c.drawImage(old,16,top+34,900,260);
        const next=document.createElement('canvas');next.width=900;next.height=260;const n=next.getContext('2d');n.imageSmoothingEnabled=false;n.fillStyle='#10271f';n.fillRect(0,0,900,260);n.fillStyle='#e8d8ad';n.font='bold 18px system-ui';n.fillText(t.label+' · AFTER · runtime art',18,25);n.fillStyle='#cbb991';n.font='bold 10px system-ui';n.fillText('NATIVE GAMEPLAY VIEW',14,85);n.fillText('CLOSE-UP · 2.4× NEAREST NEIGHBOR',14,215);draw(n,t);c.drawImage(next,16,top+294);
        c.fillStyle='#e8d8ad';c.font='bold 12px system-ui';c.fillText('SAVED SOURCE MODEL-VIEWER TURNAROUNDS · IDLE',940,top+22);
        for(let j=0;j<4;j++){const view=['front','side','rear','opposite-side'][j],image=new Image();image.src='data:image/png;base64,'+refs[t.key][view];await new Promise((r,k)=>{image.onload=r;image.onerror=k});const x=940+(j%2)*315,y=top+32+Math.floor(j/2)*218,maxW=300,maxH=194,scale=Math.min(maxW/image.width,maxH/image.height),w=image.width*scale,h=image.height*scale;c.fillStyle='#cbb991';c.font='bold 10px system-ui';c.fillText(view.toUpperCase(),x,y+10);c.fillStyle='#081815';c.fillRect(x,y+16,maxW,maxH);c.drawImage(image,x+(maxW-w)/2,y+16+(maxH-h)/2,w,h)}
      }
      return {card:card.toDataURL('image/png').split(',')[1]};
    })()`);
    if(errors.length)throw Error(errors.join('\n'));
    if(stage==='before'){fs.writeFileSync(path.join(out,'before.json'),JSON.stringify(result,null,2));for(const v of result.before)fs.writeFileSync(path.join(out,`${v.key}-before.png`),Buffer.from(v.png,'base64'))}
    else fs.writeFileSync(path.join(out,'reference-before-after.png'),Buffer.from(result.card,'base64'));
    console.log(JSON.stringify({stage,output:stage==='before'?path.join(out,'before.json'):path.join(out,'reference-before-after.png'),renderer:'muted Electron runtime subject.draw',audioMuted:true,errors:errors.length}));
  }catch(error){console.error(error.stack||error);process.exitCode=1}finally{win.destroy();app.quit()}
});
