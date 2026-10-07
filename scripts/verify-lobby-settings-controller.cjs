const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const base = process.env.WILDBOUND_VERIFY_APP || root;
const output = path.join(root, 'test-output', 'lobby-settings-controller');
app.disableHardwareAcceleration();
app.setPath('userData', path.join(root, 'test-output', 'lobby-settings-controller-profile-' + Date.now()));

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false, width: 1280, height: 850, useContentSize: true,
    webPreferences: { backgroundThrottling: false },
  });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  const run = source => win.webContents.executeJavaScript(`(async()=>{
    try { return await (${source}); } catch(error) { return { verificationError: error.stack }; }
  })()`).then(result => {
    if (result?.verificationError) throw Error(result.verificationError);
    return result;
  });
  try {
    await win.loadURL('about:blank');
    // Capture the existing debug context at installation; no runtime source edits.
    win.webContents.debugger.attach('1.3');
    await win.webContents.debugger.sendCommand('Debugger.enable');
    await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl', {
      urlRegex: 'src/debug-tools\\.mjs$', lineNumber: 3,
      condition: '(window.lobbySettingsControllerContext = ctx, false)',
    });
    await win.loadFile(path.join(base, 'index.html'), { query: { tools: '1' } });
    await run('window.wildboundBoot.ready');
    console.log('Booted application for synthetic lobby settings controller QA');
    await run(`(async()=>{
      if (!window.lobbySettingsControllerContext) throw Error('Existing debug context was not captured');
      const raf = window.requestAnimationFrame.bind(window);
      window.lobbySettingsControllerRAF = raf;
      window.requestAnimationFrame = () => 0;
      await new Promise(raf);
      return true;
    })()`);
    win.webContents.debugger.detach();
    console.log('Captured the existing application debug context');
    const result = await run(`(async()=>{
      const ctx = window.lobbySettingsControllerContext;
      const checks = [], assert = (value, message) => { if (!value) throw Error(message); checks.push(message); };
      const $ = id => document.getElementById(id), dialog = $('settings-dialog');
      const pads = ['Xbox Wireless Controller', 'Nintendo Switch Pro Controller'].map((id, index) => ({
        index, id, mapping: 'standard', connected: true, axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
      }));
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads });
      ctx.previousPads.clear(); ctx.keys.clear();
      const neutral = () => pads.forEach(pad => {
        pad.axes.fill(0); pad.buttons.forEach(button => { button.pressed = false; button.value = 0; });
      });
      const set = (index, ...buttons) => buttons.forEach(button => { pads[index].buttons[button].pressed = true; pads[index].buttons[button].value = 1; });
      const step = () => {
        const wasBlocked = ctx.paused || !!document.querySelector('dialog[open]');
        const inputs = ctx.inputFrame();
        if (ctx.screen === 'lobby') ctx.playableLobby.update(.05, inputs,
          wasBlocked || ctx.paused || !!document.querySelector('dialog[open]'));
        return inputs;
      };
      const release = () => { neutral(); step(); };
      const press = (index, ...buttons) => { set(index, ...buttons); const input = step(); release(); return input; };
      const selectedTab = () => dialog.querySelector('[data-settings-tab][aria-selected="true"]').dataset.settingsTab;
      const verifyOpen = (owner, family) => {
        assert(dialog.open && dialog.dataset.ownerDevice === 'pad:' + owner, 'Settings records opening owner ' + owner);
        assert(dialog.dataset.controllerFamily === family, 'Settings detects ' + family + ' family');
        const panels = [...dialog.querySelectorAll('[data-settings-panel]')].filter(panel => panel.getClientRects().length);
        assert(panels.length === 1 && panels[0].dataset.settingsPanel === 'display', 'Only the Display panel is rendered on opening');
        assert(dialog.contains(document.activeElement) && document.activeElement.getClientRects().length, 'Opening focuses a rendered settings control');
      };

      // show('home') normally redirects to the playable lobby; use its existing
      // debug setter to exercise the retained main/home input branch as well.
      ctx.screen = 'home'; document.body.dataset.screen = 'home';
      document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === 'home'));
      ctx.game.players = [];
      set(0, 9, 0, 5, 13); pads[0].axes[0] = 1;
      const opening = step(); verifyOpen(0, 'xbox');
      assert(ctx.game.players.length === 0 && Object.keys(opening['pad:0']).length === 0, 'Home Start plus face/direction input does not join or leak actions');
      for (let frame = 0; frame < 12; frame++) step();
      assert(dialog.open && selectedTab() === 'display', 'Holding Start with face/shoulder/stick input does not activate settings controls');
      release();
      $('close-settings').focus(); const outsiderFocus = document.activeElement;
      press(1, 0, 1, 5, 9, 13);
      assert(dialog.open && document.activeElement === outsiderFocus && selectedTab() === 'display', 'Non-owner cannot accept, back, toggle, change tabs or move focus');
      press(0, 5); press(0, 5);
      assert(selectedTab() === 'controls', 'Opening owner can navigate settings tabs');
      const mappingText = $('player-mappings').textContent;
      assert(mappingText.includes('Xbox / Xbox 360') && mappingText.includes('Nintendo Switch') && mappingText.includes('+ · 9'), 'Rendered controller cards contain detected Xbox/Switch labels');
      set(0, 9, 0); step();
      assert(!dialog.open && !dialog.dataset.ownerDevice && ctx.game.players.length === 0, 'Fresh owner Start closes home settings and clears ownership without joining');
      for (let frame = 0; frame < 12; frame++) step();
      assert(!dialog.open && ctx.game.players.length === 0, 'Held closing Start does not reopen settings or join');
      release(); press(1, 9); verifyOpen(1, 'switch');
      press(0, 9, 1, 5);
      assert(dialog.open && dialog.dataset.ownerDevice === 'pad:1', 'Switch opener retains ownership against Xbox input');
      press(1, 1);
      assert(!dialog.open, 'Switch opener can close settings with its back button');
      $('settings-button').click();
      assert(dialog.dataset.ownerDevice === 'keyboard', 'Mouse/keyboard opening has explicit keyboard ownership');
      press(0, 9, 1, 5);
      assert(dialog.open && selectedTab() === 'display', 'A controller cannot take over keyboard-owned settings');
      $('close-settings').click(); release();

      ctx.newLobby();
      press(1, 9); verifyOpen(1, 'switch');
      assert(ctx.game.players.length === 0 && ctx.screen === 'lobby', 'Unassigned lobby Start opens settings without creating a player');
      press(1, 9); assert(!dialog.open, 'Unassigned lobby opener toggles settings closed');
      press(0, 0);
      assert(ctx.game.players.length === 1 && ctx.game.players[0].device === 'pad:0', 'Ordinary face input still joins the lobby');
      const p = ctx.game.players[0], q = ctx.game.addPlayer('pad:1', 'Switch QA');
      ctx.playableLobby.sync();
      for (const player of [p, q]) {
        player.profileId = 'lobby-settings-qa-' + player.id; player.ready = false;
        Object.assign(ctx.playableLobby.state.members.get(player.id), { spawned: true, panel: null, x: 770, y: 420 });
        ctx.playableLobby.close(player);
      }
      ctx.playableLobby.open(p, 'board');
      ctx.game.openInventory(q); const otherUI = q.ui;
      const count = ctx.game.players.length, panelBefore = ctx.playableLobby.state.members.get(p.id).panel;
      set(0, 9, 0, 5, 13); step(); verifyOpen(0, 'xbox');
      assert(!p.ready && !q.ready && ctx.screen === 'lobby' && ctx.game.players.length === count,
        'Lobby Start combined with accept never readies, starts or joins');
      assert(ctx.playableLobby.state.members.get(p.id).panel === panelBefore && q.ui === otherUI,
        'Settings preserves the opener’s board panel and another owner’s inventory');
      for (let frame = 0; frame < 12; frame++) step();
      assert(selectedTab() === 'display' && !p.ready && q.ui === otherUI, 'Held lobby opening input cannot navigate the board or inventory');
      release(); press(1, 9, 1, 5, 13);
      assert(dialog.open && q.ui === otherUI && selectedTab() === 'display', 'Second lobby owner cannot close or navigate first owner’s settings');
      press(0, 5);
      assert(selectedTab() === 'explorer', 'Lobby opener can change the active settings tab');
      set(1, 1); step();
      set(0, 9, 0, 13); step();
      for (let frame = 0; frame < 12; frame++) step();
      assert(!dialog.open && !p.ready && ctx.game.players.length === count && ctx.screen === 'lobby',
        'Held lobby closing input cannot reopen, ready, join or start a game');
      assert(q.ui === otherUI, 'Ignored non-owner back stays consumed after the settings owner closes');
      release();
      press(0, 9); $('close-settings').focus(); set(0, 0); step();
      for (let frame = 0; frame < 12; frame++) step();
      assert(!dialog.open && !p.ready && ctx.playableLobby.state.members.get(p.id).panel === panelBefore,
        'Holding owner accept after Done cannot ready or interact with the underlying lobby');
      release();
      ctx.playableLobby.state.members.get(p.id).focus = 0;
      press(0, 0);
      assert(p.ready, 'A fresh post-settings face press still readies at the board');
      q.ui = null; p.ready = q.ready = true;
      ctx.playableLobby.close(p); ctx.playableLobby.close(q);
      ctx.playableLobby.state.countdown = .025;
      set(0, 9); step();
      for (let frame = 0; frame < 12; frame++) step();
      assert(ctx.screen === 'lobby' && ctx.playableLobby.state.countdown === .025,
        'Opening settings blocks an already-running expedition countdown');
      p.ready = q.ready = false;
      release(); press(0, 9);

      ctx.game = new ctx.Game(); ctx.wireGame();
      ctx.game.addPlayer('pad:0', 'Xbox QA'); ctx.game.addPlayer('pad:1', 'Switch QA');
      ctx.game.start(); ctx.show('play'); ctx.paused = false; release();
      set(0, 9); step();
      assert(ctx.paused && $('pause-dialog').open && !dialog.open, 'Expedition Start still opens Pause');
      for (let frame = 0; frame < 12; frame++) step();
      assert(ctx.paused && $('pause-dialog').open, 'Held expedition Start does not resume');
      release(); press(0, 9);
      assert(!ctx.paused && !$('pause-dialog').open, 'Fresh expedition Start still resumes');
      press(0, 9); $('pause-settings').focus(); press(0, 0);
      verifyOpen(0, 'xbox');
      press(1, 9, 1);
      assert(ctx.paused && dialog.open, 'Another controller cannot close expedition settings or resume through it');
      set(0, 9); step();
      assert(!dialog.open && $('pause-dialog').open && ctx.paused, 'Owner Start closes expedition settings back to Pause');
      for (let frame = 0; frame < 12; frame++) step();
      assert(ctx.paused && $('pause-dialog').open, 'Holding settings-close Start cannot also resume the expedition');
      release(); press(0, 9);
      assert(!ctx.paused && !$('pause-dialog').open, 'A separate released Start resumes after closing expedition settings');

      // Desktop claim callbacks are synthetic and never touch real shared claim files.
      ctx.game.phase = 'lobby'; ctx.newLobby(); release();
      const requests = [];
      Object.defineProperty(document, 'hasFocus', { configurable: true, value: () => true });
      window.desktop = {
        testMode: false,
        claimController: key => new Promise(resolve => requests.push({ key, resolve })),
        releaseController: () => Promise.resolve(true),
      };
      const settle = async claimed => { requests.at(-1).resolve(claimed); await new Promise(resolve => setTimeout(resolve, 0)); };
      set(0, 9, 0); step(); step();
      assert(requests.length === 1 && !dialog.open && ctx.game.players.length === 0, 'First Start waits for a desktop claim without joining');
      await settle(true); step(); verifyOpen(0, 'xbox');
      assert(ctx.game.players.length === 0 && requests.length === 1, 'Delayed claim opens settings once and never schedules a lobby join');
      for (let frame = 0; frame < 12; frame++) step();
      assert(dialog.open && selectedTab() === 'display', 'Held input stays consumed after a delayed desktop claim');
      release(); press(0, 9);
      pads[0].id = 'Xbox Wireless Controller QA pending-upgrade'; ctx.previousPads.clear();
      set(0, 0); step(); neutral(); step(); set(0, 9); step();
      await settle(true); step();
      assert(dialog.open && ctx.game.players.length === 0, 'Start during a pending face-button claim replaces its join intent');
      release(); press(0, 9);
      set(1, 9); step(); await settle(false); step();
      assert(!dialog.open && ctx.game.players.length === 0, 'A denied controller claim cannot open settings or join');
      for (let frame = 0; frame < 12; frame++) step();
      assert(!dialog.open, 'A held denied Start cannot bypass controller claiming');
      release(); set(1, 9); step();
      ctx.screen = 'workshop'; await settle(true); ctx.screen = 'lobby'; step();
      assert(!dialog.open && ctx.game.players.length === 0, 'A late claim does not open settings after its source screen changed');
      release();
      pads[1].id = 'Nintendo Switch Pro Controller QA ordinary-join';
      set(1, 0); step(); await settle(true); step();
      assert(ctx.game.players.length === 1 && ctx.game.players[0].device === 'pad:1', 'Desktop claim still retains an ordinary face-button join');
      release();
      delete window.desktop; delete document.hasFocus;
      press(1, 9); verifyOpen(1, 'switch');
      press(1, 5); press(1, 5);
      return { checks, passed: checks.length, synthetic: true, physicalControllersTested: false };
    })()`);
    await run(`(()=>{
      document.getElementById('close-settings').focus();
      window.lobbySettingsKeyboardFocus = document.activeElement;
      window.lobbySettingsNativeKeys = [];
      document.addEventListener('keydown', event => window.lobbySettingsNativeKeys.push(event.key), true);
      return true;
    })()`);
    win.webContents.focus();
    for (const keyCode of ['Tab', 'Down', 'Enter', 'Space', 'Escape']) {
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode });
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    await run(`(()=>{
      const dialog = document.getElementById('settings-dialog');
      if (window.lobbySettingsNativeKeys.length !== 5) throw Error('Native keyboard events were not delivered: ' + JSON.stringify(window.lobbySettingsNativeKeys));
      if (!dialog.open || dialog.dataset.ownerDevice !== 'pad:1' ||
          document.activeElement !== window.lobbySettingsKeyboardFocus ||
          dialog.querySelector('[aria-selected="true"]').dataset.settingsTab !== 'controls')
        throw Error('Native keyboard input bypassed controller-owned settings');
      document.getElementById('close-settings').click();
      document.getElementById('settings-button').click();
      if (dialog.dataset.ownerDevice !== 'keyboard') throw Error('Keyboard opening lost ownership');
      return true;
    })()`);
    win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
    win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
    // Native dialog close is an animation task; pump it after the QA frame freeze.
    await run('new Promise(resolve => window.lobbySettingsControllerRAF(() => window.lobbySettingsControllerRAF(resolve)))');
    await run(`(()=>{
      const dialog = document.getElementById('settings-dialog');
      if (dialog.open || dialog.dataset.ownerDevice) throw Error('Keyboard owner cannot cancel settings or ownership was retained: ' + JSON.stringify({open:dialog.open,owner:dialog.dataset.ownerDevice,keys:window.lobbySettingsNativeKeys}));
      const ctx = window.lobbySettingsControllerContext, pads = navigator.getGamepads();
      const press = button => {
        pads[1].buttons[button].pressed = true; ctx.inputFrame();
        pads[1].buttons[button].pressed = false; ctx.inputFrame();
      };
      press(9); press(5); press(5);
      if (!dialog.open || dialog.dataset.ownerDevice !== 'pad:1') throw Error('Keyboard cancellation left stale controller ownership');
      return true;
    })()`);
    result.checks.push('Native keyboard Tab/arrows/accept/Space/Escape cannot navigate or close controller-owned settings',
      'Keyboard-owned settings still cancels with native Escape and permits a new controller opener');
    result.passed = result.checks.length;
    console.log('Passed ' + result.passed + ' actual inputFrame and ownership checks');
    const layouts = [];
    for (const [width, height] of [[1280, 850], [600, 430]]) {
      win.setContentSize(width, height);
      await new Promise(resolve => setTimeout(resolve, 250));
      const layout = await run(`(()=>{
        const dialog = document.getElementById('settings-dialog'), rect = dialog.getBoundingClientRect();
        const panels = [...dialog.querySelectorAll('[data-settings-panel]')].filter(panel => panel.getClientRects().length);
        if (!dialog.open || rect.width <= 0 || rect.height <= 0 || rect.left < -1 || rect.top < -1 ||
            rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1 || panels.length !== 1)
          throw Error('Settings is not rendered within the resized viewport');
        const done = document.getElementById('close-settings').getBoundingClientRect();
        if (done.height <= 0 || done.bottom > rect.bottom + 1) throw Error('Settings close control is clipped');
        return { viewport: [innerWidth, innerHeight], dialog: [rect.width, rect.height], visiblePanel: panels[0].dataset.settingsPanel };
      })()`);
      layouts.push(layout);
      fs.mkdirSync(output, { recursive: true });
      fs.writeFileSync(path.join(output, `settings-${width}x${height}.png`), (await win.webContents.capturePage()).toPNG());
    }
    if (errors.length) throw Error('Renderer errors: ' + errors.join('\n'));
    const report = { ...result, layouts, rendererErrors: errors };
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    app.exit(0);
  } catch (error) {
    console.error(error);
    if (win.webContents.debugger.isAttached()) win.webContents.debugger.detach();
    app.exit(1);
  }
}).catch(error => { console.error(error); app.exit(1); });
