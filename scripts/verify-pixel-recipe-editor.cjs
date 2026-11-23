const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawnSync(require('electron'), [__filename, '--mute-audio'], {
    cwd: root, env, encoding: 'utf8', timeout: 150_000,
  });
  process.stdout.write(child.stdout || '');
  process.stderr.write(child.stderr || '');
  if (child.error) console.error(child.error);
  process.exit(child.status ?? 1);
}

const { app, BrowserWindow } = require('electron');
const appPath = process.env.WILDBOUND_VERIFY_APP || root;
const output = path.join(root, 'test-output', 'pixel-recipe-editors', appPath === root ? 'source' : 'packaged');
fs.mkdirSync(output, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(output, 'profile-')));
app.commandLine.appendSwitch('mute-audio');

app.whenReady().then(async () => {
  const win = new BrowserWindow({show: false, width: 1280, height: 850, webPreferences: {backgroundThrottling: false}});
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
  win.webContents.on('render-process-gone', (_, details) => errors.push(details.reason));
  const evaluate = script => win.webContents.executeJavaScript(script);
  const capture = async name => fs.writeFileSync(path.join(output, name), (await win.webContents.capturePage()).toPNG());
  try {
    await win.loadFile(path.join(appPath, 'index.html'));
    await evaluate('wildboundBoot.ready');
    await evaluate(`(async () => {
      const checks = [], $ = selector => document.querySelector(selector);
      const check = (condition, message) => {
        if (!condition) throw Error(message);
        checks.push(message);
      };
      const named = (root, text) => [...root.querySelectorAll('button')].find(button => button.textContent.trim() === text);
      const recipe = (dialog, value) => {
        const input = dialog.querySelector('textarea');
        input.value = typeof value === 'string' ? value : JSON.stringify(value);
        input.dispatchEvent(new Event('input', {bubbles:true}));
        named(dialog, 'Preview recipe').click();
      };
      const frame = (dialog, value) => {
        const select = dialog.querySelector('select');
        select.value = String(value);
        select.dispatchEvent(new Event('change', {bubbles:true}));
      };
      const sample = (dialog, x = 0, y = 0) => [...dialog.querySelector('canvas').getContext('2d').getImageData(x,y,1,1).data];
      window.pixelRecipeVerification = {checks, check, named, recipe, frame, sample};

      $('#nav-workshop').click();
      check($('#workshop').classList.contains('active'), 'Sprite Workshop opens from the main navigation');
      $('#new-sprite').click();
      const canvas = $('#pixel-canvas');
      const original = canvas.toDataURL();
      window.pixelRecipeVerification.originalWorkshop = original;
      $('#workshop .pixel-recipe-open').click();
      const dialog = $('#workshop .pixel-recipe-dialog');
      check(dialog.open, 'Sprite Workshop opens the Pixel recipe dialog');
      recipe(dialog, '{');
      check(named(dialog, 'Apply frame to draft').disabled && canvas.toDataURL() === original, 'Malformed JSON leaves the Workshop draft untouched');
      recipe(dialog, {
        width:2, height:2, palette:{a:'#bb4422',b:'#5be3aa'}, rows:['a.','..'],
        frames:[{duration:460},{duration:740,patches:[{x:0,y:0,rows:['b']}]}],
      });
      check(sample(dialog).join() === '187,68,34,255' && canvas.toDataURL() === original, 'Preview draws native artwork before any application');
      named(dialog, 'Play').click();
      const deadline = performance.now() + 2400;
      while (sample(dialog)[0] !== 91 && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
      check(sample(dialog).join() === '91,227,170,255', 'Timed playback reaches the second recipe frame');
      named(dialog, 'Pause').click();
      frame(dialog, 1);
      check(dialog.querySelector('select').selectedOptions[0].textContent.includes('740 ms'), 'Frame selection exposes the authored hold');
    })()`);
    await capture('workshop.png');

    await evaluate(`(async () => {
      const {check, named, recipe, sample, originalWorkshop}=window.pixelRecipeVerification;
      const $=selector=>document.querySelector(selector), canvas=$('#pixel-canvas');
      const dialog=$('#workshop .pixel-recipe-dialog');
      const storage = localStorage.getItem('wildbound-sprites');
      named(dialog, 'Apply frame to draft').click();
      const painted = canvas.toDataURL();
      check(!dialog.open && painted !== originalWorkshop && localStorage.getItem('wildbound-sprites') === storage, 'Applying a frame changes only the Workshop draft');
      $('#undo-button').click();
      check(canvas.toDataURL() === originalWorkshop, 'Workshop Undo restores the previous dimensions and draft');
      $('#redo-button').click();
      check(canvas.toDataURL() === painted, 'Workshop Redo restores the applied recipe artwork');
      $('#sprite-name').value='recipe-check';
      $('#save-sprite').click();
      const saved=JSON.parse(localStorage.getItem('wildbound-sprites'))['recipe-check'];
      check(saved.width===2 && saved.height===2 && saved.palette[saved.pixels[0]]==='#5be3aa', 'Workshop Save to Game persists the selected frame');
      $('#nav-play').click();
      $('#local-button').click();
      $('#lobby-studio').click();
      const studio=$('.player-studio');
      if (!studio) throw Error('Studio did not mount from the lobby button');
      const head=studio.querySelector('[data-joint="head"]');
      if (!head) throw Error('Player Studio did not expose its head joint');
      head.click();
      const sprites=studio.querySelector('.ps-inspector-tabs [data-section="art"]');
      if (!sprites) throw Error('Player Studio did not expose its Sprites tab');
      sprites.click();
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const editable=[...studio.querySelectorAll('.ps-bone-sprites button')].find(b=>b.textContent==='Edit pixels here' && !b.disabled);
      if (!editable) throw Error('The player head has no editable layer');
      editable.click();
      const editor=studio.querySelector('.rig-inline-pixels');
      if (!editor) throw Error('Edit pixels here did not open the layer editor');
      const editView=editor.querySelector('.inline-pixel-editor canvas');
      const original=editView.toDataURL();
      const originalRig=localStorage.getItem('wildbound-rig-sprite-overrides');
      Object.assign(window.pixelRecipeVerification,{editor, originalRig});

      editor.querySelector('.pixel-recipe-open').click();
      const rigDialog=editor.querySelector('.pixel-recipe-dialog');
      check(rigDialog.open, 'Animation Studio launches Pixel recipe from the existing Edit Layers dialog');
      recipe(rigDialog, {base:'active.json',patches:[{x:999,y:0,rows:['_']}]});
      check(named(rigDialog,'Apply frame to draft').disabled && editView.toDataURL()===original, 'Invalid patch cannot change the rig layer');
      const base = 'relative/native.json';
      recipe(rigDialog, {base});
      const preview = rigDialog.querySelector('canvas');
      const x = Math.floor(preview.width / 2), y = Math.floor(preview.height / 2);
      Object.assign(window.pixelRecipeVerification,{x,y,patchedRigIndex:y * preview.width + x});
      recipe(rigDialog, {base,x:99,y:-95,palette:{p:'#e623aa'},patches:[{x,y,rows:['p']}]});
      check(rigDialog.querySelector('[role="status"]').textContent.includes('current draft as base') && sample(rigDialog,x,y).join()==='230,35,170,255', 'Rig preview uses the active layer without fetching the relative base name');
    })()`);
    win.setSize(650, 720);
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    await capture('rig.png');

    const checks = await evaluate(`(async () => {
      const {check, checks, named, editor, originalRig, patchedRigIndex, recipe, sample, x, y}=window.pixelRecipeVerification;
      const dialog=editor.querySelector('.pixel-recipe-dialog');
      check(dialog.scrollWidth <= dialog.clientWidth+2, 'Pixel recipe controls fit at a 650-pixel desktop width');
      named(dialog, 'Apply frame to draft').click();
      const draftColor = () => {
        editor.querySelector('.pixel-recipe-open').click();
        recipe(dialog,{base:'active-layer.json'});
        const color = sample(dialog,x,y).join();
        named(dialog,'Close').click();
        return color;
      };
      if (dialog.open) throw Error('Rig Apply could not update the draft: '+dialog.querySelector('[role="status"]').textContent);
      const painted = '230,35,170,255';
      check(draftColor()===painted && localStorage.getItem('wildbound-rig-sprite-overrides')===originalRig, 'Rig recipe application is a local draft edit');
      named(editor,'Undo').click();
      check(draftColor()!==painted, 'Rig layer Undo restores the original sprite');
      named(editor,'Redo').click();
      check(draftColor()===painted, 'Rig layer Redo restores the recipe');

      const layerButtons=[...editor.querySelectorAll('.inline-pixel-editor aside section label button')];
      const activeFirst=layerButtons.find(button=>button.textContent==='Face, hair & headwear') || layerButtons[0];
      const different=layerButtons.find(button=>button!==activeFirst);
      check(!!different, 'Head editor exposes another separate layer');
      different.click();
      activeFirst.click();
      check(draftColor()===painted, 'Switching away and back preserves the edited layer draft');
      await named(editor,'Save pixels to rig').onclick();
      const saved=JSON.parse(localStorage.getItem('wildbound-rig-sprite-overrides')).player;
      const layers=Object.values(saved), facings=Object.values(layers[0]);
      check(layers.length===1 && facings.length===1, 'Save writes only the edited rig layer and facing');
      const sprite=facings[0];
      check(sprite.palette[sprite.pixels[patchedRigIndex]]==='#e623aa' && sprite.x!==99 && sprite.y!==-95, 'Explicit rig save keeps the original bone pivot and the applied pixel');
      return checks;
    })()`);
    const report = {checks, errors, muted:win.webContents.isAudioMuted(), appPath};
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    app.exit(errors.length ? 1 : 0);
  } catch (error) {
    console.error(error);
    const checks = await evaluate('window.pixelRecipeVerification?.checks').catch(() => []);
    fs.writeFileSync(path.join(output, 'error.txt'), String(error.stack || error) + '\n' + JSON.stringify({checks, errors}));
    app.exit(1);
  }
});
