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
 const n=swampNoise(x/54,y/46),f=swampNoise(x/18,y/18);
 if(h<-.65)return n>.53?'#294f49':'#244947';
 if(h<-.25)return '#345d54';
 if(h<.45)return f>.55?'#536e54':'#506d53';
 if(h<.8)return '#65694c';
 if(h<1.13)return '#7c7953';
 if(swampNoise(x/96+7,y/76)>.68)return f>.5?'#767a50':'#70774e';
 return n<.34?'#556c47':n>.65?'#677a4d':'#5d734a';
}
