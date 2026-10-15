const { app, BrowserWindow } = require("electron"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "test-output/oathless-captain");
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
  w.webContents.on("console-message", (_e, level, message) => {
    if (level >= 3) errors.push(message);
  });
  try {
    await w.loadFile(path.join(root, "oathless-captain-test.html"));
    await w.webContents.executeJavaScript("window.captainTest.ready");
    const data = await w.webContents.executeJavaScript(`(async()=>{
   window.captainTest.setPlaying(false);
   const motion=await import('./src/oathless-captain-motion.mjs'),{directionVector}=await import('./src/player-motion.mjs'),{captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
   const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.translate(128,160);const model=motion.defaultOathlessCaptainMotion();let poses=0;
   for(const[name,clip]of Object.entries(model.clips))for(let d=0;d<8;d++)for(let frame=0;frame<clip.length;frame++){const[faceX,faceY]=directionVector(d);c.clearRect(-128,-160,256,256);motion.drawOathlessCaptain(c,{faceX,faceY,animationAction:name,playerFrame:frame},0,model);poses++}
   const actor={faceX:0,faceY:1,animationAction:'idle',playerFrame:0};
   const capture=()=>{captureLayers(model);motion.drawOathlessCaptain(c,actor,0,model);releaseLayers(model);return capturedLayers(model,0)};
   const layers=capture(),parts=['eyeL','eyeR','earL','earR','nose','mouth','hair','swordGrip','shieldGrip'];
   for(const bone of parts){const p=layers.find(p=>p.bone===bone);if(!p?.sprite.pixels.some(Boolean))throw Error('Missing independent '+bone);if(p.bones.includes('head'))throw Error('Bundled feature '+bone)}
   const face=JSON.stringify(layers.find(p=>p.id==='Captain face').sprite);model.boneSprites={'Captain eye L':{0:{width:1,height:1,x:0,y:0,palette:['transparent','#ff00ff'],pixels:[1]}}};const edited=capture();
   if(JSON.stringify(edited.find(p=>p.id==='Captain face').sprite)!==face)throw Error('Eye edit changed face');if(!edited.find(p=>p.bone==='eyeL').sprite.palette.includes('#ff00ff'))throw Error('Eye override ignored');
   delete model.boneSprites;const weapon=capture().find(p=>p.id==='Captain weapon').sprite;model.wearables.sword={0:{x:3,y:2,rotation:0,scale:1}};const moved=capture().find(p=>p.id==='Captain weapon').sprite;if(moved.x!==weapon.x+3||moved.y!==weapon.y+2)throw Error('Equipment fitting transform ignored');
   actor.equipment={hand1:null,hand2:null};if(capture().some(p=>['Captain weapon','Captain offhand'].includes(p.id)))throw Error('Unequip ignored');
   const studio=window.captainTest.studio;document.getElementById('open-studio').click();studio.selected='eyeL';studio.refresh();studio.animate(0);if(!document.querySelector('.ps-bone-sprites').textContent.includes('Captain eye L'))throw Error('Eye absent from studio');
   studio.selected='hair';studio.boneSpriteKey=null;studio.refresh();studio.animate(0);if(!document.querySelector('.ps-bone-sprites').textContent.includes('Captain hair'))throw Error('Hair absent from studio');
   document.getElementById('open-studio').click();window.scrollTo(0,0);return {poses,joints:Object.keys(model.joints).length,clips:Object.keys(model.clips).length,independentParts:parts,equipmentFits:true,unequip:true,eyeIsolation:true,valid:motion.validateOathlessCaptainMotion(model)};
  })()`);
    for (const [name, t] of [
      ["idle", 0],
      ["walk", 0.3],
      ["run", 0.19],
      ["slash", 0.55],
      ["shield_bash", 0.43],
      ["thrust", 0.42],
      ["death", 1.95],
      ["salute", 0.9],
    ]) {
      const png = await w.webContents.executeJavaScript(
        `window.captainTest.render(${JSON.stringify(name)},${t});document.querySelector('#views').toDataURL().split(',')[1]`,
      );
      fs.writeFileSync(
        path.join(out, name + ".png"),
        Buffer.from(png, "base64"),
      );
    }
    await w.loadFile(path.join(root, "index.html"), { query: { tools: "1" } });
    await w.webContents.executeJavaScript("window.wildboundBoot.ready");
    data.gameStudio = await w.webContents.executeJavaScript(`(async()=>{
   const {oathlessCaptainMotion:m,validateOathlessCaptainMotion:v}=await import('./src/oathless-captain-motion.mjs');if(!v(m))throw Error('Authored captain invalid');
   [...document.querySelectorAll('button')].find(b=>b.textContent==='Rig studio').click();const picker=document.querySelector('.ps-subject');picker.value='oathless_captain';picker.dispatchEvent(new Event('change'));if(picker.value!=='oathless_captain'||!document.querySelector('.designer-dialog[open]'))throw Error('Game studio selection failed');return true;
  })()`);
    fs.writeFileSync(
      path.join(out, "game-studio.png"),
      (await w.webContents.capturePage()).toPNG(),
    );
    data.gameCombat = await w.webContents.executeJavaScript(`(async()=>{
   await window.showcase('captain-fight');const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {game:g,player:p,captain:e,renderer}=window.captainFight,hits=[],actions=new Set(),hurt=g.hurt.bind(g);
   g.hurt=(target,n,source)=>{const before=target.hp;hurt(target,n,source);if(target.hp<before)hits.push({action:source.captainAction,damage:before-target.hp})};
   const setup=distance=>{Object.assign(p,{x:700,y:1000,hp:1000,maxHp:1000,invuln:0,stun:0,hit:0});Object.assign(e,{x:700+distance,y:1000,hp:190,state:'hunt',captainAction:null,captainAge:0,captainRecovery:0,flash:0,cooldown:0,captainBashCooldown:99,captainChargeCooldown:99,captainCombo:0})};
   const tick=seconds=>{for(let t=0;t<seconds;t+=.02){g.update(.02,{});actions.add(e.animationAction)}};
   setup(65);tick(3);if(hits.filter(h=>['slash','thrust'].includes(h.action)).length!==2)throw Error('Actual sword sequence failed '+JSON.stringify(hits));
   setup(50);e.captainBashCooldown=0;tick(.48);if(!hits.some(h=>h.action==='shield_bash')||!(p.stun>0))throw Error('Actual shield bash failed');
   setup(180);e.captainChargeCooldown=0;tick(.3);renderer.camera={x:780,y:1000,zoom:2};renderer.draw(g,0);window.captainCombatPicture=document.querySelector('#game-canvas').toDataURL();tick(1.6);if(!hits.some(h=>h.action==='charge_end'))throw Error('Actual charge failed '+JSON.stringify(hits));
   return {actions:[...actions],hits,saveSafe:Array.isArray(JSON.parse(JSON.stringify(e)).captainHits)};
  })()`);
    fs.writeFileSync(
      path.join(out, "combat.png"),
      Buffer.from(
        await w.webContents.executeJavaScript(
          "window.captainCombatPicture.split(',')[1]",
        ),
        "base64",
      ),
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
