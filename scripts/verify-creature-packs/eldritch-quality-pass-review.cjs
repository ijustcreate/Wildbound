const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/creature-art-review');
const baselineCard = path.join(output, 'eldritch-quality-pass-baseline.png');
const initialCard = path.join(output, 'eldritch-quality-pass-card.png');
const items = [
  { kind: 'tree_ent', title: 'Tree Ent · connected leaf crown and branch arms', ref: '71488-blossoming-ancient', crop: [250, 0, 340, 480] },
  { kind: 'jade_tentacle', title: 'Jade Tentacle · single hooked stalk', ref: '66450-jade-tentacle', crop: [150, 30, 320, 420] },
  { kind: 'spore', title: 'Brilliant Spore · irregular connected quills', ref: '86719-brilliant-spore', crop: [250, 30, 360, 400] },
];
const directions = ['S','SW','W','NW','N','NE','E','SE'];
const refs = Object.fromEntries(items.map(item => [item.kind, ['front','side','rear','opposite-side'].map(view => fs.readFileSync(path.join(root, `test-output/modelviewer-references/${item.ref}-${view}-idle.png`)).toString('base64'))]));
if (!fs.existsSync(baselineCard)) {
  if (!fs.existsSync(initialCard)) throw new Error('Run the baseline capture before reusing this focused review.');
  fs.copyFileSync(initialCard, baselineCard);
}
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-eldritch-quality-')));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show:false, width:1680, height:1000, webPreferences:{offscreen:true, backgroundThrottling:false} });
  win.webContents.setAudioMuted(true);
  const errors=[];
  win.webContents.on('console-message',(_event,level,message)=>{ if(level>=3) errors.push(message); });
  try {
    await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const data=await win.webContents.executeJavaScript(`(async()=>{
      const {CREATURE_PACK:AFTER}=await import('./src/creature-packs/eldritch.mjs');
      const items=${JSON.stringify(items)},dirs=${JSON.stringify(directions)},baseline='${fs.readFileSync(baselineCard).toString('base64')}';
      const art=document.createElement('canvas');art.width=1780;art.height=1320;const a=art.getContext('2d');a.imageSmoothingEnabled=false;const oldCard=new Image();oldCard.src='data:image/png;base64,'+baseline;await new Promise((resolve,reject)=>{oldCard.onload=resolve;oldCard.onerror=reject});a.drawImage(oldCard,0,0);
      const draw=(ctx,subject,model,kind,facing,scale)=>{const angle=facing*Math.PI/4;ctx.save();ctx.scale(scale,scale);subject.draw(ctx,{id:'review-'+kind+'-'+facing,kind,x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',moving:false},0,model);ctx.restore()};
      for(let row=0;row<items.length;row++){
        const item=items[row],y=row*440,next=AFTER.subjects[item.kind],newModel=next.defaults();
        a.fillStyle=row%2?'#17372e':'#153329';a.fillRect(470,y+45,640,390);
        a.fillStyle='#d7c8a7';a.font='bold 11px system-ui';a.textAlign='left';a.fillText('AFTER · NATIVE GAME SCALE',490,y+70);a.fillText('AFTER · 2× NEAREST NEIGHBOR',490,y+222);
        for(let f=0;f<8;f++){
          const x=595+f*64;a.textAlign='center';a.fillStyle='#9ed6b8';a.font='9px system-ui';a.fillText(dirs[f],x,y+88);a.fillText(dirs[f],x,y+240);
          a.save();a.translate(x,y+130);draw(a,next,newModel,item.kind,f,1);a.restore();
          a.save();a.translate(x,y+310);draw(a,next,newModel,item.kind,f,2);a.restore();
        }
      }
      const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=items.length*180+80;const s=sheet.getContext('2d');s.imageSmoothingEnabled=false;s.fillStyle='#10271f';s.fillRect(0,0,sheet.width,sheet.height);s.fillStyle='#e8d8ad';s.font='bold 20px system-ui';s.fillText('Eldritch quality pass · after · eight views',12,28);s.fillStyle='#9ed6b8';s.font='12px system-ui';dirs.forEach((d,i)=>s.fillText(d,300+i*110,58));
      for(let row=0;row<items.length;row++){const item=items[row],subject=AFTER.subjects[item.kind],model=subject.defaults(),y=70+row*180;s.fillStyle=row%2?'#17372e':'#153329';s.fillRect(0,y,sheet.width,180);s.fillStyle='#f2e4c4';s.font='12px system-ui';s.fillText(subject.name,12,y+18);for(let f=0;f<8;f++){const angle=f*Math.PI/4;s.save();s.translate(300+f*110,y+110);s.scale(2.3,2.3);subject.draw(s,{id:'quality-after-'+item.kind+'-'+f,kind:item.kind,x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',moving:false},0,model);s.restore();}}
      return {card:art.toDataURL('image/png').split(',')[1],sheet:sheet.toDataURL('image/png').split(',')[1]};
    })()`);
    if(errors.length) throw new Error(errors.join('\n'));
    fs.mkdirSync(output,{recursive:true});
    const cardPath=path.join(output,'eldritch-quality-pass-card.png'),sheetPath=path.join(output,'eldritch-quality-pass-eight-view.png');
    fs.writeFileSync(cardPath,Buffer.from(data.card,'base64'));fs.writeFileSync(sheetPath,Buffer.from(data.sheet,'base64'));
    console.log(JSON.stringify({card:cardPath,sheet:sheetPath,audioMuted:true,rendererErrors:errors.length,subjects:items.map(x=>x.kind)}));
  }catch(error){console.error(error.stack||error);process.exitCode=1;}
  finally{win.destroy();app.quit();}
});
