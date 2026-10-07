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
export function drawCreationPreview(c,appearance,{width=240,height=160,mode='full',direction=0,time=0,model=playerMotion}={}){
 const [faceX,faceY]=directionVector(direction),actor={appearance,equipment:{},faceX,faceY,animationAction:'idle',hp:100};
 const head=projectPoint(playerPose(actor,time,model).head,direction);
 const close=mode!=='full',span=mode==='face'?20:mode==='hair'?30:48;
 const scale=Math.max(1,Math.min(close?9:5,Math.floor((height-10)/span),Math.floor(width/(close?34:30))));
 const center=close?head.y+(mode==='hair'?-1:0):-22;
 c.clearRect(0,0,width,height);c.save();c.imageSmoothingEnabled=false;
 if(c.clip){c.beginPath();c.rect(0,0,width,height);c.clip();}
 c.fillStyle='#102922';c.fillRect(0,0,width,height);
 c.fillStyle='#203e32';for(let y=0;y<height;y+=12)c.fillRect(0,y,width,1);
 c.translate(Math.round(width/2),Math.round(height/2-center*scale));c.scale(scale,scale);
 drawPlayer(c,actor,time,model);c.restore();return {scale,mode,headY:height/2+(head.y-center)*scale};
}
