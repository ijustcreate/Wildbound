const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version,out=path.join(root,'test-output/combat-runtime');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1280,height:960,webPreferences:{offscreen:true,backgroundThrottling:false}});
  try{
    const packaged=process.argv.includes('--packaged'),base=packaged?path.join(root,'dist',version,'Wildbound-win32-x64/resources/app.asar'):root;
    await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const {Game}=await import('./src/core.mjs'),{drawPlayer,playerMotion,playerAction,directionVector}=await import('./src/player-motion.mjs');
      if(playerMotion.combatRevision!==4)throw Error('Packaged authored combat rig was not loaded');
      const game=new Game(()=>.42);game.phase='play';game.openingBoard=false;game.house=null;game.scenery=[];game.enemies=[];game.terrain.fill('grass');
      const hero=game.addPlayer('keyboard','Combat review');hero.x=300;hero.y=300;
      const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=960;const c=canvas.getContext('2d');
      c.fillStyle='#182b2a';c.fillRect(0,0,1280,960);
      const equipment=[{}, {hand1:'iron_sword',hand2:'moon_shield'}, {hand1:'ritual_dagger'}, {hand1:'iron_sword',hand2:'moon_blade'}, {hand1:'krampus_whip'}, {hand1:'moon_bow'}];
      const actions=[];
      for(let row=0;row<equipment.length;row++){
        Object.assign(hero,{equipment:equipment[row],attack:0,attackClip:null,comboId:null,hit:0,charge:0});
        game.attack(hero,0);actions.push(playerAction(hero));
        for(let d=0;d<8;d++){
          const [faceX,faceY]=directionVector(d),actor={...hero,faceX,faceY,attack:hero.attackDuration*.57};
          c.save();c.translate(80+d*160,145+row*158);c.scale(3,3);drawPlayer(c,actor,game.time,playerMotion);c.restore();
        }
      }
      return {revision:playerMotion.combatRevision,actions,data:canvas.toDataURL()};
    })()`);
    assert.equal(result.revision,4);assert.deepEqual(result.actions,['punch_left','swipe_one','swipe_one','swipe_one','swipe_one','ranged']);
    fs.writeFileSync(path.join(out,(packaged?'packaged':'source')+'.png'),Buffer.from(result.data.split(',')[1],'base64'));
    console.log(JSON.stringify({version,packaged,revision:result.revision,actions:result.actions,rendered:48}));app.exit(0);
  }catch(e){console.error(e);app.exit(1);}
});
