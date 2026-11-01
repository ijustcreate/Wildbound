const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/creature-art-review');
fs.mkdirSync(output, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-bow-capture-')));

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1100, height: 600, webPreferences: { offscreen: true } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Game boot timed out')),30000))])`);
    const png = await window.webContents.executeJavaScript(`(async()=>{
      const { paintItem } = await import('./src/item-art.mjs');
      const { defaultPlayerMotion, directionVector, drawPlayer } = await import('./src/player-motion.mjs');
      const { DEFAULT_APPEARANCE } = await import('./src/appearance.mjs');
      const canvas=document.createElement('canvas');canvas.width=1040;canvas.height=530;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#102d24';ctx.fillRect(0,0,1040,530);
      ctx.fillStyle='#e7d4a4';ctx.font='bold 22px system-ui';ctx.fillText('Violet Wisp Bow · in-game art preview',28,34);
      ctx.font='bold 13px system-ui';ctx.fillText('24px ITEM ICON',38,72);
      const icon=document.createElement('canvas');icon.width=24;icon.height=24;paintItem(icon.getContext('2d'),'umbral_bow');
      ctx.save();ctx.translate(44,90);ctx.scale(8,8);ctx.drawImage(icon,0,0);ctx.restore();
      ctx.font='bold 13px system-ui';ctx.fillText('HELD BOW · ALL 8 FACINGS',248,72);
      const labels=['S','SW','W','NW','N','NE','E','SE'],model=defaultPlayerMotion();
      for(let d=0;d<8;d++){
        const x=300+d*94;
        ctx.fillStyle='#a7d5b4';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(labels[d],x,104);
        const [faceX,faceY]=directionVector(d);
        const actor={id:'bow-preview-'+d,kind:'player',faceX,faceY,hp:100,maxHp:100,appearance:DEFAULT_APPEARANCE,animationAction:'idle',equipment:{hand1:'umbral_bow'},inventory:[{type:'arrow',qty:2}],charge:0};
        ctx.save();ctx.translate(x,270);ctx.scale(4,4);drawPlayer(ctx,actor,0,model);ctx.restore();
        actor.animationAction='draw';actor.charge=.75;
        ctx.fillStyle='#a7d5b4';ctx.font='12px system-ui';ctx.fillText('DRAW',x,380);
        ctx.save();ctx.translate(x,490);ctx.scale(4,4);drawPlayer(ctx,actor,.4,model);ctx.restore();
      }
      ctx.textAlign='left';ctx.fillStyle='#e7d4a4';ctx.font='12px system-ui';ctx.fillText('Dark recurved silhouette · violet-magenta limbs · dark string · pixel art only',28,520);
      return canvas.toDataURL('image/png').split(',')[1];
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    const dest = path.join(output, 'violet-wisp-bow-in-game.png');
    fs.writeFileSync(dest, Buffer.from(png, 'base64'));
    console.log(JSON.stringify({ dest, errors: errors.length }));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { window.destroy(); app.quit(); }
});
