const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'test-output/creature-art-review');
fs.mkdirSync(out, { recursive: true });
const sourcePath = path.join(root, 'src/creature-packs/eldritch.mjs');
const beforePath = path.join(root, 'src/creature-packs/.eldritch-before-art-review.mjs');
let beforeSource = fs.readFileSync(sourcePath, 'utf8');
const replaceOnce = (from, to) => {
  if (!beforeSource.includes(from)) throw new Error(`Unable to derive isolated BEFORE renderer: ${from.slice(0, 60)}`);
  beforeSource = beforeSource.replace(from, to);
};
const replaceRegexOnce = (pattern, replacement) => {
  const next = beforeSource.replace(pattern, replacement);
  if (next === beforeSource) throw new Error(`Unable to derive isolated BEFORE renderer: ${pattern}`);
  beforeSource = next;
};
if (process.env.WILDBOUND_BUTTERFLY_REVIEW === '1') {
  // Derive the exact immediately-before Butterfly Dragon art: restore only
  // the detached accents this review removes, leaving all other art unchanged.
  replaceOnce("link(`wingRoot${side}`, `wingFinger${side}`, 6, pal.outline); link(`wingRoot${side}`, `wingFinger${side}`, 4, pal.body);", "link(`wingRoot${side}`, `wingFinger${side}`, 6, pal.outline); link(`wingRoot${side}`, `wingFinger${side}`, 4, pal.accent);");
  replaceOnce("if (finger) pixel(c, finger, -1, -1, 2, 2, pal.light);", "if (finger) pixel(c, finger, -1, -1, 2, 2, pal.accent);");
  replaceOnce("link(b, paw, 3, pal.light); }", "link(b, paw, 3, pal.light); pixel(c, p[paw], -2, 0, 4, 1, pal.accent); }");
  replaceOnce("blob(c, p.tailTip, 3, 2, pal.body);", "blob(c, p.tailTip, 4, 3, pal.accent);");
  fs.writeFileSync(beforePath, beforeSource, 'utf8');
} else {
// Recreate the just-before-pass art in an isolated module. This prevents old
// roster labels from being part of any BEFORE sprite.
replaceOnce("const a = (i / count) * Math.PI * 2, r = kind === 'arcane_eye' ? 12 : 7;", "const a = (i / count) * Math.PI * 2, r = kind === 'arcane_eye' ? 12 : 9;");
replaceOnce("const reach = kind === 'arcane_eye' ? 10 : 4;\n      j[`${id}Tip`] = joint(id, Math.round(Math.cos(a) * (r + reach)), Math.round(Math.sin(a) * (r + reach + 1)), 29 + (i % 3) * 5);", "j[`${id}Tip`] = joint(id, Math.round(Math.cos(a) * (r + 10)), Math.round(Math.sin(a) * (r + 11)), 29 + (i % 3) * 5);");
replaceOnce("pelvis: joint('', 0, owl ? 0 : -5, 13), chest: joint('pelvis', 0, owl ? 1 : 5, 22),", "pelvis: joint('', 0, 0, 13), chest: joint('pelvis', 0, 1, 22),");
replaceOnce("neck: joint('chest', 0, owl ? 2 : 8, 29), head: joint('neck', 0, owl ? 3 : 11, 34),", "neck: joint('chest', 0, 2, 29), head: joint('neck', 0, 3, 34),");
replaceOnce("beak: joint('head', 0, owl ? 7 : 11, owl ? 31 : 29),\n      tailTip: joint('pelvis', 0, owl ? -13 : -23, 13),", "beak: joint('head', 0, 8, 31), tailTip: joint('pelvis', 0, -13, 13),");
replaceOnce("[`wingRoot${s}`]: joint('chest', n * (owl ? 6 : 8), -2, 23),", "[`wingRoot${s}`]: joint('chest', n * 6, -2, 23),");
replaceOnce("[`wingTip${s}`]: joint(`wingRoot${s}`, n * (owl ? 22 : 28), owl ? -1 : -5, owl ? 24 : 20),", "[`wingTip${s}`]: joint(`wingRoot${s}`, n * (kind === 'great_owl' ? 26 : 22), -3, 22),");
replaceOnce("[`wingFinger${s}`]: joint(`wingRoot${s}`, n * (owl ? 17 : 23), owl ? 10 : 13, owl ? 17 : 15),", "[`wingFinger${s}`]: joint(`wingRoot${s}`, n * 20, 9, 17),");
replaceOnce("eye_tentacle: { body: '#934450', shade: '#542b3c', light: '#c66d66', accent: '#edaa74', face: '#e6c0a4', eye: '#ffe279', outline: '#30202f' },", "eye_tentacle: { body: '#4b8279', shade: '#294d50', light: '#8ebc9c', accent: '#a84f73', face: '#d89a80', eye: '#f6df82', outline: '#203b3c' },");
replaceOnce("      const rootWidth = kind === 'watcher' ? 4 : 5, shaftWidth = kind === 'watcher' ? 3 : 4;\n      // Long, rounded arms identify the Arcane Eye; the sentry keeps four\n      // short sensors close to its body so it cannot read as a smaller clone.\n      link('body', `stalk${i}`, rootWidth, pal.outline);\n      link('body', `stalk${i}`, rootWidth - 2, pal.shade);\n      link(`stalk${i}`, `stalk${i}Tip`, shaftWidth, pal.outline);\n      link(`stalk${i}`, `stalk${i}Tip`, shaftWidth - 1.5, pal.body);\n      blob(c, p[`stalk${i}Tip`], kind === 'watcher' ? 2 : 2.5, kind === 'watcher' ? 1.5 : 2, pal.body);", "      if (kind === 'arcane_eye') { link('body', `stalk${i}`, 5, pal.outline); link('body', `stalk${i}`, 3, pal.shade); }\n      link(`stalk${i}`, `stalk${i}Tip`, 4, pal.shade);\n      blob(c, p[`stalk${i}Tip`], 3, 2, pal.body);");
replaceOnce("    bodyMass(c, p.body, kind === 'watcher' ? 6 : 10, kind === 'watcher' ? 6 : 9, pal);\n    if (kind === 'watcher') { blob(c, { ...p.body, y: p.body.y - 6 }, 6, 1.5, pal.accent); pixel(c, p.body, -2, -5, 4, 1, pal.light); }\n    blob(c, p.eye, kind === 'watcher' ? 4.5 : 6, kind === 'watcher' ? 4 : 5, pal.outline); blob(c, p.eye, kind === 'watcher' ? 3 : 4, kind === 'watcher' ? 2.8 : 3.5, pal.face); eye(c, p.eye, pal, true, kind === 'watcher' ? .9 : 1.2);", "    bodyMass(c, p.body, kind === 'watcher' ? 8 : 10, kind === 'watcher' ? 7 : 9, pal);\n    if (kind === 'watcher') { blob(c, { ...p.body, y: p.body.y - 9 }, 10, 2, pal.accent); pixel(c, p.body, -2, -8, 4, 1, pal.light); }\n    blob(c, p.eye, 6, 5, pal.outline); blob(c, p.eye, 4, 3.5, pal.face); eye(c, p.eye, pal, true, 1.2);");
replaceOnce("      pixelTriangle(c, root, finger, tip, pal.outline, pal.shade);\n      link(`wingRoot${side}`, `wingTip${side}`, owl ? 7 : 5, pal.shade);", "      link(`wingRoot${side}`, `wingTip${side}`, kind === 'great_owl' ? 7 : 5, pal.shade);");
replaceOnce("link(`wingRoot${side}`, `wingTip${side}`, owl ? 4 : 3, pal.body);\n      link(`wingRoot${side}`, `wingFinger${side}`, owl ? 3 : 2, owl ? pal.light : pal.accent);", "link(`wingRoot${side}`, `wingTip${side}`, kind === 'great_owl' ? 4 : 3, pal.body);\n      link(`wingRoot${side}`, `wingFinger${side}`, 2, pal.light);");
replaceOnce("if (root && tip && finger) { pixel(c, root, -2, -1, 4, 3, pal.accent); pixel(c, tip, -2, -1, 3, 2, pal.light); pixel(c, finger, -1, -1, 3, 1, pal.face); }", "if (root && tip && finger) { pixel(c, root, -2, -1, 4, 3, pal.accent); pixel(c, tip, -2, -1, 3, 2, pal.light); pixel(c, finger, -1, -1, 3, 1, pal.face); }");
replaceOnce("bodyMass(c, p.chest, owl ? 10 : 6, owl ? 11 : 8, pal);", "bodyMass(c, p.chest, kind === 'great_owl' ? 8 : 7, kind === 'great_owl' ? 11 : 8, pal);");
replaceOnce("link('pelvis', 'chest', owl ? 9 : 6, pal.body); link('chest', 'neck', owl ? 7 : 4, pal.light); link('neck', 'head', owl ? 6 : 4, pal.body);", "link('pelvis', 'chest', 7, pal.body); link('chest', 'neck', 6, pal.light); link('neck', 'head', 5, pal.body);");
replaceOnce("bodyMass(c, p.head, owl ? 8 : 5, owl ? 7 : 5, pal);", "bodyMass(c, p.head, kind === 'great_owl' ? 7 : 5, 6, pal);");
replaceRegexOnce(/    if \(owl\) \{[\s\S]*?    \}\n    headEye\('eyeL'\);/, "    headEye('eyeL');");
replaceOnce("link('head', 'beak', owl ? 3 : 5, pal.accent); pixel(c, p.beak, -1, -1, owl ? 2 : 3, 2, pal.light);", "link('head', 'beak', 4, pal.accent); pixel(c, p.beak, -1, -1, 2, 2, pal.light);");
replaceOnce("link('pelvis', 'tailTip', owl ? 3 : 4, owl ? pal.shade : pal.body);\n    if (!owl) { pixel(c, p.tailTip, -2, -1, 5, 2, pal.accent); pixel(c, p.tailTip, -1, 1, 3, 1, pal.light); }", "link('pelvis', 'tailTip', 3, pal.shade);");
replaceOnce("      pixelTriangle(c, root, finger, tip, pal.outline, pal.shade);\n      link(`wingRoot${side}`, `wingTip${side}`, 8, pal.outline); link(`wingRoot${side}`, `wingTip${side}`, 6, pal.shade); link(`wingRoot${side}`, `wingTip${side}`, 4, pal.body);\n      link(`wingRoot${side}`, `wingFinger${side}`, 6, pal.outline); link(`wingRoot${side}`, `wingFinger${side}`, 4, pal.accent);\n      link(`wingFinger${side}`, `wingTip${side}`, 5, pal.outline); link(`wingFinger${side}`, `wingTip${side}`, 3, pal.body);", "      link(`wingRoot${side}`, `wingTip${side}`, 5, pal.shade); link(`wingRoot${side}`, `wingTip${side}`, 3, pal.body); link(`wingRoot${side}`, `wingFinger${side}`, 2, pal.accent);");
replaceOnce("if (root && tip) { pixel(c, root, -2, -2, 4, 3, pal.accent); pixel(c, tip, -1, -1, 3, 2, pal.light); if (finger) pixel(c, finger, -1, -1, 2, 2, pal.accent); }", "if (root && tip) { pixel(c, root, -3, -4, 6, 4, pal.accent); pixel(c, tip, -2, -2, 4, 3, pal.light); if (finger) pixel(c, finger, -2, -1, 3, 2, pal.accent); }");
replaceRegexOnce(/  \} else if \(kind === 'spore'\) \{[\s\S]*?    headEye\('eye'\);/, "  } else if (kind === 'spore') {\n    for (let i = 0; i < 5; i++) { const id = `spore${i}`; link('cap', id, 3, pal.outline); link('cap', id, 1.5, i % 2 ? pal.accent : pal.light); }\n    bodyMass(c, p.core, 7, 8, pal); blob(c, p.cap, 12, 6, pal.outline); blob(c, p.cap, 10, 5, pal.body); pixel(c, p.cap, -6, -2, 8, 2, pal.light); pixel(c, p.cap, -2, 4, 5, 1, pal.accent);\n    for (let i = 0; i < 5; i++) { const id = `spore${i}`; blob(c, p[id], 1.5, 1.5, i % 2 ? pal.accent : pal.light); }\n    link('core', 'stalkL', 4, pal.shade); link('stalkL', 'stalkTipL', 3, pal.body); link('core', 'stalkR', 4, pal.shade); link('stalkR', 'stalkTipR', 3, pal.body); headEye('eye');");fs.writeFileSync(beforePath, beforeSource, 'utf8');
}
const samples = [
  ...(process.env.WILDBOUND_BUTTERFLY_REVIEW === '1' ? [
    { kind: 'butterfly_dragon', ref: '179589-blinky', crop: [250, 28, 320, 360] },
  ] : [
  { kind: 'great_owl', ref: '85676-archimedes', crop: [305, 28, 260, 360] },
  { kind: 'flying_raptor', ref: null },
  { kind: 'butterfly_dragon', ref: '179589-blinky', crop: [250, 28, 320, 360] },
  { kind: 'eye_tentacle', ref: '161992-corrupted-tentacle', crop: [300, 25, 220, 400] },
  { kind: 'watcher', ref: null },
  { kind: 'spore', ref: '86719-brilliant-spore', crop: [245, 28, 355, 410] },
  ]),
];
const refs = Object.fromEntries(samples.filter(sample => sample.ref).map(sample => [sample.kind, ['front', 'side', 'rear', 'opposite-side'].map(view =>
  fs.readFileSync(path.join(root, `test-output/modelviewer-references/${sample.ref}-${view}-idle.png`)).toString('base64'))]));

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-eldritch-art-')));

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1280, height: 800, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  const errors = [];
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  try {
    await window.loadFile(path.join(root, 'index.html'), { query: { tools: '1' } });
    await window.webContents.executeJavaScript(`Promise.race([window.wildboundBoot.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('boot timeout')),30000))])`);
    const encoded = await window.webContents.executeJavaScript(`(async () => {
      const { CREATURE_PACK: BEFORE_PACK } = await import(${JSON.stringify(require('node:url').pathToFileURL(beforePath).href)});
      const { CREATURE_PACK } = await import('./src/creature-packs/eldritch.mjs');
      const samples = ${JSON.stringify(samples)};
      const referenceData = ${JSON.stringify(refs)};
      const views = ['S','SW','W','NW','N','NE','E','SE'];
      const drawCreature = (ctx, subject, model, sample, facing, scale) => {
        const angle=facing*Math.PI/4;
        ctx.save();ctx.scale(scale,scale);
        subject.draw(ctx,{id:'eldritch-art-review-'+sample.kind+'-'+facing,kind:sample.kind,x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',moving:false},0,model);
        ctx.restore();
      };
      const outputs = [];
      for (const sample of samples) {
        const subject = CREATURE_PACK.subjects[sample.kind], model = subject.defaults();
        const beforeSubject = BEFORE_PACK.subjects[sample.kind], beforeModel = beforeSubject.defaults();
        const canvas = document.createElement('canvas'); canvas.width = 1320; canvas.height = 820;
        const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
        c.fillStyle = '#10271f'; c.fillRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = '#e8d8ad'; c.font = 'bold 19px system-ui'; c.fillText(sample.kind.replaceAll('_',' ') + ' · connected silhouette study · draft', 18, 27);
        c.fillStyle = '#a9c3b5'; c.font = '11px system-ui'; c.fillText('Same renderer, facing, actor, pixel density and pose. Native row first; 2× nearest-neighbor row below.', 18, 46);
        const rows = [
          { title: 'BEFORE · NATIVE', cy: 160, titleY: 82, directionY: 105, scale: 1 },
          { title: 'AFTER · NATIVE', cy: 275, titleY: 197, directionY: 220, scale: 1 },
          { title: 'BEFORE · 2×', cy: 470, titleY: 326, directionY: 350, scale: 2 },
          { title: 'AFTER · 2×', cy: 710, titleY: 566, directionY: 590, scale: 2 },
        ];
        for (const row of rows) {
          c.fillStyle = '#cbb991'; c.font = 'bold 10px system-ui'; c.fillText(row.title, 12, row.titleY);
          for (let facing=0;facing<8;facing++) {
            const cx=54+facing*105, cy=row.cy;
            c.fillStyle='#98d4b7';c.font='9px system-ui';c.textAlign='center';c.fillText(views[facing],cx,row.directionY);
            c.save();c.translate(cx,cy);
            if(row.title.startsWith('BEFORE')) drawCreature(c,beforeSubject,beforeModel,sample,facing,row.scale);
            else drawCreature(c,subject,model,sample,facing,row.scale);
            c.restore();
          }
          c.textAlign='left';
        }
        c.fillStyle='#e8d8ad';c.font='bold 11px system-ui';
        if (sample.ref) {
          c.fillText('SOURCE MODELVIEWER · IDLE',895,67);
          const viewsKeys=['front','side','rear','opposite-side'];
          for(let i=0;i<4;i++) {
            const x=895+(i%2)*205,y=82+Math.floor(i/2)*218;
            c.fillStyle='#cbb991';c.font='10px system-ui';c.fillText(viewsKeys[i].toUpperCase(),x,y+10);
            const image=new Image();image.src='data:image/png;base64,'+referenceData[sample.kind][i];
            await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
            const [sx,sy,sw,sh]=sample.crop;
            c.drawImage(image,sx,sy,sw,sh,x,y+17,190,190);
          }
        } else {
          c.fillText('NO LINKED IDLE CAPTURE',895,67);
          c.fillStyle='#a9c3b5';c.font='11px system-ui';c.fillText('No source screenshot was found for this subject.',895,94);
        }
        outputs.push({kind:sample.kind,png:canvas.toDataURL('image/png').split(',')[1]});
      }
      const subjects=Object.entries(CREATURE_PACK.subjects), cellW=112, cellH=90, left=230, top=60;
      const sheet=document.createElement('canvas');sheet.width=left+cellW*8;sheet.height=top+subjects.length*cellH;
      const sc=sheet.getContext('2d');sc.imageSmoothingEnabled=false;sc.fillStyle='#10271f';sc.fillRect(0,0,sheet.width,sheet.height);
      sc.fillStyle='#e8d8ad';sc.font='bold 22px system-ui';sc.fillText('Eldritch · eight directions · native game scale',12,30);
      const labels=['S','SW','W','NW','N','NE','E','SE'];sc.font='12px system-ui';sc.fillStyle='#9ed6b8';sc.textAlign='center';
      labels.forEach((label,facing)=>sc.fillText(label,left+facing*cellW+cellW/2,50));
      for(let row=0;row<subjects.length;row++){
        const [kind,subject]=subjects[row],rowTop=top+row*cellH,model=subject.defaults();
        sc.fillStyle=row%2?'#17372e':'#153329';sc.fillRect(0,rowTop,sheet.width,cellH);
        sc.fillStyle='#f2e4c4';sc.font='12px system-ui';sc.textAlign='left';sc.fillText(subject.name,12,rowTop+17);
        for(let facing=0;facing<8;facing++){
          const angle=facing*Math.PI/4;sc.save();sc.translate(left+facing*cellW+cellW/2,rowTop+58);
          subject.draw(sc,{id:'eldritch-engine-sheet-'+kind+'-'+facing,kind,x:0,y:0,faceX:-Math.sin(angle),faceY:Math.cos(angle),state:'idle',animationAction:'idle',moving:false},0,model);sc.restore();
        }
      }
      return {outputs,enginePng:sheet.toDataURL('image/png').split(',')[1]};
    })()`);
    if (errors.length) throw Error(errors.join('\n'));
    for (const result of encoded.outputs) fs.writeFileSync(path.join(out, `${result.kind}-before-after-reference.png`), Buffer.from(result.png, 'base64'));
    const enginePng=Buffer.from(encoded.enginePng,'base64');
    fs.writeFileSync(path.join(out,'eldritch-eight-view-engine.png'),enginePng);
    fs.writeFileSync(path.join(root,'test-output/creature-roster-engine/eldritch.png'),enginePng);
    console.log(JSON.stringify({ out, samples: encoded.outputs.map(({ kind }) => kind), engineSheet: path.join(out,'eldritch-eight-view-engine.png'), renderer: 'Wildbound runtime subject.draw', audioMuted: true, errors: errors.length }));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { window.destroy(); app.quit(); try { fs.unlinkSync(beforePath); } catch {} }
});
