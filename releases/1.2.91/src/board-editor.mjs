import {drawBoard} from './board.mjs';
import {boardSettings,DEFAULT_BOARD_SETTINGS,BOARD_LIMITS,BOARD_PIECES,saveBoardSettings,validBoardSettings} from './board-settings.mjs';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export class BoardEditor {
  constructor(events){this.events=events;this.draft=structuredClone(boardSettings);}
  stop(){cancelAnimationFrame(this.frame);}
  mount(root){
    this.stop();root.className='board-editor';
    const preview=el('div'),controls=el('div');preview.className='board-editor-preview';controls.className='board-editor-controls';root.append(preview,controls);
    preview.append(el('h2','Living board'),el('p','Particles gather into the event name and warning, then resolve into sharp letters.'));
    const canvas=el('canvas');canvas.width=1000;canvas.height=700;canvas.setAttribute('aria-label','Live board and particle preview');preview.append(canvas);
    const actions=el('div');actions.className='board-editor-actions';preview.append(actions);
    const button=(parent,text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;parent.append(b);return b;};
    let age=0,time=0,playing=true,mode='event',zoom=false;
    const caption=el('p');caption.setAttribute('role','status');preview.append(caption);
    button(actions,'Idle swirl',()=>{mode='idle';age=0;caption.textContent='Idle swirl';});
    button(actions,'Replay reveal',()=>{mode='event';age=0;playing=true;caption.textContent=title.value+' — '+warning.value;});
    const pause=button(actions,'Pause',()=>{playing=!playing;pause.textContent=playing?'Pause':'Play';});
    const zoomButton=button(actions,'Inspect center',()=>{zoom=!zoom;zoomButton.textContent=zoom?'Show full board':'Inspect center';});
    const field=(name,input)=>{const label=el('label',name);label.append(input);controls.append(label);return input;};
    controls.append(el('h3','Event preview'));
    const title=field('Event name',el('input'));title.value='The jungle awakens';title.maxLength=90;
    const warning=field('Warning',el('textarea'));warning.value='Stay together. Something is hunting.';warning.maxLength=240;
    for(const input of [title,warning])input.oninput=()=>{age=0;mode='event';};
    const events=Array.isArray(this.events)?this.events:Object.values(this.events||{});
    if(events.length){const select=field('Sample event',el('select'));select.append(new Option('Choose an event',''));for(const [i,e]of events.entries())select.append(new Option(e.name||e.id,String(i)));select.onchange=()=>{const e=events[Number(select.value)];if(select.value!==''&&e){title.value=e.name;warning.value=e.tip||'';age=0;mode='event';caption.textContent=title.value+' — '+warning.value;}};}
    controls.append(el('h3','Art and magic'));
    const names={particles:'Particle count',swirlSpeed:'Swirl speed',particleSize:'Particle size',glow:'Glow strength',gatherTime:'Assembly time (seconds)',textSize:'Letter size',pieceSize:'Game piece size',boardLight:'Board brightness'};
    for(const [key,[min,max,step]]of Object.entries(BOARD_LIMITS)){const input=field(names[key],el('input'));input.type='range';input.min=min;input.max=max;input.step=step;input.value=this.draft[key];const output=el('output',String(this.draft[key]));input.parentElement.append(output);input.oninput=()=>{this.draft[key]=Number(input.value);output.value=input.value;};}
    for(const [key,name]of [['energy','Swirl color'],['letters','Letter color']]){const input=field(name,el('input'));input.type='color';input.value=this.draft[key];input.oninput=()=>this.draft[key]=input.value;}
    for(const [key,name]of [['reducedMotion','Reduced motion — immediate readable text'],['showPath','Show numbered movement anchors']]){const input=field(name,el('input'));input.type='checkbox';input.checked=this.draft[key];input.onchange=()=>this.draft[key]=input.checked;}
    controls.append(el('h3','Party pieces · eight directions'));
    for(let i=0;i<6;i++){const select=field('Player '+(i+1),el('select'));for(const name of BOARD_PIECES)select.append(new Option(name[0].toUpperCase()+name.slice(1),name));select.value=this.draft.pieces[i];select.onchange=()=>this.draft.pieces[i]=select.value;}
    const status=el('p');status.setAttribute('role','status');controls.append(status);
    button(controls,'Save board settings',()=>{saveBoardSettings(this.draft);status.textContent='Saved on this device. The game now uses these settings.';});
    button(controls,'Reset preview',()=>{this.draft=structuredClone(DEFAULT_BOARD_SETTINGS);root.replaceChildren();this.mount(root);});
    button(controls,'Export settings',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(this.draft,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='wildbound-board.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    const file=field('Import settings',el('input'));file.type='file';file.accept='.json,application/json';file.onchange=async()=>{try{const f=file.files[0];if(!f||f.size>20000)throw Error();const data=JSON.parse(await f.text());if(!validBoardSettings(data))throw Error();this.draft=structuredClone(data);root.replaceChildren();this.mount(root);}catch{status.textContent='Choose a valid Wildbound board settings JSON file.';}};
    caption.textContent=title.value+' — '+warning.value;
    let last=performance.now();const tick=now=>{if(!root.isConnected||!root.closest('dialog')?.open){this.stop();return;}const dt=Math.min(.05,(now-last)/1000);last=now;if(playing){age+=dt;time+=dt;}const c=canvas.getContext('2d');c.clearRect(0,0,1000,700);c.fillStyle='#0d201a';c.fillRect(0,0,1000,700);c.save();c.translate(500,350);c.scale(zoom?15:3.45,zoom?15:3.45);c.imageSmoothingEnabled=false;const game={players:Array.from({length:6},(_,i)=>({boardProgress:(i*8+time*.7)%48,color:['#e6c876','#81cdeb','#98d681','#c3b5df','#ec99ad','#efead5'][i]}))};drawBoard(c,game,time,{settings:this.draft,previewTitle:mode==='event'?title.value:'',previewWarning:mode==='event'?warning.value:'',previewAge:age});c.restore();this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
  }
}
