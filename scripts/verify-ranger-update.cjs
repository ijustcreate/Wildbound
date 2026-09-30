const {app,BrowserWindow}=require('electron');const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
app.setPath('userData',path.join(out,'ranger-review-profile'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const win=new BrowserWindow({show:false,width:1200,height:800});try{
 const base=process.argv.includes('--packaged')?path.join(root,'dist',require('../package.json').version,'Wildbound-win32-x64/resources/app.asar'):root;
 await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
 await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let tries=0;const check=()=>{if(window.wildboundBoot.error)return reject(Error(window.wildboundBoot.error));if(document.querySelector('#loading.done'))return resolve();if(++tries>100)return reject(Error('Startup did not finish'));setTimeout(check,100);};check();})`);
 const result=await win.webContents.executeJavaScript(`(async()=>{
 const {drawHunterPet}=await import('./src/hunter-pet-render.mjs'),{restoreHunterPet}=await import('./src/hunter-pets.mjs'),{drawForestTree}=await import('./src/forest.mjs'),{drawItem}=await import('./src/item-art.mjs'),{drawSupplyChest}=await import('./src/supply-chests.mjs'),{petCard}=await import('./src/hunter-pet-ui.mjs'),{Game}=await import('./src/core.mjs');
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;canvas.style='position:fixed;inset:0;z-index:99999;width:1200px;height:800px';document.body.append(canvas);const c=canvas.getContext('2d');c.fillStyle='#23352f';c.fillRect(0,0,1200,800);c.font='20px sans-serif';c.fillStyle='#fff0ce';c.fillText('Ranger companions · sitting / hanging',30,32);
 const owner={color:'#65dec0'},kinds=['lion','wolf','panther','tiger','bat'];
 for(let i=0;i<kinds.length;i++){const pet=restoreHunterPet({kind:kinds[i],name:kinds[i],collar:'#f1b3bc'});Object.assign(pet,{x:120+i*225,y:180,faceX:.3,faceY:1,animationAction:i===4?'hang':'sit'});drawHunterPet(c,pet,owner,.5,100);}
 c.fillStyle='#fff0ce';c.fillText('Snow-covered branch tiers',30,260);
 for(let i=0;i<3;i++)drawForestTree(c,{kind:'tree',treeType:'pine',season:'winter',leafHabit:'evergreen',x:120+i*200,y:475,size:135,seed:i},0,{environment:'ice',generatedEnvironment:'ice'});
 c.fillStyle='#fff0ce';c.fillText('New level pendants / Ranger gear',650,300);
 const ids=['fern_pendant','sunstone_pendant','snowflake_pendant','hearth_pendant','jade_pendant','ranger_hood','ranger_jacket','ranger_bracers','ranger_trailboots','ranger_quiver'];for(let i=0;i<ids.length;i++)drawItem(c,ids[i],690+i%5*95,350+Math.floor(i/5)*90,64);
 c.fillStyle='#fff0ce';c.fillText('Supply chests',650,515);drawSupplyChest(c,{players:[]},{x:735,y:590,color:'#b5e5ef'});drawSupplyChest(c,{players:[]},{x:850,y:590,color:'#b5e5ef',opened:true});
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');p.hunterPet=restoreHunterPet({kind:'bat',name:'Fig'});const card=petCard(g,p);card.style='position:fixed;left:650px;top:640px;width:460px;z-index:100000';document.body.append(card);card.querySelector('button').click();if(!document.querySelector('.pet-care-dialog'))throw Error('Pet care did not open');document.querySelector('.pet-care-dialog').close();
 return {pets:5,pendants:5,rangerPieces:5,png:canvas.toDataURL()};
 })()`);
 await new Promise(r=>setTimeout(r,1200));
 fs.writeFileSync(path.join(out,'ranger-review.png'),Buffer.from(result.png.split(',')[1],'base64'));delete result.png;console.log(JSON.stringify(result));app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
