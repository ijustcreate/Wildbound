const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output','house-builder-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:940,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await w.webContents.executeJavaScript(`(async()=>{
  [...document.querySelectorAll('button')].find(b=>b.textContent==='Rig studio').click();
  [...document.querySelectorAll('dialog[open] nav button')].find(b=>b.textContent==='House Builder').click();
  if(!document.querySelector('.house-builder canvas'))throw Error('Builder tab absent');
  const {HouseBuilder}=await import('./src/house-builder.mjs'),{houseLibrary}=await import('./src/house-design.mjs'),{Game}=await import('./src/core.mjs');
  const root=document.querySelector('.house-builder'),builder=new HouseBuilder();builder.mount(root);builder.tool='furniture';builder.furniture.value='bench';builder.place({x:1184,y:1280},{x:1264,y:1312});
  builder.name.value='QA courtyard';[...root.querySelectorAll('button')].find(b=>b.textContent==='Save as new').click();
  if(houseLibrary().designs.length<2)throw Error('Version not saved');const g=new Game();g.environment='house';g.addPlayer('keyboard');g.start();if(g.house.name!=='QA courtyard'||!g.house.furniture.some(f=>f.x===1184&&f.kind==='bench'))throw Error('Saved version not used');
  return 'Builder tab, placement, version persistence and new expedition verified';
 })()`);console.log(result);
 fs.writeFileSync(path.join(root,'test-output','house-builder.png'),(await w.webContents.capturePage()).toPNG());
 w.setSize(1000,700);await new Promise(r=>setTimeout(r,200));if(!await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('dialog[open]');return d.scrollWidth<=d.clientWidth+1;})()`))throw Error('Builder overflow');
 console.log('Builder fits 1000 x 700');app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
