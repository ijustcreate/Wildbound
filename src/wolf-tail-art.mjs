const blend=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

export function drawWolfTail(c,{pelvis,tailBase,tailMid,tailTip},palette){
 const root=blend(pelvis,tailBase,.36);
 const shoulder=blend(tailBase,tailMid,.45);
 const lastDx=tailTip.x-tailMid.x,lastDy=tailTip.y-tailMid.y,lastLength=Math.hypot(lastDx,lastDy)||1;
 const tuft={x:tailTip.x+lastDx/lastLength*.7,y:tailTip.y-2.65};
 const bend=blend(tailMid,tuft,.58);
 bend.y+=1.65;
 const brushTip={x:tailTip.x+lastDx/lastLength*1.7,y:tailTip.y-3.75};
 const samples=[root,tailBase,shoulder,tailMid,bend,tuft,brushTip];
 const radii=[1.7,2.05,2.65,3.3,2.7,1.4,.48];
 const segments=samples.slice(1).map((point,i)=>{
  const a=samples[i],dx=point.x-a.x,dy=point.y-a.y;
  return {a,dx,dy,length2:dx*dx+dy*dy||1,radius:radii[i],growth:radii[i+1]-radii[i],i};
 });
 const left=Math.floor(Math.min(...samples.map(p=>p.x))-4),right=Math.ceil(Math.max(...samples.map(p=>p.x))+4);
 const top=Math.floor(Math.min(...samples.map(p=>p.y))-4),bottom=Math.ceil(Math.max(...samples.map(p=>p.y))+4);
 const tailColor=palette.tail||palette.body;
 // The continuous silhouette remains joined through overlapping joints in front and rear views.
 for(let y=top;y<=bottom;y++){
  for(let x=left;x<=right;x++){
   let edge=Infinity,across=0,progress=0;
   for(const {a,dx,dy,length2,radius,growth,i} of segments){
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length2));
    const back=x-a.x-dx*t,down=y-a.y-dy*t;
    const distance=Math.sqrt(back*back+down*down)-(radius+growth*t);
    if(distance<edge){edge=distance;across=down;progress=i+t;}
   }
   if(edge>0)continue;
   const shaded=edge>-.68||across>1.2||progress>=5.4||progress<.45;
   const crest=across<-.45&&progress>1.5&&progress<4.3;
   c.fillStyle=shaded?palette.shade:crest?palette.body:tailColor;
   c.fillRect(x,y,1,1);
  }
 }
}
