const fs=require('node:fs/promises'),path=require('node:path');
module.exports=async({window,testOutput,app})=>{
 const errors=[],checks=[];
 const js=code=>window.webContents.executeJavaScript(code,true);
 const check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
 window.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message);});
 try{
  await js('window.wildboundBoot.ready');
  await js('window.wildboundWorldsTest.openShadowEditor()');
  await js(`new Promise((resolve,reject)=>{const start=performance.now();const poll=()=>{if(document.querySelector('.world-editor'))resolve();else if(performance.now()-start>15000)reject(Error('World Editor did not open'));else setTimeout(poll,30);};poll();})`);
  const nav=await js(`Array.from(document.querySelectorAll('.world-editor>nav button')).some(b=>b.textContent.trim()==='Shadows');`);
  check('Worlds editor exposes a dedicated Shadows authoring tab',nav);
  const shadowToggle=await js(`(()=>{const input=document.querySelector('#dynamic-shadows-toggle');return {present:!!input,checked:!!input?.checked,help:document.querySelector('#dynamic-shadows-help')?.textContent||''};})()`);
  check('Display settings expose mutually exclusive dynamic-shadow and blob-shadow modes',shadowToggle.present&&shadowToggle.checked&&shadowToggle.help.includes('both styles are never drawn together'),shadowToggle);
  const modeRoundTrip=await js(`(()=>{const input=document.querySelector('#dynamic-shadows-toggle');input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));const simple=localStorage.getItem('wildbound-shadow-style');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));return {simple,dynamic:localStorage.getItem('wildbound-shadow-style'),checked:input.checked};})()`);
  check('shadow-style toggle persists a single selected mode and restores dynamic shadows',modeRoundTrip.simple==='simple'&&modeRoundTrip.dynamic==='dynamic'&&modeRoundTrip.checked,modeRoundTrip);
  await js(`Array.from(document.querySelectorAll('.world-editor>nav button')).find(b=>b.textContent.trim()==='Shadows').click()`);
  await js(`new Promise((resolve,reject)=>{const start=performance.now();const poll=()=>{if(document.querySelector('.shadow-map-painter')&&document.querySelector('.shadow-map-preview'))resolve();else if(performance.now()-start>15000)reject(Error('Shadow map painter did not render'));else setTimeout(poll,30);};poll();})`);
  const tools=await js(`(()=>({canvases:[...document.querySelectorAll('.shadow-map-painter,.shadow-map-preview')].map(c=>[c.width,c.height]),layers:[...document.querySelectorAll('.world-editor-panel select')].flatMap(s=>[...s.options].map(o=>o.textContent)),generate:[...document.querySelectorAll('.world-editor-panel button')].some(b=>b.textContent.includes('Regenerate from scene props'))}))()`);
  check('high-resolution height painter, live shadow preview, three map planes and prop generator are present',tools.canvases.length===2&&tools.canvases.every(d=>d[0]===512&&d[1]===512)&&tools.layers.some(x=>x.includes('Ground'))&&tools.layers.some(x=>x.includes('Detail'))&&tools.layers.some(x=>x.includes('Back'))&&tools.generate,tools);
  await js(`document.querySelector('.world-editor-panel button').click()`);
  await js(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
  const edited=await js(`(()=>{const c=document.querySelector('.shadow-map-painter');const r=c.getBoundingClientRect();c.setPointerCapture=()=>{};c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,buttons:1,clientX:r.left+r.width*.08,clientY:r.top+r.height*.08}));c.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1,buttons:0,clientX:r.left+r.width*.08,clientY:r.top+r.height*.08}));return import('./src/world-authoring.mjs').then(w=>{const s=w.readWorldDesign().levels.find(l=>l.id==='forest').scenes[0];return {valid:!!s.shadowMaps,planes:['ground','detail','back'].every(k=>typeof s.shadowMaps?.[k]==='string'),width:s.shadowMaps?.width};});})()`);
  check('generate and paint writes high-resolution scene shadow maps to isolated desktop storage',edited.valid&&edited.planes&&edited.width===512,edited);
  await new Promise(resolve=>setTimeout(resolve,180));
  await fs.mkdir(testOutput,{recursive:true});await fs.writeFile(path.join(testOutput,'shadow-pipeline-editor.png'),(await window.webContents.capturePage()).toPNG());
 }catch(error){errors.push(error.stack||String(error));}
 const report={version:app.getVersion(),exe:app.getPath('exe'),audioMuted:window.webContents.isAudioMuted(),failed:errors.length+checks.filter(c=>!c.pass).length,checks,errors};
 await fs.mkdir(testOutput,{recursive:true});await fs.writeFile(path.join(testOutput,'shadow-pipeline-smoke.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.failed?1:0);
};
