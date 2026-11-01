// Cosmetic eyewear belongs above head equipment, unlike skin markings. Attach
// to the same eye handles as the face, inside the head's rotation/scale space.
export function drawFaceAccessories(c,points,d,look,visible=()=>true){
 if(look?.face!=='glasses')return false;
 const ink='#292c36',glint='#b8dad8',profile=d===2||d===6,back=d>=3&&d<=5;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h);};
 if(back){
  // Lenses never show through the back of a skull. Rear diagonals expose the
  // near temple arm only, even when worn over a hood or helmet.
  if(d!==4){const s=d===3?1:-1;rect(points.head.x+s*5-.5,points.head.y-1,1,2,ink);}return true;
 }
 const lenses=[];
 for(const name of ['eyeL','eyeR']){
  if(!visible(name))continue;
  const q=points[name],turn=d<4?-1:1,far=(d===1&&name==='eyeL')||(d===7&&name==='eyeR');
  const x=q.x+(profile?turn*.5:0),y=q.y-((d===1&&name==='eyeR')||(d===7&&name==='eyeL')?.8:0);
  const w=far?2.25:profile?2.75:3.5,left=x-w/2,top=y-2.3;
  // Open lenses retain the eyes; a tiny cool reflection, not opaque blue blocks.
  rect(left,top,w,.5,ink);rect(left,top+3,w,.5,ink);
  rect(left,top,.5,3.5,ink);rect(left+w-.5,top,.5,3.5,ink);
  rect(left+.5,top+.5,.5,.5,glint);lenses.push({x,left,right:left+w,y:top+1});
 }
 lenses.sort((a,b)=>a.x-b.x);
 if(lenses.length>1){const [a,b]=lenses;rect(a.right-.5,(a.y+b.y)/2,Math.max(.5,b.left-a.right+1),.5,ink);}
 if(profile&&lenses.length){const a=lenses[0],end=points.head.x+(d===2?3:-3),start=d===2?a.right:end;rect(start,a.y,Math.max(.5,Math.abs(end-a.right)),.5,ink);}
 return true;
}
