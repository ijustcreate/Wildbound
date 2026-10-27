const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output/controlled-anaconda');fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1200,height:850,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});try{
await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
const report=await w.webContents.executeJavaScript(`(async()=>{
 const raf=requestAnimationFrame;window.requestAnimationFrame=()=>0;await new Promise(raf);
 const [{Game},{Assets},{Renderer},{initializeAnaconda,anacondaBody},{befriendCreature},{cycleFollowerControl},{drawAnaconda,drawAnacondaSegment}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/anaconda-body.mjs'),import('./src/friendly-creatures.mjs'),import('./src/follower-control.mjs'),import('./src/anaconda-art.mjs')]);
 const assets=new Assets();await assets.load();const g=new Game(()=>.5),p=g.addPlayer('keyboard','Snake QA');g.start();g.openingBoard=false;g.house=null;g.scenery=[];g.enemies=[];g.terrain.fill('grass');g.weather=null;g.sky.elapsed=100;g.spriteLibrary=assets.library;
 const e={id:901,kind:'anaconda',x:900,y:1100,faceX:1,faceY:0,hp:380,maxHp:380,speed:70,damage:26,cooldown:0,state:'idle',flash:0};g.enemies=[e];initializeAnaconda(e,g);befriendCreature(e,p.id);cycleFollowerControl(g,p);
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=750;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#35513a';c.fillRect(0,0,1200,750);c.font='17px sans-serif';c.fillStyle='#eedab0';c.fillText('Current controlled anaconda: head and body follow the same world path',20,28);
 let maxHeadError=0;const states=[];
 for(let view=0;view<4;view++){
  const [x,y]=[[1,0],[0,-1],[-1,0],[0,1]][view];for(let n=0;n<70;n++){g.update(.02,{keyboard:{x,y}});const head=anacondaBody(e).segments[0];maxHeadError=Math.max(maxHeadError,Math.hypot(head.x-p.x,head.y-p.y));}
  const body=anacondaBody(e),bounds=body.bounds,scale=Math.min(1.35,530/(bounds.right-bounds.left+40),290/(bounds.bottom-bounds.top+40));c.save();c.translate(20+(view%2)*600+(540-(bounds.right-bounds.left)*scale)/2,70+Math.floor(view/2)*340+(290-(bounds.bottom-bounds.top)*scale)/2);c.scale(scale,scale);c.translate(-bounds.left,-bounds.top);drawAnaconda(c,e,g.time);c.strokeStyle='#8be4c7';c.lineWidth=1;c.strokeRect(p.x-18,p.y-18,36,36);c.restore();states.push({x:p.x,y:p.y,head:{...body.segments[0]},trail:body.trail.length});
 }
 if(maxHeadError>1e-6)throw Error('Detached body '+maxHeadError);if(anacondaBody(e).distance<200)throw Error('Control did not actually move the snake');
 const headCanvas=document.createElement('canvas');headCanvas.width=headCanvas.height=120;const hc=headCanvas.getContext('2d'),north={...e,x:60,y:60,faceX:0,faceY:-1,anacondaBody:undefined};initializeAnaconda(north);drawAnacondaSegment(hc,north,0);const pixels=hc.getImageData(0,0,120,120).data;let minX=120,maxX=0,minY=120,maxY=0;for(let y=0;y<120;y++)for(let x=0;x<120;x++)if(pixels[(y*120+x)*4+3]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}if(maxY-minY<=maxX-minX)throw Error('North head incorrectly draws diagonally');
 const view=document.createElement('canvas');view.style.cssText='width:1100px;height:800px';document.body.append(view);const r=new Renderer(view,assets);r.camera={x:e.x-90,y:e.y,zoom:1};r.draw(g,0);
 return {maxHeadError,states,images:{'turns':canvas.toDataURL(),'world':view.toDataURL()}};
})()`);
for(const [name,data]of Object.entries(report.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete report.images;if(errors.length)throw Error(errors.join('\n'));report.rendererErrors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
