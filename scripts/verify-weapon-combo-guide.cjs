const {app, BrowserWindow} = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = process.env.WILDBOUND_VERIFY_APP || root;
const out = path.join(root, 'test-output', 'weapon-combos', source === root ? 'guide-source' : 'guide-packaged');
fs.mkdirSync(out, {recursive: true});
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'wildbound-combo-guide-')));
app.commandLine.appendSwitch('mute-audio');

app.whenReady().then(async () => {
  const win = new BrowserWindow({show: false, width: 1150, height: 770, useContentSize: true,
    webPreferences: {backgroundThrottling: false}});
  win.webContents.setAudioMuted(true);
  win.showInactive();
  const errors = [];
  win.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  win.webContents.on('render-process-gone', (_event, detail) => errors.push(detail.reason));
  const run = code => win.webContents.executeJavaScript(`(async()=>{${code}})()`);
  const capture = async name => {
    await new Promise(resolve => setTimeout(resolve, 160));
    fs.writeFileSync(path.join(out, `${name}.png`), (await win.webContents.capturePage()).toPNG());
  };
  try {
    await win.loadFile(path.join(source, 'index.html'), {query: {tools: '1'}});
    const checks = await run(`
      await window.wildboundBoot.ready;
      if (window.wildboundBoot.error) throw Error(window.wildboundBoot.error);
      await new Promise(resolve => setTimeout(resolve, 350));
      window.requestAnimationFrame = () => 0;
      const {Game} = await import('./src/core.mjs');
      const {recordWeaponCombo, weaponComboCatalog} = await import('./src/weapon-combo-discovery.mjs');
      const api = window.wildboundPolishTest;
      const game = new Game(() => .4);
      const p = game.addPlayer('pad:0', 'Rowan');
      const q = game.addPlayer('pad:1', 'Moss');
      game.start();
      game.openingBoard = false;
      game.locked = true;
      api.game = game;
      api.show('play');
      const checks = [];
      const check = (label, passed) => {if (!passed) throw Error(label); checks.push(label);};
      const pads = ['Xbox Wireless Controller', 'Nintendo Switch Pro Controller'].map((id, index) => ({
        id, index, connected: true, mapping: 'standard', axes: [0, 0, 0, 0],
        buttons: Array.from({length: 17}, () => ({pressed: false, value: 0})),
      }));
      Object.defineProperty(navigator, 'getGamepads', {configurable: true, value: () => pads});
      const press = (index, button) => {
        pads[index].buttons[button] = {pressed: true, value: 1};
        api.inputFrame();
        pads[index].buttons[button] = {pressed: false, value: 0};
        api.inputFrame();
      };
      const d = document.getElementById('field-kit-dialog');
      const active = () => d.querySelector('nav [aria-pressed=true]')?.textContent;
      const entry = id => d.querySelector('[data-combo=' + id + ']');
      recordWeaponCombo(game, p, 'fire_arrows');
      press(0, game.mapping.field);
      check('Field Kit opens from its mapped controller button', d.open && d.dataset.ownerDevice === 'pad:0');
      press(0, 5);
      check('Right bumper moves to Skills', active() === 'Skills');
      press(0, 5);
      check('Right bumper moves to Combos and focuses the first entry', active() === 'Combos' && document.activeElement === entry('fire_arrows').querySelector('summary'));
      check('Discovery count and exact instructions appear for the owner', d.textContent.includes('1 of ' + Object.keys(weaponComboCatalog).length + ' discovered') && entry('fire_arrows').textContent.includes('lit campfire'));
      check('Undiscovered entries expose hints without the exact technique', entry('ice_shatter').textContent.includes('brittle') && !entry('ice_shatter').textContent.includes('heavy melee'));
      press(1, 5);
      check('The second controller cannot change the first explorer’s page', active() === 'Combos');
      press(0, 0);
      check('Confirm expands the selected technique', entry('fire_arrows').open);
      press(0, 1);
      check('Back closes Field Kit', !d.open);
      press(1, game.mapping.field);
      const switchClose = d.querySelector('[data-focus=close]').textContent;
      check('The second explorer opens their own guide with Switch button labels', d.open && d.dataset.ownerDevice === 'pad:1' && switchClose.endsWith('B'));
      check('Switch footer shows L/R to change tab, A to select and B to close', d.querySelector('.field-notice').textContent.includes('L / R: change tab · D-pad: focus · A: select · B: close'));
      check('The second explorer has no discoveries', entry('fire_arrows').querySelector('strong').textContent === 'Undiscovered');
      press(1, 0);
      check('Switch B closes the guide', !d.open);
      press(0, game.mapping.field);
      check('Reopening returns to the same guide tab', active() === 'Combos');
      window.weaponComboGuideCheck = {check, checks, d, press, entry};
      return checks;
    `);
    await win.webContents.executeJavaScript('document.querySelector(\'[data-combo="fire_arrows"]\').open = true');
    await capture('guide');
    win.setContentSize(650, 500);
    await new Promise(resolve => setTimeout(resolve, 160));
    const narrow = await run(`
      const {check, checks, d, press, entry} = window.weaponComboGuideCheck;
      entry('fire_arrows').querySelector('summary').focus();
      const entries = [...d.querySelectorAll('details.field-combo-entry')];
      for (let index = 1; index < entries.length; index++) press(0, 13);
      const body = d.querySelector('.field-body');
      const last = entries.at(-1).querySelector('summary');
      check('D-pad reaches the last entry on a narrow window', document.activeElement === last);
      check('Guide fits horizontally at 650 pixels', body.scrollWidth <= body.clientWidth + 1 && d.scrollWidth <= d.clientWidth + 1);
      check('Focused last entry is inside the visible scroll region', last.getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom + 1);
      press(0, 0);
      check('Confirm exposes the last hint on the narrow window', entries.at(-1).open);
      entries.at(-1).querySelector('p').scrollIntoView({block: 'nearest'});
      return checks;
    `);
    await capture('guide-narrow');
    const report = {appPath: source, checks: narrow, errors, failed: errors.length, wideChecks: checks.length};
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    app.exit(report.failed ? 1 : 0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
