const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/creature-art-review');
const destination = path.join(output, 'hand-and-flight-cycle-review.png');
const facingNames = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const refNames = ['front-idle', 'side-idle', 'rear-idle', 'opposite-side-idle'];
const refs = {
  evil_hand: '179179-clinging-remains',
  butterfly_dragon: '179589-blinky',
};

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-hand-flight-review-')));
fs.mkdirSync(output, { recursive: true });

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1600, height: 1280, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript('Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error("boot timeout")),30000))])');
    const refsBase64 = Object.fromEntries(Object.entries(refs).map(([kind, prefix]) => [kind, refNames.map(name => fs.readFileSync(path.join(root, `test-output/modelviewer-references/${prefix}-${name}.png`)).toString('base64'))]));
    const board = await window.webContents.executeJavaScript(`(async()=>{
      const { CREATURE_PACK } = await import('./src/creature-packs/eldritch.mjs');
      const subjects=[
        {kind:'evil_hand',title:'CLINGING REMAINS · ALTERNATING CRAWL',x:18},
        {kind:'butterfly_dragon',title:'BLINKY · FULL FLIGHT FLAP',x:810},
      ];
      const names=${JSON.stringify(facingNames)}, refs=${JSON.stringify(refsBase64)};
      const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=870;
      const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#10271f';c.fillRect(0,0,canvas.width,canvas.height);
      c.fillStyle='#f0dfb8';c.font='bold 22px system-ui';c.fillText('Native editable animation review · muted Electron · draft',18,28);
      c.fillStyle='#a9c3b5';c.font='12px system-ui';c.fillText('Columns: frame 0–7 · Rows: all eight facings · nearest-neighbor review scale. Source panels show Stand poses only; they are visual reference, not donor motion.',18,48);
      const reports=[];
      for(const spec of subjects){
        c.fillStyle='#f0dfb8';c.font='bold 16px system-ui';c.fillText(spec.title,spec.x,76);
        const subject=CREATURE_PACK.subjects[spec.kind], model=subject.defaults(),labelW=30,cellW=72,cellH=68,top=104;
        for(let frame=0;frame<8;frame++){c.fillStyle='#9ed6b8';c.textAlign='center';c.font='11px system-ui';c.fillText(String(frame),spec.x+labelW+frame*cellW+cellW/2,98);}
        c.textAlign='center';
        for(let facing=0;facing<8;facing++){
          const y=top+facing*cellH;c.fillStyle=facing%2?'#17372e':'#153329';c.fillRect(spec.x,y,labelW+cellW*8,cellH);
          c.fillStyle='#c6d7c7';c.font='10px system-ui';c.fillText(names[facing],spec.x+labelW/2,y+35);
          const angle=facing*Math.PI/4;
          for(let frame=0;frame<8;frame++){
            const x=spec.x+labelW+frame*cellW+cellW/2;
            c.save();c.translate(x,y+cellH/2);c.scale(spec.kind==='evil_hand'?1.8:1.35, spec.kind==='evil_hand'?1.8:1.35);
            subject.draw(c,{id:'anim-review-'+spec.kind+'-'+facing+'-'+frame,kind:spec.kind,x:0,y:0,faceX:Math.sin(angle),faceY:Math.cos(angle),state:'moving',moving:true,playerFrame:frame,aggro:false,hp:100,maxHp:100,equipment:{},inventory:[]},0,model);
            c.restore();
          }
        }
        const refsTop=674,refW=172,refH=145;
        const refLabelNames=['FRONT','SIDE','REAR','OPPOSITE SIDE'];
        for(let index=0;index<4;index++){
          const img=new Image();img.src='data:image/png;base64,'+refs[spec.kind][index];
          await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject});
          const x=spec.x+index*190, y=refsTop;
          c.fillStyle='#f0dfb8';c.font='bold 11px system-ui';c.textAlign='left';c.fillText('SOURCE · '+refLabelNames[index],x,y-8);
          c.fillStyle='#081815';c.fillRect(x,y,refW,refH);
          const crop={sx:245,sy:55,sw:350,sh:410},scale=Math.min(refW/crop.sw,refH/crop.sh),w=crop.sw*scale,h=crop.sh*scale;
          c.drawImage(img,crop.sx,crop.sy,crop.sw,crop.sh,x+(refW-w)/2,y+(refH-h)/2,w,h);
        }
        reports.push({kind:spec.kind,animation:spec.kind==='evil_hand'?'crawl':'fly',facingCount:8,frameCount:8,sourceStandViews:4});
      }
      c.textAlign='left';c.fillStyle='#a9c3b5';c.font='11px system-ui';c.fillText('Native editable rig keys; exact NPC 179179/179589 donor bone mapping and motion transfer unverified.',18,846);
      return {png:canvas.toDataURL('image/png').split(',')[1],reports};
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    fs.writeFileSync(destination, Buffer.from(board.png, 'base64'));
    fs.writeFileSync(path.join(output, 'hand-and-flight-cycle-review.json'), JSON.stringify({ destination, renderer: 'muted Electron; CREATURE_PACK subject.draw', audioMuted: true, rendererErrors: errors, ...board.reports }, null, 2));
    console.log(JSON.stringify({ destination, renderer: 'muted Electron; CREATURE_PACK subject.draw', audioMuted: true, rendererErrors: errors.length, reviews: board.reports }));
  } catch (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
  } finally {
    window.destroy();
    app.quit();
  }
});
