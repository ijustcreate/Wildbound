const { app, BrowserWindow } = require("electron"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "test-output/murk-wolf");
fs.mkdirSync(out, { recursive: true });
app.disableHardwareAcceleration();
app.setPath("userData", path.join(out, "qa-profile"));
app.whenReady().then(async () => {
  const w = new BrowserWindow({
      show: false,
      width: 1500,
      height: 980,
      webPreferences: { offscreen: true },
    }),
    errors = [];
  w.webContents.on("console-message", (_event, level, message) => {
    if (level >= 3) errors.push(message);
  });
  try {
    await w.loadFile(path.join(root, "murk-wolf-test.html"));
    await w.webContents.executeJavaScript("window.murkTest.ready");
    const data = await w.webContents.executeJavaScript(`(async()=>{
  window.murkTest.setPlaying(false);
  const motion=await import('./src/murk-wolf-motion.mjs'),{directionVector,poseAt}=await import('./src/player-motion.mjs'),{captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.translate(128,160);const model=motion.defaultMurkWolfMotion();
  let poses=0;for(const [name,clip] of Object.entries(model.clips))for(let d=0;d<8;d++)for(let frame=0;frame<clip.length;frame++){
   const [faceX,faceY]=directionVector(d);c.clearRect(-128,-160,256,256);motion.drawMurkWolf(c,{faceX,faceY,animationAction:name,playerFrame:frame},0,model);poses++;
  }
  captureLayers(model);motion.drawMurkWolf(c,{faceX:0,faceY:1,animationAction:'idle',playerFrame:0},0,model);releaseLayers(model);
  const layers=capturedLayers(model,0),parts=['eyeL','eyeR','earL','earR','muzzle','nose','jaw'];
  for(const id of ['Murk body','Murk skull']){const part=layers.find(p=>p.id===id);
  if(!part?.sprite.pixels.some(Boolean)||part.sprite.palette.slice(1).some(color=>!Object.values(model.palette).includes(color)))throw Error(id+' must use native palette pixels');}
  for(const bone of parts){const layer=layers.find(p=>p.bone===bone);if(!layer||!layer.sprite.pixels.some(Boolean))throw Error('Missing independent sprite: '+bone);if(layer.bones.includes('head'))throw Error('Detail bundled with head');}
  const skull=JSON.stringify(layers.find(p=>p.bone==='head').sprite);model.boneSprites={'Murk eye L':{0:{width:1,height:1,x:0,y:0,palette:['transparent','#ff00ff'],pixels:[1]}}};
  captureLayers(model);motion.drawMurkWolf(c,{faceX:0,faceY:1,animationAction:'idle',playerFrame:0},0,model);releaseLayers(model);const edited=capturedLayers(model,0);
  if(JSON.stringify(edited.find(p=>p.bone==='head').sprite)!==skull)throw Error('Eye edit changed skull');if(!edited.find(p=>p.bone==='eyeL').sprite.palette.includes('#ff00ff'))throw Error('Eye override failed');
  const studio=window.murkTest.studio;document.getElementById('open-studio').click();studio.selected='eyeL';studio.refresh();studio.animate(0);if(!document.querySelector('.ps-bone-sprites').textContent.includes('Murk eye L'))throw Error('Eye absent from studio');
  studio.selected='earL';studio.boneSpriteKey=null;studio.refresh();studio.animate(0);if(!document.querySelector('.ps-bone-sprites').textContent.includes('Murk ear L'))throw Error('Ear absent from studio');
  document.getElementById('open-studio').click();window.scrollTo(0,0);window.murkTest.render('idle',0);
  return {poses,body:'native wolf-style pixel drawing',head:'native wolf-style pixel drawing',sourceAnimations:model.provenance.sourceAnimations,joints:Object.keys(model.joints).length,clips:Object.keys(model.clips).length,independentParts:parts,layers:layers.map(p=>({id:p.id,bone:p.bone,size:[p.sprite.width,p.sprite.height]})),valid:motion.validateMurkWolfMotion(model)};
 })()`);
    for (const [name, time] of [
      ["idle", 0],
      ["run", 0.19],
      ["bite", 0.3],
      ["howl", 1],
      ["death", 1],
    ]) {
      const png = await w.webContents.executeJavaScript(
        `window.murkTest.render(${JSON.stringify(name)},${time});document.getElementById('views').toDataURL('image/png').split(',')[1]`,
      );
      fs.writeFileSync(
        path.join(out, name + ".png"),
        Buffer.from(png, "base64"),
      );
    }
    // Also exercise the actual game boot, shared authored rig and studio route.
    await w.loadFile(path.join(root, "index.html"));
    await w.webContents.executeJavaScript("window.wildboundBoot.ready");
    data.gameStudio = await w.webContents.executeJavaScript(`(async()=>{
  const {murkWolfMotion,validateMurkWolfMotion}=await import('./src/murk-wolf-motion.mjs');
  if(!validateMurkWolfMotion(murkWolfMotion))throw Error('Authored Murk Wolf did not load');
  const button=[...document.querySelectorAll('button')].find(b=>b.textContent==='Rig studio');if(!button)throw Error('Game studio button absent');button.click();
  const picker=document.querySelector('.ps-subject');if(!picker)throw Error('Game Rig Studio did not mount');picker.value='murk_wolf';picker.dispatchEvent(new Event('change'));
  if(document.querySelector('.ps-subject').value!=='murk_wolf')throw Error('Subject selection failed');if(!document.querySelector('.designer-dialog[open]'))throw Error('Game studio dialog closed');return true;
 })()`);
    await new Promise((resolve) => setTimeout(resolve, 350));
    fs.writeFileSync(
      path.join(out, "game-studio.png"),
      (await w.webContents.capturePage()).toPNG(),
    );
    if (errors.length) throw Error(errors.join("\n"));
    fs.writeFileSync(
      path.join(out, "qa.json"),
      JSON.stringify({ ...data, errors }, null, 2),
    );
    console.log(JSON.stringify(data));
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
