const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'test-output/creature-roster-engine');
fs.mkdirSync(output, { recursive: true });
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-roster-capture-')));

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: { offscreen: true, backgroundThrottling: false },
  });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_event, level, message) => {
    if (level >= 3) errors.push(message);
  });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([
      window.wildboundBoot.ready,
      new Promise((_, reject) => setTimeout(() => reject(Error('Game boot timed out')), 30000))
    ])`);
    const report = await window.webContents.executeJavaScript(`(async () => {
      const { Assets } = await import('./src/assets.mjs');
      const { Renderer } = await import('./src/render.mjs');
      const { RIG_SUBJECTS } = await import('./src/rig-subjects.mjs');
      const { creatures } = await import('./src/definitions.mjs');
      const { EVENTS } = await import('./src/core.mjs');
      const { CREATURE_PACKS } = await import('./src/creature-packs/index.mjs');
      const missingEvents = CREATURE_PACKS.flatMap(pack => pack.events || []).filter(packEvent =>
        !EVENTS.some(event => event.name === packEvent.name));
      if (missingEvents.length) throw Error('Missing runtime event cards: ' + missingEvents.map(event => event.name).join(', '));
      const assets = new Assets();
      await assets.load();
      const renderer = new Renderer(document.createElement('canvas'), assets);
      const labels = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
      const report = [];
      const familyNames = ['Wildlife', 'Eldritch', 'Constructs'];
      for (let familyIndex = 0; familyIndex < CREATURE_PACKS.length; familyIndex++) {
        const pack = CREATURE_PACKS[familyIndex];
        const familyName = familyNames[familyIndex] || 'Creatures ' + (familyIndex + 1);
        const subjects = Object.entries(pack.subjects);
        // Leave headroom above every unit so tall ears, flames, wings, and
        // floating spell accents never collide with family/facing headers.
        const labelW = 214, cellW = 112, cellH = 122, top = 76;
        const canvas = document.createElement('canvas');
        canvas.width = labelW + cellW * 8;
        canvas.height = top + subjects.length * cellH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#10271f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e8d8ad'; ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'left';
        ctx.fillText(familyName, 18, 30);
        ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#9ed6b8';
        labels.forEach((label, facing) => ctx.fillText(label, labelW + facing * cellW + cellW / 2, 64));
        for (let row = 0; row < subjects.length; row++) {
          const [kind, subject] = subjects[row];
          if (!RIG_SUBJECTS[kind] || !creatures[kind]) throw Error('Missing editor/runtime registration: ' + kind);
          const y0 = top + row * cellH;
          ctx.fillStyle = row % 2 ? '#17372e' : '#153329';
          ctx.fillRect(0, y0, canvas.width, cellH);
          ctx.fillStyle = '#f2e4c4'; ctx.font = '12px system-ui'; ctx.textAlign = 'left';
          ctx.fillText(subject.name, 8, y0 + 15);
          const model = subject.defaults();
          for (let facing = 0; facing < 8; facing++) {
            const angle = facing * Math.PI / 4;
            ctx.save();
            ctx.translate(labelW + facing * cellW + cellW / 2, y0 + 84);
            ctx.scale(2.3, 2.3);
            subject.draw(ctx, {
              id: 'roster-' + kind + '-' + facing,
              kind, sprite: kind, skin: kind,
              x: 0, y: 0,
              faceX: Math.sin(angle), faceY: Math.cos(angle),
              state: 'idle', animationAction: 'idle', playerFrame: 0,
              moving: false, aggro: false, hp: 100, maxHp: 100,
              equipment: {}, inventory: [],
            }, 0, model);
            ctx.restore();
          }
        }
        report.push({ name: familyName, count: subjects.length, kinds: subjects.map(([kind]) => kind), png: canvas.toDataURL('image/png').split(',')[1] });
      }
      return report;
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    for (const family of report) {
      fs.writeFileSync(path.join(output, family.name.toLowerCase() + '.png'), Buffer.from(family.png, 'base64'));
      delete family.png;
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    const total = report.reduce((sum, family) => sum + family.count, 0);
    if (total !== 38) throw Error('Expected 38 creature captures after Gray Marmoni removal, got ' + total);
    console.log(JSON.stringify({ output, total, families: report.map(({ name, count }) => ({ name, count })) }));
  } catch (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
  } finally {
    window.destroy();
    app.quit();
  }
});
