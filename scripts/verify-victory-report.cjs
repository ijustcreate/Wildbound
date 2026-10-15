const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','victory-report-'+Date.now());
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1028,height:612,webPreferences:{backgroundThrottling:false}}),errors=[];win.webContents.setAudioMuted(true);
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await win.loadFile(path.join(base,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  await new Promise(r=>setTimeout(r,600));
  await win.webContents.executeJavaScript(`(async()=>{
   const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);
   const {renderVictoryReport}=await import('./src/victory-ui.mjs');
   window.victoryQA={renderVictoryReport,assert:(v,m)=>{if(!v)throw Error(m);}};
  })()`);
  const views=[];
  for(const [width,height,count]of [[1028,612,1],[1280,720,6],[640,480,6],[400,700,6]]){
   win.setContentSize(width,height);await new Promise(r=>setTimeout(r,100));
   const result=await win.webContents.executeJavaScript(`(()=>{
    const {renderVictoryReport,assert}=victoryQA,d=document.querySelector('#victory-results');
    if(d.open)d.close();const players=Array.from({length:${count}},(_,i)=>({name:i===0?'Juniper':i===5?'Alexandria of the Whispering Wood':'Explorer '+(i+1),lootRecovered:i?0:163,damageTaken:444+i*10000,rescues:i,objectives:4}));
    const g={players,debrief:players,cleared:17,round:9};const before=JSON.stringify(g);renderVictoryReport(d,g);assert(JSON.stringify(g)===before,'Report mutated game');d.showModal();document.querySelector('#victory-continue').focus({preventScroll:true});
    const r=d.getBoundingClientRect(),footer=d.querySelector('.victory-footer').getBoundingClientRect(),body=d.querySelector('.victory-content'),button=d.querySelector('#victory-continue').getBoundingClientRect();
    assert(r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,'Dialog outside window');assert(d.scrollWidth<=d.clientWidth+1&&body.scrollWidth<=body.clientWidth+1,'Horizontal overflow');
    assert(footer.bottom<=r.bottom&&button.bottom<=r.bottom&&button.top>=footer.top,'Continue clipped');
    assert(d.querySelectorAll('tbody tr').length===${count},'Wrong party rows');assert(d.querySelector('thead').textContent.includes('Damage taken'),'Ambiguous damage label');
    const luminance=rgb=>{const c=rgb.match(/[0-9.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
    const contrast=(fg,bg)=>{const a=luminance(fg),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
    const checks=[['.victory-stat span','#f0e4c6'],['tbody th','#fff8e8'],['tbody td','#fff8e8'],['thead th','#344d3a'],['#victory-return-hint','#e0cfa5'],['#victory-continue','#31583e']];
    const contrasts=checks.map(([selector,hex])=>{const color='rgb('+hex.slice(1).match(/../g).map(v=>parseInt(v,16)).join(',')+')',ratio=contrast(getComputedStyle(d.querySelector(selector)).color,color);assert(ratio>=4.5,'Low contrast: '+selector+' '+ratio);return {selector,ratio};});
    if(body.scrollHeight>body.clientHeight){d.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));assert(body.scrollTop>0,'Keyboard scroll failed');d.querySelector('tbody tr:last-child').scrollIntoView({block:'end'});assert(body.scrollTop>0,'Final explorer unreachable');body.scrollTop=0;}
    d.querySelector('tbody').click();assert(d.open,'Reading report dismissed it');
    return {width:innerWidth,height:innerHeight,count:${count},contrasts,scrollable:body.scrollHeight>body.clientHeight};
   })()`);views.push(result);
   win.setContentSize(width+4,height+4);await new Promise(r=>setTimeout(r,120));win.setContentSize(width,height);await new Promise(r=>setTimeout(r,150));
   const rect=await win.webContents.executeJavaScript('(()=>{const r=document.querySelector("#victory-results").getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)};})()');fs.writeFileSync(path.join(out,`victory-${width}-${count}.png`),(await win.webContents.capturePage(rect)).toPNG());
   await win.webContents.executeJavaScript(`(()=>{document.querySelector('#victory-continue').click();victoryQA.assert(!document.querySelector('#victory-results').open,'Continue failed');})()`);
  }
  await win.webContents.executeJavaScript(`(()=>{const d=document.querySelector('#victory-results');d.showModal();d.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));victoryQA.assert(!d.open,'Enter failed');})()`);
  win.setContentSize(760,600);await new Promise(r=>setTimeout(r,100));
  const replay=await win.webContents.executeJavaScript(`(()=>{const d=document.querySelector('#next-game-dialog');d.showModal();const b=d.querySelector('#next-game-yes'),s=getComputedStyle(b),range=document.createRange();range.selectNodeContents(b);const text=range.getBoundingClientRect(),r=b.getBoundingClientRect();victoryQA.assert(s.textAlign==='center'&&Math.abs(text.x+text.width/2-r.x-r.width/2)<2,'Play again is not centered');return {textAlign:s.textAlign,offset:Math.abs(text.x+text.width/2-r.x-r.width/2)};})()`);
  fs.writeFileSync(path.join(out,'replay.png'),(await win.webContents.capturePage()).toPNG());
  const report={packaged:base!==root,views,replay,errors};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({out,...report}));app.exit(0);
 }catch(e){console.error(e.stack,errors);app.exit(1);}
});
