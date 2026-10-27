import {drawPlayer,playerMotion,playerPose,projectPoint,directionVector} from './player-motion.mjs';
import {controllerButtonNames,controllerFamily} from './controls.mjs';

// Menu actions use physical positions, independently of gameplay remapping.
export function creationButtonLabels(family='keyboard'){
 if(family==='keyboard')return {choose:'Enter',back:'Esc',delete:'Backspace',shift:'Shift key button',done:'Ctrl+Enter',adjust:'Space',rotate:'View buttons',move:'Arrows / Tab'};
 const names=controllerButtonNames(family);
 return {choose:names[0],back:names[1],delete:names[2],shift:names[3],done:names[9],adjust:names[2],rotate:names[4]+' / '+names[5],move:'D-pad / stick'};
}
export function creationHelp(family,keyboard=false){
 const n=creationButtonLabels(family);
 return keyboard?`${n.move}: move · ${n.choose}: choose · ${n.delete}: delete · ${n.shift}: shift · ${n.done}: done · ${n.back}: cancel`:`${n.move}: move · ${n.choose}: choose · ${n.back}: back`;
}
export function creationFamily(owner){
 if(owner?.device==='keyboard')return 'keyboard';
 const pad=Array.from(globalThis.navigator?.getGamepads?.()||[]).find(p=>'pad:'+p?.index===owner?.device);
 return pad?controllerFamily(pad):owner?.controllerFamily||'generic';
}
let forestPlate;
function creationForestPlate(){
 if(!forestPlate&&typeof Image!=='undefined'){forestPlate=new Image();forestPlate.src=new URL('/Wildbound/releases/1.2.78/assets/ui/creation/forest-preview-v1.png',import.meta.url).href;}
 return forestPlate;
}
export function drawCreationPreview(c,appearance,{width=240,height=160,mode='full',direction=0,time=0,model=playerMotion,scene=false}={}){
 const [faceX,faceY]=directionVector(direction),actor={appearance,equipment:{},faceX,faceY,animationAction:'idle',hp:100};
 const head=projectPoint(playerPose(actor,time,model).head,direction);
 const close=mode!=='full',span=mode==='face'?20:mode==='hair'?30:scene?44:48;
 const scale=Math.max(1,Math.min(close?16:7,Math.floor((scene&&!close?height*.86:height-10)/span),Math.floor(width/(mode==='face'?24:30))));
 const center=close?head.y+(mode==='hair'?-1:0):-22;
 c.clearRect(0,0,width,height);c.save();c.imageSmoothingEnabled=false;
 if(c.clip){c.beginPath();c.rect(0,0,width,height);c.clip();}
 c.fillStyle='#102922';c.fillRect(0,0,width,height);
 if(scene&&!close){const plate=creationForestPlate();if(plate?.complete&&plate.naturalWidth)c.drawImage(plate,0,0,width,height);}
 c.translate(Math.round(width/2),Math.round(scene&&!close?height*.855:height/2-center*scale));c.scale(scale,scale);
 drawPlayer(c,actor,time,model);c.restore();return {scale,mode,headY:height/2+(head.y-center)*scale};
}
