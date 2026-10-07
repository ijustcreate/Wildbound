// Source-only native Electron QA. Each run has its own output and save profile.
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const base = process.env.WILDBOUND_VERIFY_APP || root;
if (!process.versions.electron) {
  const candidates = [process.env.WILDBOUND_QA_ELECTRON,
    path.join(root, 'node_modules/electron/dist/electron.exe'),
    path.join(root, 'test-output/electron-41.10.7/electron.exe')];
  const binary = candidates.find(p => p && fs.existsSync(p));
  if (!binary) throw Error('No native Electron runtime found; set WILDBOUND_QA_ELECTRON');
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const child = require('node:child_process').spawnSync(binary, [__filename, ...process.argv.slice(2)],
    { cwd: root, env, encoding: 'utf8', timeout: 90000 });
  process.stdout.write(child.stdout || ''); process.stderr.write(child.stderr || '');
  if (child.error) console.error(child.error);
  process.exit(child.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
const baseline = process.argv.includes('--baseline');
const out = path.join(root, 'test-output', `lobby-prop-art-${baseline ? 'before-' : ''}${Date.now()}-${process.pid}`);
fs.mkdirSync(out, { recursive: true });
app.setPath('userData', path.join(out, 'profile'));
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1280, height: 850, useContentSize: true,
    webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setAudioMuted(true);
  const errors = [];
  win.webContents.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
  const deadline = setTimeout(() => { console.error('Lobby prop QA timed out'); app.exit(1); }, 75000);
  const run = async source => {
    const result = await win.webContents.executeJavaScript(`(async()=>{try{return await (${source});}catch(e){return {qaError:e.stack};}})()`);
    if (result?.qaError) throw Error(result.qaError);
    return result;
  };
  const save = (name, data) => fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(data.split(',')[1], 'base64'));
  try {
    await win.loadURL('about:blank');
    win.webContents.debugger.attach('1.3');
    await win.webContents.debugger.sendCommand('Debugger.enable');
    await win.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl', {
      urlRegex: 'src/debug-tools\\.mjs$', lineNumber: 3, condition: '(window.lobbyPropQAContext=ctx,false)',
    });
    await win.loadFile(path.join(base, 'index.html'), { query: { tools: '1' } });
    await run('window.wildboundBoot.ready');
    await run(`(async()=>{
      const ctx=window.lobbyPropQAContext;if(!ctx)throw Error('Missing existing lobby context');
      const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
      ctx.newLobby();ctx.paused=true;ctx.playableLobby.draw();return true;
    })()`);
    win.webContents.debugger.detach();
    const layouts = [];
    for (const [width, height] of [[1280, 850], [960, 650], [600, 430]]) {
      win.setContentSize(width, height);
      await new Promise(resolve => setTimeout(resolve, 200));
      layouts.push(await run(`(()=>{
        const l=window.lobbyPropQAContext.playableLobby;l.draw();
        const r=l.canvas.getBoundingClientRect(),v=l.view;
        const names=['Map table','Difficulty totem','Dice tray','Explorer station'];
        const labels=l.labels.filter(q=>names.includes(q.text));
        if(labels.length!==4)throw Error('Station labels missing');
        for(const q of labels){const x=r.width/2+(q.x-v.x)*v.zoom,y=r.height/2+(q.y-v.y)*v.zoom;
          if(x<0||x>r.width||y<0||y>r.height)throw Error('Label clipped '+q.text);}
        if(r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1)throw Error('Room clipped');
        return {viewport:[innerWidth,innerHeight],canvas:[r.width,r.height],labels:labels.map(q=>q.text)};
      })()`));
      // Let Chromium composite the synchronous canvas draw before capturePage.
      await new Promise(resolve => setTimeout(resolve, 120));
      fs.writeFileSync(path.join(out, `lobby-${width}x${height}.png`), (await win.webContents.capturePage()).toPNG());
    }
    const report = { baseline, passed: layouts.length, failed: 0, layouts, rendererErrors: errors, out,
      profile: app.getPath('userData'), source: base };
    if (!baseline) {
      const art = await run(`(async()=>{
        const a=await import('./src/lobby-prop-art.mjs');
        const {LOBBY_OBJECTS}=await import('./src/playable-lobby.mjs');
        const variants=[];const sheet=document.createElement('canvas');sheet.width=1080;sheet.height=810;
        const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#303a3b';c.fillRect(0,0,sheet.width,sheet.height);
        for(const [row,difficulty]of ['gentle','adventure','wild'].entries()){
          const y=row*270;c.fillStyle='#eadfc4';c.font='16px system-ui';c.fillText(difficulty.toUpperCase(),16,y+24);
          for(const [column,id]of ['environment','dice-count','character-station','difficulty'].entries()){
            const anchor={x:column*270+135,y:y+(id==='difficulty'?225:160)};
            c.save();c.translate(anchor.x,anchor.y);c.scale(id==='difficulty'?1.25:2.5,id==='difficulty'?1.25:2.5);
            const o={x:0,y:0};
            if(id==='environment')a.drawLobbyMapTable(c,o,['forest','beach','temple'][row]);
            if(id==='dice-count')a.drawLobbyDiceTray(c,o,row===1?1:2);
            if(id==='character-station')a.drawLobbyExplorerStation(c,o);
            if(id==='difficulty')a.drawLobbyDifficultyTotem(c,o,difficulty);c.restore();
          }
        }
        const maps=document.createElement('canvas');maps.width=1120;maps.height=220;const mc=maps.getContext('2d');
        mc.imageSmoothingEnabled=false;mc.fillStyle='#303a3b';mc.fillRect(0,0,maps.width,maps.height);
        for(const [i,map]of ['random','forest','desert','ice','house','temple','beach'].entries()){
          mc.fillStyle='#eadfc4';mc.font='14px system-ui';mc.fillText(map,160*i+40,28);
          mc.save();mc.translate(160*i+80,110);mc.scale(1.5,1.5);a.drawLobbyMapTable(mc,{x:0,y:0},map);mc.restore();
        }
        const l=window.lobbyPropQAContext.playableLobby;
        const {LOBBY_PROP_ART_BOUNDS:bounds}=a;
        for(const o of LOBBY_OBJECTS.filter(o=>bounds[o.id])){
          const b=bounds[o.id];if(o.y+b.y+b.h>=o.y+36)throw Error('Art overlaps caption '+o.id);
        }
        for(const difficulty of ['gentle','adventure','wild'])for(const map of ['random','forest','desert','ice','house','temple','beach'])for(const dice of [1,2]){
          document.getElementById('difficulty').value=difficulty;document.getElementById('environment').value=map;
          document.getElementById('dice-count').value=String(dice);l.draw();variants.push(l.canvas.toDataURL());
        }
        if(new Set(variants).size!==42)throw Error('Lobby setting variants do not render distinctly');
        document.getElementById('difficulty').value='adventure';document.getElementById('environment').value='forest';
        document.getElementById('dice-count').value='2';l.draw();
        return {sheet:sheet.toDataURL(),maps:maps.toDataURL(),variants:variants.length};
      })()`);
      save('props-native', art.sheet); save('map-variants-native', art.maps);
      report.variants = art.variants; report.passed += art.variants + 4;
      win.setContentSize(1280, 850);
      await new Promise(resolve => setTimeout(resolve, 200));
      report.prompts = [];
      for (const [id,x,y] of [['environment',625,482],['dice-count',780,482],['character-station',635,240],['difficulty',900,220]]) {
        report.prompts.push(await run(`(()=>{
          const ctx=window.lobbyPropQAContext,l=ctx.playableLobby;
          const p=ctx.game.players[0]||ctx.game.addPlayer('keyboard','ART QA');p.profileId='isolated-art-qa';
          l.state.sync(ctx.game.players);const s=l.state.members.get(p.id);
          Object.assign(s,{spawned:true,panel:null,x:${x},y:${y}});
          if(l.state.nearest(p)?.id!==${JSON.stringify(id)})throw Error('Wrong nearby interaction');l.draw();
          const prompt=l.labels.find(q=>q.text.startsWith('E · '));if(!prompt)throw Error('Missing interaction prompt');
          return {station:${JSON.stringify(id)},text:prompt.text};
        })()`));
        await new Promise(resolve => setTimeout(resolve, 120));
        fs.writeFileSync(path.join(out, `prompt-${id}.png`), (await win.webContents.capturePage()).toPNG());
      }
      report.passed += report.prompts.length;
    }
    if (errors.length) throw Error('Renderer errors: ' + errors.join('\n'));
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));clearTimeout(deadline);app.exit(0);
  } catch (error) {
    console.error(error.stack);fs.writeFileSync(path.join(out, 'failure.txt'), error.stack);
    try { fs.writeFileSync(path.join(out, 'failure.png'), (await win.webContents.capturePage()).toPNG()); } catch {}
    clearTimeout(deadline);app.exit(1);
  }
});
