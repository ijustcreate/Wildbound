const { app, BrowserWindow } = require("electron"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "assets/villagers");
const buildArgument = process.argv.indexOf("--build");
const appRoot =
  buildArgument >= 0
    ? path.resolve(process.argv[buildArgument + 1], "resources/app.asar")
    : root;
fs.mkdirSync(out, { recursive: true });
app.disableHardwareAcceleration();
app.setPath("userData", path.join(root, "test-output/villagers-qa-profile"));
app.commandLine.appendSwitch("mute-audio");
app.whenReady().then(async () => {
  const w = new BrowserWindow({
    show: false,
    width: 1400,
    height: 900,
    webPreferences: { offscreen: true },
  });
  w.webContents.setAudioMuted(true);
  const errors = [];
  w.webContents.on("console-message", (_e, l, message) => {
    if (l >= 3) errors.push(message);
  });
  try {
    await w.loadFile(path.join(appRoot, "villager-test.html"));
    await w.webContents.executeJavaScript("window.villagerTest.ready");
    const result = await w.webContents.executeJavaScript(`(async()=>{
 window.villagerTest.setPlaying(false);const {defaultVillagerMotion,validateVillagerMotion,drawVillager}=await import('./src/villager-motion.mjs'),{directionVector}=await import('./src/player-motion.mjs'),{captureLayers,releaseLayers,capturedLayers}=await import('./src/render-order.mjs');
 const m=defaultVillagerMotion(),can=document.createElement('canvas');can.width=can.height=256;const c=can.getContext('2d');c.translate(128,180);let poses=0;
 for(const[name,clip]of Object.entries(m.clips))for(let d=0;d<8;d++)for(let frame=0;frame<clip.length;frame++){const[faceX,faceY]=directionVector(d);c.clearRect(-128,-180,256,256);drawVillager(c,{villagerId:'april',faceX,faceY,animationAction:name,playerFrame:frame},0,m);poses++;}
 const a={villagerId:'april',faceX:0,faceY:1,playerFrame:0};const capture=()=>{captureLayers(m);drawVillager(c,a,0,m);releaseLayers(m);return capturedLayers(m,0)};
 const layers=capture();for(const bone of ['eyeL','eyeR','earL','earR','nose','mouth','hair','swordGrip'])if(!layers.find(l=>l.bone===bone)?.sprite.pixels.some(Boolean))throw Error('Missing part '+bone);
 const face=JSON.stringify(layers.find(l=>l.id==='Villager face').sprite);m.boneSprites={'Villager eye L':{0:{width:1,height:1,x:0,y:0,palette:['transparent','#ff00ff'],pixels:[1]}}};if(JSON.stringify(capture().find(l=>l.id==='Villager face').sprite)!==face)throw Error('Eye changes face');delete m.boneSprites;
 return {poses,clips:Object.keys(m.clips).length,joints:Object.keys(m.joints).length,valid:validateVillagerMotion(m),independentParts:true};
})()`);
    for (const name of [
      "idle",
      "walk",
      "wave",
      "sword_ready",
      "jump_slash",
      "cheer",
      "shrug",
      "death",
    ]) {
      const png = await w.webContents.executeJavaScript(
        `window.villagerTest.render('${name}',${name === "jump_slash" ? 0.5 : name === "wave" || name === "cheer" || name === "shrug" ? 0.65 : 0.3});document.getElementById('views').toDataURL().split(',')[1]`,
      );
      fs.writeFileSync(
        path.join(out, name + ".png"),
        Buffer.from(png, "base64"),
      );
    }
    fs.writeFileSync(
      path.join(out, "cast.png"),
      Buffer.from(
        await w.webContents.executeJavaScript(
          "document.getElementById('cast').toDataURL().split(',')[1]",
        ),
        "base64",
      ),
    );
    const turnSheet=await w.webContents.executeJavaScript(`(async()=>{const {VILLAGERS}=await import('./src/villager-data.mjs'),{drawVillager}=await import('./src/villager-motion.mjs'),{directionVector}=await import('./src/player-motion.mjs');const can=document.createElement('canvas');can.width=1280;can.height=1400;const c=can.getContext('2d');c.fillStyle='#23383d';c.fillRect(0,0,1280,1400);for(const[row,v]of VILLAGERS.entries())for(let d=0;d<8;d++){const[faceX,faceY]=directionVector(d);c.save();c.translate(80+d*160,160+row*200);c.scale(3,3);drawVillager(c,{villagerId:v.id,faceX,faceY,animationAction:'idle',playerFrame:0},0);c.restore();c.fillStyle='#eddbbd';c.font='14px system-ui';c.textAlign='center';c.fillText(v.name+' · '+['S','SW','W','NW','N','NE','E','SE'][d],80+d*160,190+row*200);}return can.toDataURL().split(',')[1];})()`);
    fs.writeFileSync(path.join(out,'cast-directions.png'),Buffer.from(turnSheet,'base64'));
    await w.loadFile(path.join(appRoot, "index.html"), {
      query: { tools: "1" },
    });
    await w.webContents.executeJavaScript("window.wildboundBoot.ready");
    result.studio = await w.webContents.executeJavaScript(
      `(async()=>{[...document.querySelectorAll('button')].find(b=>b.textContent==='Rig studio').click();const picker=document.querySelector('.ps-subject');picker.value='villager';picker.dispatchEvent(new Event('change'));if(picker.value!=='villager'||!document.querySelector('.designer-dialog[open]'))throw Error('Missing villager Studio');const variant=document.querySelector('.ps-villager-variant');if(!variant||variant.options.length!==7)throw Error('Missing villager variant picker');variant.value='fern';variant.dispatchEvent(new Event('change'));if(variant.value!=='fern')throw Error('Villager variant selection failed');variant.value='april';variant.dispatchEvent(new Event('change'));return true;})()`,
    );
    result.game = await w.webContents.executeJavaScript(`(async()=>{
 await window.showcase('villager-camp');const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
 const {game:g,player:p,refresh}=window.villagerCamp,{openNpcDialogue,npcDialogueView}=await import('./src/npc-quests.mjs');
 if(g.villagers.length!==7)throw Error('Actual event did not spawn seven villagers');
 const campSpan=Math.max(...g.villagers.flatMap(a=>g.villagers.map(b=>Math.hypot(a.x-b.x,a.y-b.y))));if(campSpan>=170)throw Error('Camp spread too far: '+campSpan);
 for(const v of g.villagers){p.ui=null;Object.assign(p,{x:v.x,y:v.y+20});if(!openNpcDialogue(g,p))throw Error('Could not talk to '+v.name);refresh();const panel=document.querySelector('.npc-dialogue-session');if(!panel?.textContent.includes(v.name)||!panel.querySelector('.npc-dialogue-portrait'))throw Error('Actual dialogue/portrait missing '+v.name);if(panel.querySelectorAll('.npc-dialogue-choice').length!==3)throw Error('Dialogue choices too crowded for '+v.name);panel.querySelector('[data-index="0"]').click();refresh();if(!npcDialogueView(g,p).text.includes((await import('./src/villager-data.mjs')).villagerById(v.villagerId).story))throw Error('Story button failed '+v.name);}
 if(!p.aprilFriend?.active||g.villageFollowers.length!==1)throw Error('Actual dialogue recruitment failed');
 window.villagerCamp.refresh();return {event:true,compactCamp:true,threeChoices:true,sevenStories:true,mouseDialogue:true,portraits:true,recruited:true};
})()`);
    fs.writeFileSync(
      path.join(out, "conversation.png"),
      (await w.webContents.capturePage()).toPNG(),
    );
    result.lifecycle = await w.webContents.executeJavaScript(
      `(async()=>{const {game:g,player:p,refresh}=window.villagerCamp,a=g.villageFollowers[0];p.ui=null;delete a.animationAction;const before={x:a.x,y:a.y};Object.assign(p,{x:a.x+180,y:a.y+20});for(let i=0;i<30;i++)g.update(.02,{});if(Math.hypot(a.x-before.x,a.y-before.y)<5||!(a.step>0))throw Error('Actual Game animated follow failed');const {companionVisualActor}=await import('./src/companion-locomotion.mjs'),{villagerMotion}=await import('./src/villager-motion.mjs');if(!(companionVisualActor(a,villagerMotion).playerFrame>0))throw Error('April walk frame did not advance');Object.assign(p,{x:a.x+20,y:a.y});const foe={id:g.nextId++,kind:'skeleton',x:a.x+48,y:a.y,hp:50,maxHp:50,faction:'enemy'};g.enemies.push(foe);g.projectileBlocked=()=>false;g.update(.02,{});if(!(foe.hp<50)||a.animationAction!=='jump_slash')throw Error('April did not animate and hit hostile');const {saveSession,restoreSession}=await import('./src/session.mjs');const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));if(!restored.players[0].aprilFriend.active||restored.villageFollowers.length!==1)throw Error('Actual recruitment save failed');restored.completeVictory();if(restored.villagers.length||restored.villageFollowers.length||restored.players[0].aprilFriend.active)throw Error('Finished Wildbound retained villager camp');p.hp=0;g.update(.02,{});if(g.villageFollowers.length||p.aprilFriend.active)throw Error('Actual death dismissal failed');refresh();return {gameFollow:true,walkFrames:true,combat:true,saveRestore:true,finishedGameCleanup:true,ownerDeath:true};})()`,
    );
    if (errors.length) throw Error(errors.join("\n"));
    result.errors = errors;
    fs.writeFileSync(
      path.join(out, "qa.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result));
    app.exit(0);
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
