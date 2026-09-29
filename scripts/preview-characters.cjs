// Render the shared game/studio character renderer with the authored animation rig.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-output');
fs.mkdirSync(out, { recursive: true });
app.setPath('userData', fs.mkdtempSync(path.join(out, 'character-preview-')));
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
  await win.loadFile(path.join(root, 'index.html'));
  const moduleURL = pathToFileURL(path.join(root, 'src/player-motion.mjs')).href;
  const rig = JSON.parse(fs.readFileSync(path.join(root, 'authored/rigs.json'), 'utf8')).player;
  const png = await win.webContents.executeJavaScript(`(async () => {
    const {drawPlayer, directionVector} = await import(${JSON.stringify(moduleURL)});
    const model = ${JSON.stringify(rig)};
    const canvas = document.createElement('canvas');
    canvas.width = 1120; canvas.height = 900;
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
    c.fillStyle = '#152b29'; c.fillRect(0,0,1120,900);
    c.fillStyle = '#ead8a8'; c.font = 'bold 24px sans-serif';
    c.fillText('WILDBOUND / CHARACTER STUDY',28,38);
    c.font = '14px sans-serif';
    c.fillText('Shared runtime renderer · authored rig · eight directions · 4× native pixels',28,65);
    const rows = [
      {label:'Explorer / idle', appearance:{skin:'#d9ab76',shirt:'#bb8c35',pants:'#655039',shoes:'#49372d',hair:'crop',hairColor:'#593923'}},
      {label:'Explorer / run', animationAction:'run', appearance:{skin:'#d9ab76',shirt:'#bb8c35',pants:'#655039',shoes:'#49372d',hair:'crop',hairColor:'#593923'}},
      {label:'Custom appearance', appearance:{skin:'#865437',shirt:'#39745b',pants:'#454d69',shoes:'#49372d',hair:'curls',hairColor:'#272c35'}},
      {label:'Equipment / idle', equipment:{hand1:'sword',hand2:'shield'}, appearance:{skin:'#f2d6b3',shirt:'#46799e',pants:'#49372d',shoes:'#272c35',hair:'ponytail',hairColor:'#a94955'}},
    ];
    rows.forEach((row,i)=>{
      const y=104+i*195;
      c.fillStyle='#c7bb96'; c.font='14px sans-serif';c.fillText(row.label,28,y);
      for(let d=0;d<8;d++) {
        const x=76+d*138;
        c.fillStyle = i%2 ? '#203b36' : '#1c3532'; c.fillRect(x-48,y+10,96,165);
        c.save(); c.translate(x,y+160); c.scale(4,4);
        c.fillStyle='#101f20'; c.beginPath();c.ellipse(0,1,8,2,0,0,Math.PI*2);c.fill();
        const [faceX,faceY]=directionVector(d);
        drawPlayer(c,{equipment:{},inventory:[],faceX,faceY,...row},0.16,model);
        c.restore();
      }
    });
    return canvas.toDataURL('image/png').split(',')[1];
  })()`);
  const file = path.join(out,'character-study.png');
  fs.writeFileSync(file,Buffer.from(png,'base64'));
  console.log(file); app.exit(0);
}).catch(error=>{console.error(error);app.exit(1);});
