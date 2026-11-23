const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=process.env.WILDBOUND_VERIFY_APP||root;
const stage=process.env.WILDBOUND_VERIFY_APP?'packaged':'source';
const out=path.join(root,'test-output','combat-workshop',stage);
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-combat-studio-')));
app.commandLine.appendSwitch('mute-audio');
app.disableHardwareAcceleration();

async function verifyStudio(){
  await window.wildboundBoot.ready;
  if(window.wildboundBoot.error)throw Error(window.wildboundBoot.error);
  const checks=[];
  const check=(value,name)=>{
    if(!value)throw Error(name);
    checks.push(name);
  };
  const {combatTuning}=await import('./src/combat-workshop-settings.mjs');
  const {triggerCombatImpact}=await import('./src/combat-impact.mjs');
  const button=(parent,text)=>[...parent.querySelectorAll('button')].find(candidate=>candidate.textContent.trim()===text);
  const open=button(document.querySelector('#party-menu'),'Studio');
  check(!!open,'Lobby exposes the normal Rig Studio entry point');
  open.click();
  const studio=document.querySelector('dialog.designer-dialog[open]');
  check(!!studio,'Rig Studio opens');
  const nav=studio.querySelector('nav');
  button(nav,'Combos').click();
  button(studio.querySelector('nav'),'Combos').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  check(studio.querySelector('[aria-selected=true]').textContent==='Combat' &&
    document.activeElement===button(studio.querySelector('nav'),'Combat'),'Keyboard navigation enters the adjacent Combat tab');
  const workshop=studio.querySelector('.combat-workshop-editor');
  check(workshop?.querySelectorAll('fieldset').length===5,'Impact, counter, boomerang, elemental and co-op controls are present');
  const selector=workshop.querySelector('select');
  check([...selector.options].map(option=>option.value).includes('missed') &&
    [...selector.options].map(option=>option.value).includes('team'),'Timed miss and team previews are selectable');
  const field=workshop.querySelector('[name=impactShake]');
  const pause=workshop.querySelector('[name=impactFreeze]');
  field.value='0';
  field.dispatchEvent(new Event('input',{bubbles:true}));
  pause.checked=false;
  pause.dispatchEvent(new Event('input',{bubbles:true}));
  check(combatTuning.impactShake>0&&combatTuning.impactFreeze,'Draft settings leave gameplay alone before Save');
  workshop.querySelector('form').requestSubmit();
  const game={time:3};
  triggerCombatImpact(game,{x:10,y:20},{x:14,y:20},{kind:'wallSlam'});
  check(combatTuning.impactShake===0&&!combatTuning.impactFreeze&&!game.combatHitstop&&!game.combatImpactShakes?.length&&
    JSON.parse(localStorage.getItem('wildbound-combat-workshop-v1')).impactShake===0,'Saved accessibility tuning reaches the real impact runtime');
  button(workshop,'Restore defaults').click();
  check(combatTuning.impactShake===0&&pause.checked,'Reset restores the editor draft before Save');
  workshop.querySelector('form').requestSubmit();
  check(combatTuning.impactShake>0&&combatTuning.impactFreeze,'Saving restored defaults re-enables the original hit feedback');
  selector.value='boomerang';
  selector.dispatchEvent(new Event('change',{bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,890));
  check(workshop.querySelector('.combat-workshop-preview p').textContent.includes('return line'),
    'Boomerang positioning preview plays and explains its return line');
  window.combatWorkshopReview={check,checks,studio,workshop,button};
  return checks;
}

app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1080,height:760,useContentSize:true,webPreferences:{backgroundThrottling:false}});
  win.webContents.setAudioMuted(true);
  win.showInactive();
  const errors=[];
  win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
  win.webContents.on('render-process-gone',(_event,details)=>errors.push(details.reason));
  const capture=async name=>{
    const image=await win.webContents.capturePage();
    fs.writeFileSync(path.join(out,name+'.png'),image.toPNG());
  };
  try{
    await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript(`(${verifyStudio.toString()})()`);
    await capture('combat-preview');
    win.setContentSize(650,540);
    await new Promise(resolve=>setTimeout(resolve,250));
    const checks=await win.webContents.executeJavaScript(`(()=>{
      const {check,checks,studio,workshop,button}=window.combatWorkshopReview;
      const body=studio.querySelector('.studio-body');
      check(workshop.scrollWidth<=workshop.clientWidth+1&&body.scrollWidth<=body.clientWidth+1,'Combat tab fits a narrow desktop window');
      button(studio.querySelector('nav'),'Particles').click();
      const names=[...studio.querySelector('select[aria-label="Gameplay particle slot"]').options].map(option=>option.value);
      check(['game-cut-impact','game-wall-impact','game-thermal-burst'].every(name=>names.includes(name)),'New combat artwork can be edited through the native Particles slots');
      return checks;
    })()`);
    const report={base,stage,checks,errors,failed:errors.length};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
    app.exit(report.failed?1:0);
  }catch(error){
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,stage,error:String(error),errors,failed:1},null,2));
    console.error(error);
    app.exit(1);
  }
});
