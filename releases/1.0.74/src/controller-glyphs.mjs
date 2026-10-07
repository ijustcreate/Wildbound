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
 const img=image(family);if(!img.complete||!img.naturalWidth)return false;
 const index=positions[family]?.[group]?.[direction];if(index===undefined)return false;
 const col=index%4,row=Math.floor(index/4),sw=img.naturalWidth/4,sh=img.naturalHeight/3,ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;
 ctx.drawImage(img,col*sw,row*sh,sw,sh,0,0,canvas.width,canvas.height);return true;
}
export function controllerGlyph(canvas,family,group,direction){
 canvas.width=64;canvas.height=64;canvas.className='controller-glyph';
 canvas.setAttribute('aria-hidden','true');
 const img=image(family),render=()=>drawControllerGlyph(canvas,family,group,direction);
 if(!render())img.addEventListener('load',render,{once:true});
 return canvas;
}
