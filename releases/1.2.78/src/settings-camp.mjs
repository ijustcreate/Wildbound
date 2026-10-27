const INPUT_KEY='wildbound-camp-input';
export function readCampInputSettings(storage=globalThis.localStorage){
  let raw={};try{raw=JSON.parse(storage?.getItem(INPUT_KEY)||'{}')||{};}catch{}
  const number=(key,fallback,min,max)=>Number.isFinite(Number(raw[key]))?Math.max(min,Math.min(max,Number(raw[key]))):fallback;
  return {response:number('response',1,.5,2),deadzone:number('deadzone',.18,.05,.4),invertX:raw.invertX===true,invertY:raw.invertY===true,vibration:raw.vibration!==false};
}
export function shapeCampStick(x=0,y=0,settings=readCampInputSettings()){
  const length=Math.hypot(x,y);if(length<=settings.deadzone)return {x:0,y:0};
  const magnitude=Math.pow(Math.min(1,length),settings.response);
  return {x:x/length*magnitude*(settings.invertX?-1:1),y:y/length*magnitude*(settings.invertY?-1:1)};
}
export function mountCampSettings(dialog,{mapping,defaults,onMapping,promptsChanged}){
  const $=id=>dialog.querySelector('#'+id);
  const step=(control,direction)=>{
    if(control.tagName==='SELECT'){
      control.selectedIndex=(control.selectedIndex+direction+control.options.length)%control.options.length;
      control.dispatchEvent(new Event('change',{bubbles:true}));
    }else{
      const min=Number(control.min)||0,max=Number(control.max)||1;
      const amount=Math.max(Number(control.step)||.01,(max-min)/20);
      control.value=String(Math.max(min,Math.min(max,Number(control.value)+direction*amount)));
      control.dispatchEvent(new Event('input',{bubbles:true}));
      control.dispatchEvent(new Event('change',{bubbles:true}));
    }
    control.focus();
  };
  for(const control of dialog.querySelectorAll('.settings-panel:not(#settings-explorer) select,.settings-panel input[type=range]')){
    if(control.id==='music-track'||control.closest('#player-mappings'))continue;
    const range=control.type==='range',wrapper=document.createElement('div');wrapper.className=range?'camp-range':'camp-select';
    control.before(wrapper);wrapper.append(control);
    for(const direction of [-1,1]){
      const arrow=document.createElement('button');arrow.type='button';arrow.tabIndex=-1;arrow.dataset.campArrow=String(direction);arrow.textContent=direction<0?'‹':'›';
      arrow.setAttribute('aria-label',(direction<0?'Decrease ':'Increase ')+(control.getAttribute('aria-label')||control.labels?.[0]?.textContent||control.id));
      arrow.onclick=()=>step(control,direction);direction<0?wrapper.prepend(arrow):wrapper.append(arrow);
    }
    if(range){const paint=()=>control.style.setProperty('--range-fill',((Number(control.value)-Number(control.min))/(Number(control.max)-Number(control.min))*100)+'%');control.addEventListener('input',paint);paint();}
  }
  const settings=readCampInputSettings();
  for(const [id,key] of [['stick-response','response'],['aim-deadzone','deadzone'],['invert-aim-x','invertX'],['invert-aim-y','invertY'],['controller-vibration','vibration']]){
    const control=$(id),check=control.type==='checkbox';
    if(check)control.checked=settings[key];else{control.value=settings[key];control.dispatchEvent(new Event('input'));}
    control.addEventListener(check?'change':'input',()=>{settings[key]=check?control.checked:Number(control.value);localStorage.setItem(INPUT_KEY,JSON.stringify(settings));});
  }
  $('controller-prompts').value=localStorage.getItem('wildbound-controller-family')||'auto';
  $('controller-prompts').onchange=e=>{localStorage.setItem('wildbound-controller-family',e.target.value);promptsChanged?.();};
  const matchesDefault=Object.keys(defaults).every(key=>mapping[key]===defaults[key]);
  const savedPreset=localStorage.getItem('wildbound-controller-layout');
  const matchesAlternate=Object.keys(defaults).every(key=>mapping[key]===(key==='attack'?defaults.jump:key==='jump'?defaults.attack:defaults[key]));
  const preset=matchesDefault?'default':savedPreset==='alternate'&&matchesAlternate?'alternate':'custom';
  $('controller-layout').value=preset;
  $('controller-layout').onchange=e=>{
    const value=e.target.value;localStorage.setItem('wildbound-controller-layout',value);
    if(value==='custom')return;
    Object.assign(mapping,defaults);
    if(value==='alternate')[mapping.attack,mapping.jump]=[mapping.jump,mapping.attack];
    onMapping?.();
  };
  dialog.addEventListener('change',event=>{if(event.target.dataset.mapping){$('controller-layout').value='custom';localStorage.setItem('wildbound-controller-layout','custom');}});
  dialog.querySelector('.settings-tabs').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    const tabs=[...dialog.querySelectorAll('[data-settings-tab]')],index=tabs.indexOf(event.target);
    if(index<0)return;event.preventDefault();const next=tabs[(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length];next.click();next.focus();
  });
  return {step};
}
