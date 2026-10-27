const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','shadow-fauna-review');
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
app.whenReady().then(async()=>{
 fs.mkdirSync(out,{recursive:true});const w=new BrowserWindow({show:false,width:1240,height:620,webPreferences:{offscreen:true,backgroundThrottling:false}});w.webContents.setAudioMuted(true);
 try{
  await w.loadFile(path.join(root,'index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {drawWildFauna}=await import('./src/wild-fauna-art.mjs');
   const {drawMonarchFairyDragon}=await import('./src/monarch-fairy-dragon.mjs');
   const c=document.createElement('canvas');c.width=1240;c.height=620;document.body.innerHTML='';document.body.style.cssText='margin:0;background:#24212d;color:#f3e7cb;font:14px system-ui';document.body.append(c);
   const x=c.getContext('2d'),views=[[0,0],[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7]],cols=views.length,cell=155;
   x.fillStyle='#24212d';x.fillRect(0,0,c.width,c.height);
   const rowNames=['Forest stag · source anatomy','Veil stag · shadow realm','Monarch fairy dragon · idle','Monarch fairy dragon · flutter'];
   for(let row=0;row<4;row++){
    const top=row*151;x.fillStyle='#d8c8b2';x.font='bold 14px system-ui';x.fillText(rowNames[row],14,top+19);
    for(const [col,d] of views){const left=col*cell;
     x.fillStyle='#322e3d';x.fillRect(left+4,top+28,cell-8,116);
     x.fillStyle='#928593';x.font='11px system-ui';x.fillText(['Front','Front diag','Profile','Rear diag','Back','Rear diag','Profile','Front diag'][d],left+8,top+43);
     x.fillStyle='#12151c';x.beginPath();x.ellipse(left+78,top+118,27,5,0,0,Math.PI*2);x.fill();
     const actor={id:'review:'+row,kind:row===0?'stag':'shadow_stag',x:left+78,y:top+116,faceX:Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),moving:row===0||row===1,step:.7,state:'graze'};
     if(row<2)drawWildFauna(x,actor,row?0.8:1.1,48);
     else drawMonarchFairyDragon(x,{...actor,kind:'monarch_fairy_dragon',phase:0,state:row===3?'flee':'idle'},row===2?.18:1.4,42);
    }
   }
   return {width:c.width,height:c.height,canvas:c.toDataURL('image/png')};
  })()`);
  const png=Buffer.from(result.canvas.split(',')[1],'base64');fs.writeFileSync(path.join(out,'shadow-fauna-eight-views.png'),png);console.log(JSON.stringify({preview:path.join(out,'shadow-fauna-eight-views.png'),dimensions:[result.width,result.height]}));
 }catch(e){console.error(e.stack);app.exit(1);return;}finally{w.destroy();}
 app.exit(0);
}).catch(e=>{console.error(e.stack);app.exit(1);});
