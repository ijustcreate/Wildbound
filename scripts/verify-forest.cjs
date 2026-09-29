const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'forest-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false});await win.loadFile(path.join(root,'index.html'));
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {drawForestTree,drawForestGround,drawFallingLeaves,drawBush,forestSettings}=await import('./src/forest.mjs');const {Designer}=await import('./src/designer.mjs');const {Assets}=await import('./src/assets.mjs');const {Game,EVENTS}=await import('./src/core.mjs');const {ITEMS}=await import('./src/items.mjs');const {Renderer}=await import('./src/render.mjs');
 const assets=new Assets();await assets.load();const ui=new Designer(assets,EVENTS,ITEMS,()=>{});ui.tab='Forest';ui.render();ui.open();if(ui.dialog.querySelectorAll('select').length!==4)throw Error('Missing forest controls');ui.dialog.close();
 const cv=document.createElement('canvas');cv.width=1200;cv.height=860;const c=cv.getContext('2d');c.fillStyle='#344c40';c.fillRect(0,0,1200,860);c.imageSmoothingEnabled=false;
 for(let row=0;row<3;row++)for(let i=0;i<9;i++){const type=['oak','birch','pine'][Math.floor(i/3)],season=['summer','autumn','winter'][row];const p={kind:'tree',treeType:type,season,x:65+i*132,y:150+row*235,size:135};const g={time:1,scenery:[p],terrain:[],players:[]};drawForestGround(c,g);drawForestTree(c,p,1,g);if(i%3===0){c.fillStyle='#eee';c.font='15px sans-serif';c.fillText(type+' · '+season,p.x-35,p.y+70);}}
 for(let i=0;i<5;i++)drawBush(c,{x:140+i*75,y:780,size:50,rustle:i%2},1);
 const game=new Game();game.environment='forest';game.addPlayer('keyboard');game.start();game.openingBoard=false;game.enemies=[];const live=document.createElement('canvas');live.style.width='1100px';live.style.height='700px';document.body.append(live);const renderer=new Renderer(live,assets);for(let i=0;i<8;i++){game.update(1/60,{});renderer.draw(game,1/60);}live.remove();
 return {png:cv.toDataURL('image/png').split(',')[1],trees:game.scenery.filter(p=>p.kind==='tree').length,bushes:game.scenery.filter(p=>p.kind==='bush').length};})()`);
 fs.writeFileSync(path.join(out,'forest-variants.png'),Buffer.from(result.png,'base64'));console.log(JSON.stringify({trees:result.trees,bushes:result.bushes,ui:true,render:true}));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
