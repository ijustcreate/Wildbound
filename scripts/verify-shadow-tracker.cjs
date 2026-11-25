const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const root = path.resolve(__dirname, '..');
const target = process.env.WILDBOUND_VERIFY_APP;
const out = path.join(root, 'test-output', 'shadow-tracker', target ? 'packaged' : 'source');
fs.mkdirSync(out, { recursive: true });
app.setPath('userData', fs.mkdtempSync(path.join(out, 'profile-')));
app.commandLine.appendSwitch('mute-audio');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1200, height: 790, webPreferences: { backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  await win.loadFile(path.join(target || root, 'index.html'));
  await win.webContents.executeJavaScript('wildboundBoot.ready');
  const checks = await win.webContents.executeJavaScript(`(async () => {
    window.requestAnimationFrame = () => 0;
    const { Game } = await import('./src/core.mjs');
    const { Assets } = await import('./src/assets.mjs');
    const { Renderer } = await import('./src/render.mjs');
    const { HeroUI } = await import('./src/hero-ui.mjs');
    const { shadowTrackerActors } = await import('./src/shadow-tracker.mjs');
    const checks = [];
    const ok = (condition, label) => { if (!condition) throw Error(label); checks.push(label); };
    const assets = new Assets();
    await assets.load();
    const g = new Game(() => .5);
    g.environment = 'shadow';
    g.seed = 42;
    g.spriteLibrary = assets.library;
    g.onSound = () => {};
    g.persist = () => {};
    g.addPlayer('keyboard', 'Tracker visitor');
    g.start();
    g.openingBoard = false;
    const p = g.players[0];
    const tick = (input = {}) => g.update(.05, { keyboard: input });
    for (let i = 0; i < 40; i++) tick();
    const [tracker, panther] = shadowTrackerActors(g);
    ok(g.generatedEnvironment === 'shadow' && tracker?.isQuestNpc && panther?.sprite === 'panther',
      'Drizzt and Guenhwyvar spawn with the Shadow Realm');

    const scene = document.createElement('div');
    scene.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#161723';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    const uiRoot = document.createElement('div');
    uiRoot.style.cssText = 'position:absolute;inset:0';
    scene.append(canvas, uiRoot);
    document.body.append(scene);
    const renderer = new Renderer(canvas, assets);
    const ui = new HeroUI(uiRoot);
    const draw = () => {
      Object.assign(renderer.camera, { x: p.x, y: p.y, zoom: 1.4 });
      renderer.draw(g, .016);
      ui.draw(g, renderer);
    };
    const approach = [[0,26],[0,-26],[-26,0],[26,0]].map(([dx,dy]) => ({x:tracker.x+dx,y:tracker.y+dy}))
      .find(({x,y}) => !g.blocked(x,y,10));
    ok(approach, 'Drizzt has a walkable interaction approach');
    Object.assign(p, approach);
    tick({interact:true});
    ok(p.ui?.shadowTracker, 'native Interact opens Drizzt’s dialogue');
    draw();
    ok(uiRoot.querySelector('.npc-dialogue h2')?.textContent === tracker.name, 'dialogue displays Drizzt’s name');
    const portrait = uiRoot.querySelector('.npc-dialogue-portrait');
    ok(portrait?.getContext('2d').getImageData(0,0,portrait.width,portrait.height).data.some((value,i) => i%4===3 && value>0),
      'native Drizzt portrait renders');
    const messages = [];
    const showMessage = g.message.bind(g);
    g.message = (message, ...args) => { messages.push(message); return showMessage(message, ...args); };
    window.advanceShadowTrackerVerification = () => {
      const chooseFirst = () => uiRoot.querySelector('.npc-dialogue [data-index="0"]').click();
      chooseFirst();
      draw();
      ok(/pawprints/.test(uiRoot.querySelector('.npc-dialogue-text')?.textContent), 'trail branch explains how to follow Guenhwyvar');
      chooseFirst();
      ok(!p.ui && messages.some(message => /Follow Guenhwyvar/.test(message)), 'native dialogue starts the tracking route');

      const far = [[150,0],[-150,0],[0,150],[0,-150]].map(([dx,dy]) => ({x:panther.x+dx,y:panther.y+dy}))
        .find(({x,y}) => !g.blocked(x,y,10));
      ok(far, 'tracking clearing has a walkable waiting point');
      Object.assign(p, far);
      for (let i=0; i<10; i++) tick();
      const [,waiting] = shadowTrackerActors(g);
      ok(waiting.x===panther.x && waiting.y===panther.y, 'Guenhwyvar waits when the player falls behind');
      const follow = (count) => {
        for (let i=0; i<count; i++) {
          const [, guide] = shadowTrackerActors(g);
          const offset = [[0,24],[0,-24],[-24,0],[24,0]].map(([dx,dy]) => ({x:guide.x+dx,y:guide.y+dy}))
            .find(({x,y}) => !g.blocked(x,y,10));
          if (!offset) throw Error('No walkable place to follow Guenhwyvar');
          Object.assign(p, offset);
          tick();
          if (messages.some(message => /has led you back to Drizzt/.test(message))) break;
        }
      };
      follow(40);
      const [,moving] = shadowTrackerActors(g);
      ok(Math.hypot(moving.x-panther.x,moving.y-panther.y)>30, 'Guenhwyvar moves on the trail when followed');
      draw();
      window.finishShadowTrackerVerification = () => {
        follow(500);
        ok(messages.some(message => /has led you back to Drizzt/.test(message)), 'the tracking route completes at Drizzt');
        return checks;
      };
    };
    return checks;
  })()`);
  const capture = async (name) => {
    await new Promise(resolve => setTimeout(resolve, 250));
    fs.writeFileSync(path.join(out, name + '.png'), (await win.webContents.capturePage()).toPNG());
  };
  await capture('dialogue');
  await win.webContents.executeJavaScript('window.advanceShadowTrackerVerification()');
  await capture('trail');
  checks.push(...(await win.webContents.executeJavaScript('window.finishShadowTrackerVerification()')).slice(checks.length));
  if (errors.length) throw Error(errors.join('\n'));
  const report = { passed: checks.length, checks, errors, muted: win.webContents.isAudioMuted() };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  app.exit(0);
}).catch(error => { console.error(error); app.exit(1); });
