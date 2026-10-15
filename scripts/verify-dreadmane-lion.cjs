const { app, BrowserWindow } = require("electron"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "test-output/dreadmane-lion");
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
    await w.loadFile(path.join(root, "dreadmane-lion-test.html"));
    await w.webContents.executeJavaScript("window.dreadmaneTest.ready");
    const data = await w.webContents.executeJavaScript(`(async()=>{
  window.dreadmaneTest.setPlaying(false);
  const motion=await import('./src/dreadmane-lion-motion.mjs'),{directionVector,poseAt}=await import('./src/player-motion.mjs'),{captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.translate(128,160);const model=motion.defaultDreadmaneLionMotion();
  let poses=0;for(const [name,clip] of Object.entries(model.clips))for(let d=0;d<8;d++)for(let frame=0;frame<clip.length;frame++){
   const [faceX,faceY]=directionVector(d);c.clearRect(-128,-160,256,256);motion.drawDreadmaneLion(c,{faceX,faceY,animationAction:name,playerFrame:frame},0,model);poses++;
  }
  captureLayers(model);motion.drawDreadmaneLion(c,{faceX:0,faceY:1,animationAction:'idle',playerFrame:0},0,model);releaseLayers(model);
  const layers=capturedLayers(model,0),parts=['eyeL','eyeR','earL','earR','muzzle','nose','jaw'];
  for(const id of ['Dreadmane body','Dreadmane skull']){const part=layers.find(p=>p.id===id);
  if(!part?.sprite.pixels.some(Boolean)||part.sprite.palette.slice(1).some(color=>!Object.values(model.palette).includes(color)))throw Error(id+' must use native palette pixels');}
  for(const bone of parts){const layer=layers.find(p=>p.bone===bone);if(!layer||!layer.sprite.pixels.some(Boolean))throw Error('Missing independent sprite: '+bone);if(layer.bones.includes('head'))throw Error('Detail bundled with head');}
  const skull=JSON.stringify(layers.find(p=>p.bone==='head').sprite);model.boneSprites={'Dreadmane eye L':{0:{width:1,height:1,x:0,y:0,palette:['transparent','#ff00ff'],pixels:[1]}}};
  captureLayers(model);motion.drawDreadmaneLion(c,{faceX:0,faceY:1,animationAction:'idle',playerFrame:0},0,model);releaseLayers(model);const edited=capturedLayers(model,0);
  if(JSON.stringify(edited.find(p=>p.bone==='head').sprite)!==skull)throw Error('Eye edit changed skull');if(!edited.find(p=>p.bone==='eyeL').sprite.palette.includes('#ff00ff'))throw Error('Eye override failed');
  const studio=window.dreadmaneTest.studio;document.getElementById('open-studio').click();studio.selected='eyeL';studio.refresh();studio.animate(0);if(!document.querySelector('.ps-bone-sprites').textContent.includes('Dreadmane eye L'))throw Error('Eye absent from studio');
  studio.selected='earL';studio.boneSpriteKey=null;studio.refresh();studio.animate(0);if(!document.querySelector('.ps-bone-sprites').textContent.includes('Dreadmane ear L'))throw Error('Ear absent from studio');
  document.getElementById('open-studio').click();window.scrollTo(0,0);window.dreadmaneTest.render('idle',0);
  return {poses,body:'native lion pixel drawing',head:'native lion pixel drawing',sourceAnimations:model.provenance.sourceAnimations,joints:Object.keys(model.joints).length,clips:Object.keys(model.clips).length,independentParts:parts,layers:layers.map(p=>({id:p.id,bone:p.bone,size:[p.sprite.width,p.sprite.height]})),valid:motion.validateDreadmaneLionMotion(model)};
 })()`);
    for (const [name, time] of [
      ["idle", 0],
      ["run", 0.19],
      ["claw_left", 0.43],
      ["roar", 0.88],
      ["death", 1.9],
      ["pounce", 0.55],
      ["sleep", 0.5],
    ]) {
      const png = await w.webContents.executeJavaScript(
        `window.dreadmaneTest.render(${JSON.stringify(name)},${time});document.getElementById('views').toDataURL('image/png').split(',')[1]`,
      );
      fs.writeFileSync(
        path.join(out, name + ".png"),
        Buffer.from(png, "base64"),
      );
    }
    // Also exercise the actual game boot, shared authored rig and studio route.
    await w.loadFile(path.join(root, "index.html"), { query: { tools: "1" } });
    await w.webContents.executeJavaScript("window.wildboundBoot.ready");
    data.gameStudio = await w.webContents.executeJavaScript(`(async()=>{
  const {dreadmaneLionMotion,validateDreadmaneLionMotion}=await import('./src/dreadmane-lion-motion.mjs');
  if(!validateDreadmaneLionMotion(dreadmaneLionMotion))throw Error('Authored Dreadmane Lion did not load');
  const button=[...document.querySelectorAll('button')].find(b=>b.textContent==='Rig studio');if(!button)throw Error('Game studio button absent');button.click();
  const picker=document.querySelector('.ps-subject');if(!picker)throw Error('Game Rig Studio did not mount');picker.value='dreadmane_lion';picker.dispatchEvent(new Event('change'));
  if(document.querySelector('.ps-subject').value!=='dreadmane_lion')throw Error('Subject selection failed');if(!document.querySelector('.designer-dialog[open]'))throw Error('Game studio dialog closed');return true;
 })()`);
    await new Promise((resolve) => setTimeout(resolve, 350));
    fs.writeFileSync(
      path.join(out, "game-studio.png"),
      (await w.webContents.capturePage()).toPNG(),
    );
    data.gameCombat = await w.webContents.executeJavaScript(`(async()=>{
      await window.showcase('dreadmane-fight');
      const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
      const {game:g,player:p,lion:e,renderer}=window.dreadmaneFight,actions=new Set(),hits=[];
      const hurt=g.hurt.bind(g);g.hurt=(target,n,source)=>{const before=target.hp;hurt(target,n,source);if(target.hp<before)hits.push({action:source.dreadAction,damage:before-target.hp});};
      const setup=(distance)=>{Object.assign(p,{x:700,y:1000,hp:1000,maxHp:1000,invuln:0,stun:0,hit:0});Object.assign(e,{x:700+distance,y:1000,hp:220,state:'hunt',dreadAction:null,dreadAge:0,dreadRecovery:0,flash:0,cooldown:0,dreadRoarCooldown:99,dreadPounceCooldown:99});};
      const tick=(seconds)=>{for(let t=0;t<seconds;t+=.02){g.update(.02,{});actions.add(e.animationAction);}};
      setup(60);tick(2.35);if(hits.filter(h=>h.action==='claw_left'||h.action==='claw_right').length!==2)throw Error('Actual Game claw combo failed: '+JSON.stringify(hits));
      setup(110);e.dreadRoarCooldown=0;tick(.3);renderer.camera={x:780,y:1000,zoom:2};renderer.draw(g,0);
      window.dreadmaneCombatPicture=document.querySelector('#game-canvas').toDataURL();
      tick(.8);if(!hits.some(h=>h.action==='roar')||!(p.stun>0))throw Error('Actual Game roar failed');
      setup(180);e.dreadPounceCooldown=0;tick(2.4);if(!hits.some(h=>h.action==='pounce'))throw Error('Actual Game pounce failed: '+JSON.stringify({hits,e:[e.x,e.y,e.state],p:[p.x,p.y]}));
      const restored=JSON.parse(JSON.stringify(e));if(!Array.isArray(restored.dreadHits))throw Error('Hit registry cannot persist');
      return {actions:[...actions],hits,saveSafe:true};
    })()`);
    const combat = await w.webContents.executeJavaScript(
      "window.dreadmaneCombatPicture.split(',')[1]",
    );
    fs.writeFileSync(
      path.join(out, "combat.png"),
      Buffer.from(combat, "base64"),
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
