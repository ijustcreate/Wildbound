const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'swimming-')));app.commandLine.appendSwitch('use-angle','swiftshader');app.commandLine.appendSwitch('enable-unsafe-swiftshader');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false});await win.loadFile(path.join(root,'index.html'));
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {drawPlayer,defaultPlayerMotion}=await import('./src/player-motion.mjs');const {drawSwimmer,drawBreath}=await import('./src/swim-render.mjs');const {drawWaterSurface,waterShaderStatus}=await import('./src/water-surface.mjs');const {drawParticleEffect}=await import('./src/particles.mjs');
 const cv=document.createElement('canvas');cv.width=1000;cv.height=600;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#172c31';c.fillRect(0,0,1000,600);
 const labels=['Surface stroke · reach','Surface stroke · sweep','Dive · shallow','Dive · deep','Entry splash','Breath running low'];
 for(let i=0;i<6;i++){c.save();c.translate((i%3)*330+15,Math.floor(i/3)*295+10);c.scale(3,3);drawWaterSurface(c,{time:2},0,0,100,78);
 const a={x:50,y:48,hp:100,maxHp:100,faceX:0,faceY:1,swimming:true,moving:true,equipment:{},diveDepth:i===2?.35:i===3?1:i===5?.8:0,breath:3,breathVisible:i===5?1:0};
 const draw=actor=>{c.save();c.translate(actor.x,actor.y);c.scale(43/48,43/48);drawPlayer(c,actor,i===1?.25:0,defaultPlayerMotion());c.restore();};
 drawSwimmer(c,a,2,draw);drawBreath(c,a);if(i===4)drawParticleEffect(c,'splash',50,48,.2,2);if(i===2||i===3||i===5)drawParticleEffect(c,'bubbles',50,48,.3,2);if(i<2)drawParticleEffect(c,'swim-wake',50,52,.2,2);c.restore();
 c.fillStyle='#e1f1f1';c.font='16px sans-serif';c.fillText(labels[i],(i%3)*330+20,Math.floor(i/3)*295+268);}
 const {Game}=await import('./src/core.mjs');const {Renderer}=await import('./src/render.mjs');const {Assets}=await import('./src/assets.mjs');
 const assets=new Assets();await assets.load();const game=new Game();game.environment='house';game.addPlayer('keyboard');game.start();game.openingBoard=false;game.enemies=[];game.scenery=[];game.house={...game.house,walls:[],doors:[],furniture:[],pools:[{x:300,y:300,w:300,h:300}]};
 Object.assign(game.players[0],{x:450,y:450});const live=document.createElement('canvas');live.style.width='800px';live.style.height='600px';document.body.append(live);const renderer=new Renderer(live,assets);
 for(let i=0;i<180;i++){game.update(1/60,{keyboard:{attack:i<120,x:i<60?.5:0}});renderer.draw(game,1/60);}
 if(!game.players[0].swimming)throw Error('Live player not swimming');live.remove();
 return {status:waterShaderStatus(),png:cv.toDataURL('image/png').split(',')[1]};})()`);
 fs.writeFileSync(path.join(out,'swimming-preview.png'),Buffer.from(result.png,'base64'));if(result.status!=='webgl')throw Error('Shader failed: '+result.status);console.log('WebGL shader compiled; swim, dive, bubbles, splash and breath rendered.');app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
