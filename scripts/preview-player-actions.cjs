// Export every current player animation from the native renderer.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const out = process.env.WILDBOUND_ART_OUTPUT
  ? path.resolve(root, process.env.WILDBOUND_ART_OUTPUT)
  : path.join(root, 'art', 'player', 'animations', 'base-native-v1');
fs.mkdirSync(out, { recursive: true });

app.setPath('userData', fs.mkdtempSync(path.join(root, 'test-output', 'player-actions-')));
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
  await win.loadFile(path.join(root, 'index.html'));
  const moduleURL = pathToFileURL(path.join(root, 'src', 'player-motion.mjs')).href;
  const rig = JSON.parse(fs.readFileSync(path.join(root, 'authored', 'rigs.json'), 'utf8')).player;

  const result = await win.webContents.executeJavaScript(`(async () => {
    const { drawPlayer, directionVector } = await import(${JSON.stringify(moduleURL)});
    const model = ${JSON.stringify(rig)};
    const appearance = {
      skin: '#d9ab76', shirt: '#bb8c35', pants: '#655039', shoes: '#49372d',
      hair: 'crop', hairColor: '#593923'
    };
    const actions = Object.keys(model.clips);
    const images = [];
    const safeName = value => value.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();

    for (const action of actions) {
      const clip = model.clips[action];
      const canvas = document.createElement('canvas');
      canvas.width = 1120;
      canvas.height = 900;
      const c = canvas.getContext('2d');
      c.imageSmoothingEnabled = false;
      c.fillStyle = '#343452';
      c.fillRect(0, 0, canvas.width, canvas.height);
      c.fillStyle = '#eadb7c';
      c.font = 'bold 24px sans-serif';
      c.fillText('WILDBOUND / PLAYER ' + action.toUpperCase() + ' · 8 DIRECTIONS', 28, 38);
      c.fillStyle = '#c2b8d8';
      c.font = '14px sans-serif';
      c.fillText('Current game renderer · base gear · one rig · fixed ground anchor', 28, 65);

      const directions = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
      directions.forEach((label, d) => {
        const y = 105 + d * 98;
        c.fillStyle = '#c2b8d8';
        c.font = '14px sans-serif';
        c.fillText(label, 24, y + 24);
        c.strokeStyle = '#4b4b68';
        c.beginPath(); c.moveTo(70, y + 60); c.lineTo(1080, y + 60); c.stroke();
        for (let frame = 0; frame < 8; frame++) {
          const x = 120 + frame * 120;
          c.save();
          c.translate(x, y + 56);
          c.scale(3, 3);
          const [faceX, faceY] = directionVector(d);
          const sampledFrame = clip.length <= 1 ? 0 : (frame / 7) * (clip.length - 1);
          drawPlayer(c, {
            equipment: {}, inventory: [], appearance, faceX, faceY,
            animationAction: action, playerFrame: sampledFrame
          }, 0.16, model);
          c.restore();
          c.fillStyle = '#c2b8d8';
          c.font = '12px sans-serif';
          c.fillText(String(frame), x - 4, y + 82);
        }
      });
      images.push({ action, frames: clip.length, file: 'player-' + safeName(action) + '-8dir.png', data: canvas.toDataURL('image/png').split(',')[1] });
    }
    return images;
  })()`);

  for (const image of result) {
    fs.writeFileSync(path.join(out, image.file), Buffer.from(image.data, 'base64'));
  }
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({
    source: 'src/player-motion.mjs + authored/rigs.json',
    equipment: 'base gear',
    directions: ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'],
    framesPerSheet: 8,
    animations: result.map(({ action, frames, file }) => ({ action, sourceFrames: frames, file }))
  }, null, 2));
  console.log(JSON.stringify({ output: out, animations: result.length, files: result.map(i => i.file) }));
  app.exit(0);
}).catch(error => { console.error(error); app.exit(1); });
