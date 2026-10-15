const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','board-ui-'+Date.now());
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:842,height:738,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');await new Promise(r=>setTimeout(r,600));
  await win.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {drawBoard}=await import('./src/board.mjs'),{drawDie}=await import('./src/render.mjs');
   window.boardQA={drawBoard,drawDie};const panel=document.querySelector('#board-panel');document.body.append(panel);panel.classList.remove('hidden');
  })()`);
  const views=[];
  for(const [width,height,sequence,long]of [[842,738,true,false],[1280,720,true,false],[640,480,true,true],[400,700,true,true],[842,738,false,false]]){
   win.setContentSize(width,height);await new Promise(r=>setTimeout(r,100));
   views.push(await win.webContents.executeJavaScript(`(()=>{
    const p=document.querySelector('#board-panel');p.classList.toggle('board-sequence',${sequence});document.body.dataset.boardSize='compact';
    document.querySelector('#turn-label').textContent=${long}?"Alexandria of the Whispering Wood's turn":"Juniper's turn";
    document.querySelector('#turn-caption').textContent=${long}?'FINISHER: HOLD INTERACT AT TABLE TO CALL WILDBOUND':'THE DICE HAVE SPOKEN';
    document.querySelector('#board-caption').textContent=${long}?'The wolves are gathering — Keep the pack from surrounding you. Stay together and protect your companions.':'Moving space 34 · 5 rolled';
    const cv=document.querySelector('#board-closeup'),r=cv.getBoundingClientRect();cv.width=Math.round(r.width*2);cv.height=Math.round(cv.width*380/560);
    const c=cv.getContext('2d');c.setTransform(cv.width/560,0,0,cv.height/380,0,0);c.imageSmoothingEnabled=false;c.translate(280,185);c.scale(1.9,1.9);
    boardQA.drawBoard(c,{environment:'beach',players:[{id:1,boardProgress:34,color:'#92e8cc'}]},3,{closeup:true,drawDie:boardQA.drawDie});
    const bounds=p.getBoundingClientRect(),header=p.querySelector('.board-status').getBoundingClientRect(),caption=p.querySelector('#board-caption').getBoundingClientRect();
    const assert=(v,m)=>{if(!v)throw Error(m);};
    assert(bounds.left>=0&&bounds.top>=0&&bounds.right<=innerWidth+1&&bounds.bottom<=innerHeight+1,'Panel outside viewport');assert(p.scrollWidth<=p.clientWidth+1&&p.scrollHeight<=p.clientHeight+1,'Panel overflow');
    assert(caption.bottom<=bounds.bottom&&header.bottom<=r.top+1,'Status overlaps board');assert(Math.abs(r.width/r.height-560/380)<.01,'Board distorted');
    assert(${sequence}?getComputedStyle(document.querySelector('#close-board')).display==='none':getComputedStyle(document.querySelector('#close-board')).display!=='none','Close visibility');
    return {width:innerWidth,height:innerHeight,sequence:${sequence},long:${long},panel:bounds.toJSON(),headerHeight:header.height,padding:getComputedStyle(p).padding};
   })()`));
   win.setContentSize(width+4,height+4);await new Promise(r=>setTimeout(r,120));win.setContentSize(width,height);await new Promise(r=>setTimeout(r,150));
   fs.writeFileSync(path.join(out,`board-${width}-${sequence}.png`),(await win.webContents.capturePage()).toPNG());
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({packaged:base!==root,views,errors},null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({out,views,errors}));app.exit(0);
 }catch(e){console.error(e.stack,errors);app.exit(1);}
});
