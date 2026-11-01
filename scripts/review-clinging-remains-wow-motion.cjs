const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/art/reviews/2026-10-28-clinging-remains-eight-facing-before-after.png');
fs.mkdirSync(path.dirname(output), { recursive: true });
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, width: 1024, height: 900, webPreferences: { offscreen: true, backgroundThrottling: false } });
  window.webContents.setAudioMuted(true);
  try {
    await window.loadFile(path.join(root, 'index.html'));
    const image = await window.webContents.executeJavaScript(`(async()=>{
      const {defaultEldritchRig,renderEldritchPreview}=await import('./src/creature-packs/eldritch.mjs');
      const {poseAt}=await import('./src/player-motion.mjs');
      const rig=defaultEldritchRig('evil_hand'),canvas=document.createElement('canvas');
      const cellW=124,cellH=170,columns=8,top=48;canvas.width=cellW*columns;canvas.height=top+cellH*4;
      const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#112b25';c.fillRect(0,0,canvas.width,canvas.height);
      c.fillStyle='#ead9ae';c.font='bold 19px Georgia';c.fillText('CLINGING REMAINS · EIGHT FACINGS · BEFORE / AFTER',12,27);
      const dirs=['S','SW','W','NW','N','NE','E','SE'];
      const labels=['BEFORE · native crawl','AFTER · Wowhead Walk / crawl','BEFORE · native grab (static hand)','AFTER · Wowhead AttackUnarmed'];
      for(let d=0;d<columns;d++){c.fillStyle='#a9c7ae';c.font='12px sans-serif';c.fillText(dirs[d],d*cellW+54,top-10);}
      const nativeKeys=(action)=>Array.from({length:8},(_,frame)=>{
        const t=frame/7,phase=frame*Math.PI/4,wave=Math.sin(phase),joints=Object.fromEntries(Object.keys(rig.joints).map(name=>[name,[0,0,0]]));
        const set=(name,x,y,z)=>{if(joints[name])joints[name]=[x,y,z]};
        for(const name of ['body','chest','core','head','eye','cap','pelvis'])set(name,0,0,Math.sin(phase*2)*(action==='idle'?.45:.9));
        if(action==='crawl')for(let i=0;i<4;i++){const side=i%2?-1:1,lift=Math.max(0,wave*side),reach=wave*side;set('finger'+i,side*wave*.45,-reach*1.7,lift*3.4);set('finger'+i+'Mid',side*wave*.7,-reach*2.5,lift*2.5);set('finger'+i+'Tip',side*wave,-reach*3.1,lift*1.8);} 
        if(action==='crawl'){set('thumbBase',wave*.8,-wave,Math.max(0,wave)*.9);set('thumbTip',wave*1.2,-wave*1.5,Math.max(0,wave)*1.5);set('wrist',0,wave*1.5,1+Math.abs(wave)*4.2);set('palm',0,wave*2,Math.abs(wave)*4.6);}
        const hit=Math.sin(t*Math.PI);if(action==='grab')for(const name of ['head','eye','tip','beak','jaw','handR','branchTipL','branchTipR'])set(name,0,hit*5,hit*2);
        return{frame,joints};
      });
      const native={...rig,clips:{...rig.clips,crawl:{fps:10,length:8,loop:true,keys:nativeKeys('crawl')},grab:{fps:10,length:8,loop:false,keys:nativeKeys('grab')}}};
      for(let row=0;row<4;row++){
        const y=top+row*cellH;c.fillStyle=row%2?'#19382f':'#16342c';c.fillRect(0,y,canvas.width,cellH);
        c.fillStyle='#f0dfbb';c.font='13px sans-serif';c.fillText(labels[row],10,y+17);
        for(let d=0;d<8;d++){
          const x=d*cellW;c.save();c.translate(x+cellW/2,y+121);c.scale(2.1,2.1);
          const angle=d*Math.PI/4,action=row<2?'crawl':'grab',frame=row===0?2:row===1?Math.floor(rig.clips.crawl.length*.25):row===2?2:Math.floor(rig.clips.grab.length*.32),model=row%2===0?native:rig;
          const actor={kind:'evil_hand',faceX:Math.sin(angle),faceY:Math.cos(angle),moving:action==='crawl',animationAction:action,playerFrame:frame};
          renderEldritchPreview(c,'evil_hand',actor,0,model);
          c.restore();
        }
      }
      return canvas.toDataURL('image/png');
    })()`);
    fs.writeFileSync(output, Buffer.from(image.split(',')[1], 'base64'));
    console.log(JSON.stringify({ output }));
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { window.destroy(); app.exit(process.exitCode || 0); }
});
