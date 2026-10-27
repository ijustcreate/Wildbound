const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','polish-1.2.68');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true,backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame;requestAnimationFrame=()=>0;await new Promise(raf);
   const [{drawAlan,alanMotion},{drawPlayer,playerMotion},{Animator},{Assets},{drawPortal},{portalShaderStatus},{drawHouseCar,drawVehicleWheels},{ALAN_EQUIPMENT},{drawForestTree},{setTreeFallDirection},{drawHouseDoor},{drawBreakable},particles]=await Promise.all([
    import('./src/alan-motion.mjs'),import('./src/player-motion.mjs'),import('./src/animation.mjs'),import('./src/assets.mjs'),import('./src/portal-art.mjs'),import('./src/portal-shader.mjs'),import('./src/house-render.mjs'),import('./src/items.mjs'),import('./src/forest.mjs'),import('./src/tree-fall.mjs'),import('./src/house-architecture-art.mjs'),import('./src/structure-destruction.mjs'),import('./src/particles.mjs')]);
   const assets=new Assets();await assets.load();const animator=new Animator(assets),pictures={},checks=[];
   const check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const make=(width,height,title)=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#30473d';c.fillRect(0,0,width,height);c.fillStyle='#eee2bd';c.font='18px Georgia';c.fillText(title,18,26);return{canvas,c};};
   const hero={id:1,hp:100,maxHp:100,faceX:0,faceY:1,equipment:{...ALAN_EQUIPMENT},appearance:{skin:'#c78956',shirt:'#b79357',pants:'#9c7140',shoes:'#493523',hair:'long',hairColor:'#49301e',face:'alan',build:'broad'}};
   {
    const {canvas,c}=make(1200,520,'Alan — live articulated rig, eight views · idle / walk / attack');
    for(let row=0;row<3;row++)for(let d=0;d<8;d++){
     c.save();c.translate(75+d*150,165+row*165);c.scale(3.5,3.5);
     drawAlan(c,{...hero,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction:['idle','walk','attack'][row],playerFrame:row?5:0},.5);c.restore();
    }
    pictures['alan-eight-views.png']=canvas.toDataURL();
   }
   {
    const {canvas,c}=make(1200,450,'Portal — restrained rim, deep center and inward energy · consecutive frames');
    for(let i=0;i<6;i++){c.save();c.translate(100+i*200,390);c.scale(4,4);particles.beginParticleFrame(c);drawPortal(c,{id:9,x:0,y:0,color:'#50cbb0'},i*.25,'');c.restore();}
    pictures['portal-motion.png']=canvas.toDataURL();check(portalShaderStatus().ready,'Portal shader compiles in Electron');
    const frames=[];for(let i=0;i<24;i++){const x=document.createElement('canvas');x.width=240;x.height=360;const p=x.getContext('2d');p.fillStyle='#30473d';p.fillRect(0,0,240,360);p.translate(120,302);p.scale(3.5,3.5);drawPortal(p,{id:9,x:0,y:0,color:'#50cbb0'},i/12,'');frames.push(x.toDataURL());}pictures['portal-frames']=frames;
   }
   {
    const {canvas,c}=make(1200,560,'Scythe — anticipation / cut / follow-through / recovery · native player rig');
    for(let row=0;row<2;row++)for(let i=0;i<6;i++){c.save();c.translate(100+i*200,260+row*250);c.scale(3.3,3.3);drawPlayer(c,{...hero,appearance:{...hero.appearance,face:'classic'},equipment:{hand1:'reaper_scythe'},animationAction:row?'scythe_reap':'scythe_sweep',playerFrame:i*(playerMotion.clips[row?'scythe_reap':'scythe_sweep']?.length-1||12)/5},0);c.restore();}
    pictures['scythe-motion.png']=canvas.toDataURL();
   }
   {
    const {canvas,c}=make(1000,450,'Vehicle — driver visible under glass, front wheel steering');
    const p={...hero,equipment:{},appearance:{...hero.appearance,hair:'crop',face:'classic'}};
    for(let i=0;i<3;i++){const v={x:170+i*330,y:250,w:144,h:216,heading:[0,.6,1.5][i],seats:{driver:1},wheelAngle:.3};drawHouseCar(c,v,{players:[p],time:0});drawVehicleWheels(c,v);}
    pictures['vehicle.png']=canvas.toDataURL();
   }
   {
    const {canvas,c}=make(1200,550,'Tree falls — fixed trunk pivot, away from eight impact directions');
    for(let i=0;i<8;i++){const tree={kind:'tree',treeType:'oak',seed:13,x:75+(i%4)*300,y:255+Math.floor(i/4)*265,size:100,falling:true,fallAngle:.8};setTreeFallDirection(tree,Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4));drawForestTree(c,tree,1,{generatedEnvironment:'forest'});}
    pictures['tree-falls.png']=canvas.toDataURL();
   }
   return {pictures,checks,shader:portalShaderStatus()};
  })()`);
  for(const[name,data]of Object.entries(result.pictures)){
   if(Array.isArray(data)){data.forEach((s,i)=>fs.writeFileSync(path.join(out,'portal-'+String(i).padStart(2,'0')+'.png'),Buffer.from(s.split(',')[1],'base64')));}
   else fs.writeFileSync(path.join(out,name),Buffer.from(data.split(',')[1],'base64'));
  }
  delete result.pictures;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...result,errors,base},null,2));console.log(JSON.stringify({...result,errors}));app.exit(errors.length?1:0);
 }catch(e){console.error(e);app.exit(1);}
});
