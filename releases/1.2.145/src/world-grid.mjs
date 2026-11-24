const KEY='wildbound-world-grid';
const normalize=s=>({enabled:s?.enabled===true,style:s?.style==='dotted'?'dotted':'solid',opacity:Math.max(0,Math.min(1,Number.isFinite(Number(s?.opacity))?Number(s.opacity):.18))});
let current;try{current=normalize(JSON.parse(globalThis.localStorage?.getItem(KEY)||'{}'));}catch{current=normalize();}
export const worldGridSettings=()=>({...current});
export function setWorldGridSettings(patch){current=normalize({...current,...patch});globalThis.localStorage?.setItem(KEY,JSON.stringify(current));return worldGridSettings();}
export function drawWorldGrid(c,camera,w,h){
 if(!current.enabled||!current.opacity)return;
 const left=Math.floor((camera.x-w/camera.zoom/2)/32)*32,top=Math.floor((camera.y-h/camera.zoom/2)/32)*32;
 const right=camera.x+w/camera.zoom/2,bottom=camera.y+h/camera.zoom/2;
 c.save();c.globalAlpha=current.opacity;c.strokeStyle='#e7efd8';c.lineWidth=1/camera.zoom;c.setLineDash(current.style==='dotted'?[1/camera.zoom,4/camera.zoom]:[]);
 c.beginPath();for(let x=left;x<=right;x+=32){c.moveTo(x,top);c.lineTo(x,bottom);}for(let y=top;y<=bottom;y+=32){c.moveTo(left,y);c.lineTo(right,y);}c.stroke();c.restore();
}
