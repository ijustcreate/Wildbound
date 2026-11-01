const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/creature-art-review');
fs.mkdirSync(out, { recursive: true });
const before = fs.readFileSync(path.join(root, 'test-output/creature-roster-engine/wildlife.png')).toString('base64');
const references = Object.fromEntries(['front','side','rear3q','rear'].map(view => [view, fs.readFileSync(path.join(root, `test-output/modelviewer-references/softshell-${view}-stand.png`)).toString('base64')]));
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-snail-art-')));

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show:false, width:1280, height:800, webPreferences:{offscreen:true,backgroundThrottling:false} });
  window.webContents.setAudioMuted(true);
  const errors=[];
  window.webContents.on('console-message',(_event,level,message)=>{if(level>=3)errors.push(message);});
  try {
    await window.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const result=await window.webContents.executeJavaScript(`(async()=>{
      const { CREATURE_PACK }=await import('./src/creature-packs/wildlife.mjs');
      const subject=CREATURE_PACK.subjects.snail,model=subject.defaults();
      const labels=['S','SW','W','NW','N','NE','E','SE'];
      const cellW=74,cellH=74,left=22,top=40;
      const canvas=document.createElement('canvas');canvas.width=1220;canvas.height=432;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      ctx.fillStyle='#102d24';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#eadab0';ctx.font='bold 16px system-ui';ctx.fillText('Amethyst softshell snail · art study / not approved',22,24);
      ctx.font='12px system-ui';ctx.fillStyle='#b9c8b6';ctx.fillText('Matching facing + native runtime scale · front, diagonals, profile, rear',24,299);
      const drawRow=(y,title,draw)=>{
        ctx.fillStyle='#eadab0';ctx.font='bold 12px system-ui';ctx.fillText(title,8,y+12);
        for(let facing=0;facing<8;facing++){
          const x=left+facing*cellW+cellW/2;
          ctx.fillStyle='#9ed6b8';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(labels[facing],x,y+24);
          ctx.save();ctx.translate(x,y+57);ctx.scale(2.3,2.3);draw(ctx,facing);ctx.restore();
        }
        ctx.textAlign='left';
      };
      const beforeImg=new Image();beforeImg.src='data:image/png;base64,${before}';await new Promise((resolve,reject)=>{beforeImg.onload=resolve;beforeImg.onerror=reject;});
      drawRow(top,'BEFORE', (c,f)=>c.drawImage(beforeImg,((f+4)%8)*112+15,68,82,78,-41/2.3,-35/2.3,82/2.3,78/2.3));
      drawRow(top+104,'AFTER', (c,f)=>subject.draw(c,{id:'snail-review-'+f,x:0,y:0,faceX:-Math.sin(f*Math.PI/4),faceY:Math.cos(f*Math.PI/4),state:'idle',animationAction:'idle',moving:false},0,model));
      ctx.fillStyle='#eadab0';ctx.font='bold 12px system-ui';ctx.fillText('SOURCE REFERENCE · WOWHEAD STAND',620,top+10);
      const refs=[['FRONT','front'],['SIDE','side'],['REAR THREE-QUARTER','rear3q'],['REAR','rear']];
      for(let i=0;i<refs.length;i++){
        const [label,key]=refs[i],x=620+(i%2)*298,y=top+20+Math.floor(i/2)*184;
        ctx.fillStyle='#d4c3a6';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText(label,x,y+10);
        const ref=new Image();ref.src='data:image/png;base64,${references.front}';
        ref.src='data:image/png;base64,'+({front:'${references.front}',side:'${references.side}',rear3q:'${references.rear3q}',rear:'${references.rear}'})[key];
        await new Promise((resolve,reject)=>{ref.onload=resolve;ref.onerror=reject;});
        ctx.drawImage(ref,x,y+14,284,162);
      }
      return canvas.toDataURL('image/png').split(',')[1];
    })()`);
    if(errors.length)throw Error(errors.join('\n'));
    const dest=path.join(out,'softshell-before-after-reference.png');
    fs.writeFileSync(dest,Buffer.from(result,'base64'));
    console.log(JSON.stringify({dest,renderer:'Wildbound runtime subject.draw callback',errors:errors.length}));
  } catch (error) { console.error(error.stack||error);process.exitCode=1; }
  finally { window.destroy();app.quit(); }
});
