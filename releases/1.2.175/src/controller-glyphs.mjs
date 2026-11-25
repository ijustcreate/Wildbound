import {controllerButtonNames,controllerMenuButtons} from './controls.mjs';
const sheets={
 xbox:new URL('../assets/controller-ui/xbox-directions.png',import.meta.url).href,
 switch:new URL('../assets/controller-ui/switch-pro-directions.png',import.meta.url).href,
 keyboard:new URL('../assets/controller-ui/keyboard-mouse-directions.png',import.meta.url).href,
};
const images=new Map();
const positions={
 xbox:{dpad:{up:1,left:2,right:3,down:4},face:{neutral:5,up:6,left:7,right:8,down:9},aux:{left:10,right:11}},
 switch:{dpad:{up:1,left:2,right:3,down:4},face:{neutral:5,up:6,left:7,right:8,down:9},aux:{left:10,right:11}},
 keyboard:{wasd:{neutral:0,up:1,left:2,right:3,down:4},arrows:{neutral:5,up:6,left:7,right:8,down:9},mouse:{left:10,right:11}},
};
function image(family){
 if(!images.has(family)){const img=new Image();img.src=sheets[family]||sheets.xbox;images.set(family,img);}
 return images.get(family);
}
export function drawControllerGlyph(canvas,family,group,direction){
 if(group==='button')return drawActionButton(canvas,family,direction);
 if(group==='binding')return drawActionButton(canvas,family,'confirm',direction);
 const index=positions[family]?.[group]?.[direction];
 if(index===undefined){
  const fallback={face:{up:3,left:2,right:1,down:0},dpad:{up:12,left:14,right:15,down:13}}[group]?.[direction];
  return fallback===undefined?false:drawActionButton(canvas,family,'confirm',fallback);
 }
 const img=image(family);if(!img.complete||!img.naturalWidth)return false;
 const col=index%4,row=Math.floor(index/4),sw=img.naturalWidth/4,sh=img.naturalHeight/3,ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;
 ctx.drawImage(img,col*sw,row*sh,sw,sh,0,0,canvas.width,canvas.height);return true;
}
// Action prompts show the actual key, without shrinking an entire face cluster.
function drawActionButton(canvas,family,action,index=controllerMenuButtons(family)[action]){
 if(action&&typeof action==='object'){index=action.index;action=action.action;}
 if(index===undefined)return false;
 const names={Cross:'×',Circle:'○',Square:'□',Triangle:'△','D-up':'↑','D-down':'↓','D-left':'←','D-right':'→'};
 const button=controllerButtonNames(family)[index]||`#${index}`;
 const label=family==='keyboard'?{confirm:'↵',back:'Esc'}[action]:names[button]||button;
 const ctx=canvas.getContext('2d'),size=Math.min(canvas.width,canvas.height);
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(size/64,size/64);
 const disc=(y,r,color)=>{ctx.beginPath();ctx.arc(32,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
 disc(34,28,'#161d1b');disc(31,27,'#f4e6bf');disc(31,24,'#26352f');
 disc(29,21,family==='switch'?'#e9e8d9':action==='confirm'?'#9de0ac':'#f39c87');
 ctx.fillStyle=family==='switch'?'#202c28':action==='confirm'?'#153f2a':'#572419';
 ctx.font='900 '+(label.length>2?19:34)+'px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,32,31,40);
 ctx.restore();return true;
}
export function controllerGlyph(canvas,family,group,direction){
 canvas.width=64;canvas.height=64;canvas.className='controller-glyph';
 canvas.setAttribute('aria-hidden','true');
 if(group==='button'||group==='binding'){drawControllerGlyph(canvas,family,group,direction);return canvas;}
 const img=image(family),render=()=>drawControllerGlyph(canvas,family,group,direction);
 if(!render())img.addEventListener('load',render,{once:true});
 return canvas;
}
