const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const outDir = path.join(root, 'test-output/modelviewer-references');
const targets = [
  { id: '61081', slug: 'squirrel', name: 'Squirrel' },
  { id: '61170', slug: 'sheep', name: 'Sheep' },
  { id: '62648', slug: 'turkey', name: 'Turkey' },
  { id: '62907', slug: 'highlands-skunk', name: 'Highlands Skunk', existing: ['front', 'side'] },
  { id: '79181', slug: 'tyri', name: 'Tyri' },
  { id: '117985', slug: 'seduction', name: 'Seduction' },
  { id: '141006', slug: 'dead-deckhand-leonard', name: 'Dead Deckhand Leonard', existing: ['front', 'side', 'rear'] },
  { id: '143191', slug: 'tiny-direhorn', name: 'Tiny Direhorn' },
  { id: '172570', slug: 'sinheart', name: 'Sinheart' },
  { id: '253399', slug: 'scruffbeak', name: 'Scruffbeak' },
  { id: '254885', slug: 'silvermoon-broom', name: 'Silvermoon Broom' },
  { id: '266580', slug: 'silento', name: 'Silento' },
];
const views = ['front', 'side', 'rear', 'opposite-side'];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('mute-audio');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-modelviewer-capture-')));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1280, height: 900, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  try {
    const all = [];
    for (const target of targets) {
      const url = `https://www.wowhead.com/npc=${target.id}/${target.slug}#modelviewer`;
      let page;
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await win.loadURL(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        } catch (error) {
          // Wowhead can redirect or abort a navigation while its app shell is
          // switching routes. Check the live document before treating that as
          // a failed capture; only retry when the requested viewer did not load.
          lastError = error;
          console.warn(JSON.stringify({ subject: target.name, attempt, navigation: error.message, loadedURL: win.webContents.getURL() }));
        }
        await delay(2500);
        page = await win.webContents.executeJavaScript(`(() => {
          const canvas = document.querySelector('canvas');
          let viewer = document.querySelector('.modelviewer-modelbg');
          if (!canvas && !viewer) {
            document.querySelector('#wh-mv-view-in-3d-button')?.click();
            viewer = document.querySelector('.modelviewer-modelbg');
          }
          const rect = canvas?.getBoundingClientRect() || viewer?.getBoundingClientRect();
          const select = [...document.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === 'Stand'));
          if (select) { select.value = 'Stand'; select.dispatchEvent(new Event('change', { bubbles: true })); }
          return { title: document.title, url: location.href, dpr: devicePixelRatio, rect: rect && {x:rect.x,y:rect.y,width:rect.width,height:rect.height}, stand:select?.value };
        })()`);
        if (!page.rect) {
          await delay(4500);
          page = await win.webContents.executeJavaScript(`(() => { const canvas=document.querySelector('canvas'); const viewer=document.querySelector('.modelviewer-modelbg'); const rect=canvas?.getBoundingClientRect()||viewer?.getBoundingClientRect(); const select=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='Stand')); if(select){select.value='Stand';select.dispatchEvent(new Event('change',{bubbles:true}));} return {title:document.title,url:location.href,dpr:devicePixelRatio,rect:rect&&{x:rect.x,y:rect.y,width:rect.width,height:rect.height},stand:select?.value}; })()`);
        }
        if (page.rect && /wowhead\.com\/npc=/.test(page.url)) break;
        if (attempt < 3) await delay(3000);
      }
      if (!page?.rect || !/wowhead\.com\/npc=/.test(page.url)) throw new Error(`${target.name}: viewer unavailable after retries (${lastError?.message || page?.url || 'no canvas'})`);
      if (!page.rect) throw new Error(`${target.name}: modelviewer canvas missing`);
      await delay(1800);
      const scale = page.dpr || 1;
      const cropRect = { x: Math.round(page.rect.x * scale), y: Math.round(page.rect.y * scale), width: Math.round(page.rect.width * scale), height: Math.round(page.rect.height * scale) };
      const save = async view => {
        const full = await win.webContents.capturePage();
        const size = full.getSize();
        const rect = { ...cropRect, width: Math.min(cropRect.width, size.width - cropRect.x), height: Math.min(cropRect.height, size.height - cropRect.y) };
        if (rect.width <= 0 || rect.height <= 0) throw new Error(`${target.name}: screenshot crop is outside the page`);
        const file = `${target.id}-${target.slug}-${view}-idle.png`;
        const destination = path.join(outDir, file);
        if (!fs.existsSync(destination)) {
          fs.writeFileSync(destination, full.crop(rect).toPNG());
          all.push({ file, name: target.name, view, pageTitle: page.title, animation: page.stand || 'unconfirmed' });
        }
      };
      for (let i = 0; i < views.length; i++) {
        if (!target.existing?.includes(views[i])) await save(views[i]);
        if (i < views.length - 1) {
          const x = Math.round(page.rect.x + page.rect.width / 2), y = Math.round(page.rect.y + page.rect.height / 2);
          win.webContents.sendInputEvent({ type: 'mouseDown', x, y, button: 'left' });
          win.webContents.sendInputEvent({ type: 'mouseMove', x: x + 220, y, button: 'left', movementX: 220, movementY: 0 });
          win.webContents.sendInputEvent({ type: 'mouseUp', x: x + 220, y, button: 'left' });
          await delay(350);
        }
      }
      console.log(JSON.stringify({ subject: target.name, title: page.title, views: views.length, animation: page.stand }));
    }
    fs.writeFileSync(path.join(outDir, 'captured-turnarounds.json'), JSON.stringify({ generatedAt: new Date().toISOString(), captureMethod: 'Muted isolated Electron capturePage of original Wowhead Modelviewer after selecting Stand; each next view from a horizontal drag.', captures: all }, null, 2));
    console.log(JSON.stringify({ total: all.length, output: outDir }));
  } catch (error) { console.error(error.stack || error); process.exitCode = 1; }
  finally { win.destroy(); app.quit(); }
});
