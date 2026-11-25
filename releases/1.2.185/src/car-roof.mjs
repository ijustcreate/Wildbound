import {carProject} from './car-projection.mjs';

export function carRoofGeometry(v){const w=v.w||96,h=v.h||144;
 const base=[[-.31,-.08],[.31,-.08],[.365,-.045],[.365,.205],[.31,.24],[-.31,.24],[-.365,.205],[-.365,-.045]].map(([x,y])=>[x*w,y*h,38]);
 const crown=base.map(([x,y])=>[x*.91,h*.08+(y-h*.08)*.90,40]);
 return {base,crown};
}
export function drawCarRoof(c,v){
 const {base,crown}=carRoofGeometry(v),paint=(ps,color)=>{c.fillStyle=color;c.beginPath();ps.map(p=>carProject(v,...p)).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();};
 paint(base,'#263f39');
 // Broad bevel masses, shaded against the same upper-left world light.
 for(let i=0;i<8;i++){const j=(i+1)%8,dx=base[j][0]-base[i][0],dy=base[j][1]-base[i][1],a=v.heading||0;
  const nx=Math.cos(a)*dy+Math.sin(a)*dx,ny=Math.sin(a)*dy-Math.cos(a)*dx;
  const light=(-nx-ny*.6)/(Math.hypot(nx,ny)||1);
  paint([base[i],base[j],crown[j],crown[i]],light>.3?'#91a586':light<-.3?'#3d5b49':'#617e63');
 }
 paint(crown,'#718d6d');
 // One quiet highlight cluster, rather than a framed rectangle on the roof.
 const [a,b]=crown,highlight=[a,b,[b[0]*.97,b[1]+2,40.1],[a[0]*.97,a[1]+2,40.1]];paint(highlight,'#a0b18e');
}
