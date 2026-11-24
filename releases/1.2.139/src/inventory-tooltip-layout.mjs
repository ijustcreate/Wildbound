const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
export function tooltipPlacement({width,height,tipWidth,tipHeight,anchor,protectedAreas=[]}){
  const w=Math.min(tipWidth,Math.max(1,width-8)),h=Math.min(tipHeight,Math.max(1,height-8));
  const clamp=(v,max)=>Math.max(4,Math.min(Math.max(4,max-4),v));
  const candidates=[
    {x:anchor.x+anchor.w+8,y:anchor.y,side:'right'},
    {x:anchor.x-w-8,y:anchor.y,side:'left'},
    {x:anchor.x+(anchor.w-w)/2,y:anchor.y-h-8,side:'top'},
    {x:anchor.x+(anchor.w-w)/2,y:anchor.y+anchor.h+8,side:'bottom'},
    {x:4,y:4,side:'top'},{x:width-w-4,y:4,side:'top'},
    {x:4,y:height-h-4,side:'bottom'},{x:width-w-4,y:height-h-4,side:'bottom'},
  ];
  return candidates.map(p=>{
    const box={x:clamp(p.x,width-w),y:clamp(p.y,height-h),w,h};
    return {...p,...box,score:overlap(box,anchor)*12+protectedAreas.reduce((sum,a)=>sum+overlap(box,a)*(a.weight||1),0)};
  }).reduce((best,p)=>p.score<best.score?p:best);
}
