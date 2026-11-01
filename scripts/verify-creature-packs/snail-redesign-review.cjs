const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'test-output/creature-art-review');
const inputs={
  before:'softshell-before-after-reference.png',
  front:'../modelviewer-references/softshell-front-stand.png',
  side:'../modelviewer-references/softshell-side-stand.png',
  rear:'../modelviewer-references/softshell-rear-stand.png',
};
const data=Object.fromEntries(Object.entries(inputs).map(([k,f])=>[k,fs.readFileSync(path.join(out,f)).toString('base64')]));
app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'snail-redesign-')));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1500,height:700,webPreferences:{offscreen:true,backgroundThrottling:false}});win.webContents.setAudioMuted(true);
  const errors=[];win.webContents.on('console-message',(_e,l,m)=>{if(l>=3)errors.push(m)});
  try{
    await win.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,r)=>setTimeout(()=>r(Error('boot timeout')),30000))])`);
    const png=await win.webContents.executeJavaScript(`(async()=>{
      const payload=${JSON.stringify(data)},load=async k=>{const i=new Image();i.src='data:image/png;base64,'+payload[k];await new Promise((r,j)=>{i.onload=r;i.onerror=j});return i};
      const [before,front,side,rear]=await Promise.all(['before','front','side','rear'].map(load));
      const {CREATURE_PACK}=await import('./src/creature-packs/wildlife.mjs'),subject=CREATURE_PACK.subjects.snail,model=subject.defaults();
      const labels=Array.from({length:8},(_,i)=>'view '+i),cell=94;
      const canvas=document.createElement('canvas');canvas.width=1760;canvas.height=580;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
      c.fillStyle='#102d24';c.fillRect(0,0,canvas.width,canvas.height);
      c.fillStyle='#f1e3c0';c.font='bold 20px system-ui';c.fillText('Amethyst Softshell · native pixel art redesign study · NOT APPROVED',18,30);
      c.font='12px system-ui';c.fillStyle='#aac6b4';c.fillText('BEFORE and AFTER at matched gameplay renderer scale · eight facings · muted Electron capture',18,52);
      c.font='bold 12px system-ui';c.fillStyle='#e2c996';c.fillText('BEFORE',16,83);c.fillText('AFTER',16,230);
      for(let f=0;f<8;f++){
        const x=40+f*cell;c.textAlign='center';c.font='10px system-ui';c.fillStyle='#a9d3b7';c.fillText(labels[f],x+cell/2,80);
        const sx=22+f*74;
        c.drawImage(before,sx,58,74,72,x+6,86,cell-12,84);
        c.save();c.translate(x+cell/2,340);c.scale(2.3,2.3);
        subject.draw(c,{id:'snail-redesign-'+f,kind:'snail',x:0,y:0,faceX:Math.sin(f*Math.PI/4),faceY:-Math.cos(f*Math.PI/4),state:'idle',animationAction:'idle',playerFrame:0,moving:false},0,model);
        c.restore();c.textAlign='center';c.font='10px system-ui';c.fillStyle='#a9d3b7';c.fillText(labels[f],x+cell/2,378);
      }
      c.textAlign='left';c.fillStyle='#e2c996';c.font='bold 12px system-ui';c.fillText('SOURCE REFERENCE · WOWHEAD STAND',820,78);
      for(const [i,[name,img]] of [['FRONT',front],['SIDE',side],['REAR',rear]].entries()){
        const x=820+i*310;c.fillStyle='#d8c99f';c.font='10px system-ui';c.fillText(name,x,101);c.drawImage(img,x,110,290,190);
      }
      c.fillStyle='#eee0bd';c.font='12px system-ui';c.fillText('Visual gate: horizontal foot, short head and paired eyestalks must read as one grounded snail at this scale.',820,344);
      return canvas.toDataURL('image/png').split(',')[1];
    })()`);
    if(errors.length)throw Error(errors.join('\n'));
    const dest=path.join(out,'snail-redesign-before-after-reference.png');fs.writeFileSync(dest,Buffer.from(png,'base64'));
    console.log(JSON.stringify({dest,renderer:'muted Electron actual wildlife subject.draw',errors:errors.length}));
  }catch(e){console.error(e.stack||e);process.exitCode=1}finally{win.destroy();app.quit()}
});
