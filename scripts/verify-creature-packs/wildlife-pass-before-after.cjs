const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/creature-art-review');
const before = fs.readFileSync(path.join(out, 'wildlife-family-before.png')).toString('base64');
const after = fs.readFileSync(path.join(root, 'test-output/creature-roster-engine/wildlife.png')).toString('base64');
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildlife-pass-card-')));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1900, height: 1080, webPreferences: { offscreen: true } });
  win.webContents.setAudioMuted(true);
  try {
    await win.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await win.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Game boot timed out')),30000))])`);
    const png = await win.webContents.executeJavaScript(`(async()=>{
      const load=async b64=>{const i=new Image();i.src='data:image/png;base64,'+b64;await new Promise((r,j)=>{i.onload=r;i.onerror=j});return i};
      const [before,after]=await Promise.all([load('${before}'),load('${after}')]);
      const labels=['Amethyst softshell snail','Copperfur fox kit','Flipper / ice penguin','Jammer / triceratops','Tiny direhorn / baby triceratops','Turkey'];
      const rowIndexes=[0,2,4,9,12,13], c=document.createElement('canvas'), sourceTop=76,rowH=(before.height-sourceTop)/14;
      const panelW=before.width,cellW=panelW/8,rowCardH=190;c.width=panelW*2+40;c.height=70+labels.length*rowCardH;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#10271f';x.fillRect(0,0,c.width,c.height);
      x.fillStyle='#eadbb6';x.font='bold 22px system-ui';x.fillText('Wildlife art pass · BEFORE / AFTER · matched runtime captures',20,32);
      x.fillStyle='#a8c6b2';x.font='13px system-ui';x.fillText('Matched facings at identical gameplay scale. AFTER columns are aligned to the original capture order.',20,53);
      const top=70;
      for(let i=0;i<labels.length;i++){
        const y=top+i*rowCardH,sy=sourceTop+rowIndexes[i]*rowH;
        x.fillStyle=i%2?'#153329':'#18372d';x.fillRect(0,y,c.width,rowCardH-3);
        x.fillStyle='#f1e3c0';x.font='bold 15px system-ui';x.fillText(labels[i],18,y+21);
        x.fillStyle='#e4ca92';x.font='bold 11px system-ui';x.fillText('BEFORE',18,y+43);x.fillText('AFTER',panelW+28,y+43);
        for(let f=0;f<8;f++){
          const beforeX=f*cellW,afterView=(f+4)%8,destX=20+f*cellW;
          x.textAlign='center';x.fillStyle='#a9d3b7';x.font='9px system-ui';x.fillText('view '+f,destX+cellW/2,y+57);
          x.drawImage(before,beforeX,sy,cellW,rowH,destX,y+62,cellW,rowH);
          x.drawImage(after,afterView*cellW,sy,cellW,rowH,panelW+20+f*cellW,y+62,cellW,rowH);
        }
      }
      return c.toDataURL('image/png').split(',')[1];
    })()`);
    const dest = path.join(out, 'wildlife-pass-before-after.png');
    fs.writeFileSync(dest, Buffer.from(png, 'base64'));
    console.log(JSON.stringify({ dest }));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { win.destroy(); app.quit(); }
});
