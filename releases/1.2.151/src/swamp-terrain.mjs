// Shared continuous surface: the editor's terrain tiles are authoritative.
// Runtime water queries and ground shading use this same interpolation.
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export function swampNoise(x,y){const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy,u=a*a*(3-2*a),v=b*b*(3-2*b),mix=(a,b,t)=>a+(b-a)*t;return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
const elevation={water:-1,shallow:.3,mud:1,marsh_grass:1.6,bridge:1.6};
export function swampSurface(tileAt,x,y){
 const direct=tileAt(Math.floor(x/32),Math.floor(y/32));if(direct==='bridge')return {kind:'bridge',height:2};
 const fx=x/32-.5,fy=y/32-.5,tx=Math.floor(fx),ty=Math.floor(fy),u=fx-tx,v=fy-ty;
 const e=(dx,dy)=>elevation[tileAt(tx+dx,ty+dy)]??-1;
 const h=(e(0,0)*(1-u)+e(1,0)*u)*(1-v)+(e(0,1)*(1-u)+e(1,1)*u)*v;
 return {kind:h<-.25?'water':h<.8?'shallow':h<1.13?'mud':'marsh_grass',height:h};
}
export function swampGroundColor(h,x,y){
 const n=swampNoise(x/74,y/63),f=swampNoise(x/21,y/19),m=swampNoise(x/113+7,y/97);
 if(h<-.65)return n>.59?'#28544f':n<.34?'#193e42':'#214a49';
 if(h<-.25)return f>.63?'#3a6c60':'#2f5d56';
 if(h<.3)return f>.57?'#537b60':'#456d58';
 if(h<.68)return f>.6?'#737b51':'#596c4b';
 if(h<1.05)return f>.62?'#999064':f<.31?'#586047':'#7f7b54';
 if(h<1.2)return f>.5?'#92905c':'#6c784c';
 // Large moss/peat patches contain finer leaf and soil planes, across tile edges.
 if(m>.66)return f>.58?'#8c9158':'#7a8350';
 if(n<.32)return f>.6?'#536c46':'#496443';
 if(n>.6)return f>.65?'#849952':'#74894c';
 return f>.66?'#71894d':f<.3?'#547343':'#65804a';
}
