const {app, BrowserWindow} = require('electron');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
app.disableHardwareAcceleration();
app.setPath('userData', path.join(root, 'test-output', 'player-panel-camera-profile'));
app.whenReady().then(async () => {
  const win = new BrowserWindow({show:false,width:1280,height:800,webPreferences:{offscreen:true}});
  win.webContents.setAudioMuted(true);
  try {
    await win.loadFile(path.join(root,'index.html'));
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const {Game}=await import('./src/core.mjs');
      const {Assets}=await import('./src/assets.mjs');
      const {Renderer}=await import('./src/render.mjs');
      const {HeroUI}=await import('./src/hero-ui.mjs');
      const assets=new Assets();await assets.load();
      const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%';document.body.append(canvas);
      const overlay=document.createElement('div');overlay.id='hero-overlays';overlay.style.cssText='position:fixed;inset:90px 0 80px;z-index:100';document.body.append(overlay);
      const game=new Game(()=>.5),player=game.addPlayer('pad:0');game.start();
      const renderer=new Renderer(canvas,assets),ui=new HeroUI(overlay);
      game.openInventory(player);ui.draw(game,renderer);
      for(let i=0;i<25;i++)renderer.draw(game,.05);
      const visibleX=renderer.viewport.w/2+(player.x-renderer.camera.x)*renderer.camera.zoom;
      const intendedX=renderer.viewport.w*renderer.uiPlayArea.x;
      if(intendedX<=renderer.viewport.w/2+50||Math.abs(visibleX-intendedX)>70)throw Error('Camera did not center player in open play area: '+JSON.stringify({visibleX,intendedX}));
      player.ui=null;ui.draw(game,renderer);
      for(let i=0;i<25;i++)renderer.draw(game,.05);
      const restoredX=renderer.viewport.w/2+(player.x-renderer.camera.x)*renderer.camera.zoom;
      if(Math.abs(restoredX-renderer.viewport.w/2)>70)throw Error('Camera did not return to canvas center');
      return {openAreaCenter:Math.round(intendedX),playerX:Math.round(visibleX),restoredX:Math.round(restoredX)};
    })()`);
    console.log(JSON.stringify(result));app.exit(0);
  }catch(error){console.error(error.stack||error);app.exit(1);}
});
