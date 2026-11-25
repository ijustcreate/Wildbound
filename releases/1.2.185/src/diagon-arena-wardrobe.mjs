const costumes = {
 arena_clerk_tie: ['Night-shift shirt and tie','shirt','#b7b7ae','#536573','tie'],
 arena_red_jacket: ['Oxblood riding jacket','coat','#9e4034','#d38558','lapels'],
 arena_corner_tracksuit: ['Corner team tracksuit','tracksuit','#506b67','#d0bf9e','piping'],
 arena_lace_mourning: ['Ink-lace dress jacket','coat','#443449','#ac7e96','lace'],
 arena_satin_corner: ['Ivory satin warm-up','satin','#bcbcb2','#7d8d86','wings'],
 arena_house_waistcoat: ['House black waistcoat','vest','#453d3e','#b68d59','button'],
 arena_heavy_chains: ['Cutoff and heavyweight chains','vest','#424844','#e1b661','chains'],
 arena_yellow_tracksuit: ['Saffron practice suit','tracksuit','#dfab36','#373539','bands'],
 arena_lion_harness: ['Lionhide sparring harness','vest','#a47645','#e3b46d','harness'],
 arena_orange_harness: ['Orange rescue harness','harness','#dbd7c0','#d96b31','rescue'],
};

export const ARENA_COSTUMES = Object.fromEntries(Object.entries(costumes).map(([id,[name,style,artColor,trimColor,arenaCut]])=>[
 id,{name,style,slot:'chest',base:'armor',artColor,trimColor,color:artColor,stack:1,armor:0,sockets:0,devOnly:true,supplyOnly:true,arenaCut},
]));

// Pixel trim draws inside the torso and follows the projected chest joint.
// Profile views show the near seam. Rear views show the corresponding back details.
export function drawArenaCostumeTrim(c,anchor,d,cut,palette) {
 const profile=d===2||d===6;
 const rear=d>=3&&d<=5;
 const near=d===2?-1:d===6?1:d===1||d===3?-1:d===5||d===7?1:0;
 const plot=(x,y,w,h,color)=>{
  c.fillStyle=color;
  c.fillRect(Math.round(anchor.x)+x,Math.round(anchor.y)+y,w,h);
 };
 const {ink,dark,light,trim}=palette;
 const mark=(x,y,w,h)=>plot(x,y,w,h,trim);
 if(cut==='tie'){
  if(rear)plot(-2,2,5,1,light);
  else {mark(near,1,2,2);mark(near,3,1,3);plot(near,6,2,1,ink);}
 }else if(cut==='lapels'){
  if(rear){plot(-2,1,5,1,dark);plot(near,2,1,5,dark);}
  else {plot(-3+near,1,profile?2:5,2,light);plot(near,3,2,4,ink);mark(near,4,1,3);}
 }else if(cut==='piping'||cut==='bands'){
  const x=profile?near*2:-3;
  mark(x,2,1,5);
  if(!profile)mark(3,2,1,5);
  if(!rear)plot(near,3,1,4,cut==='bands'?ink:light);
 }else if(cut==='lace'){
  plot(-3,3,profile?4:7,3,dark);
  for(let x=-2;x<=(profile?0:2);x+=2){mark(x,3,1,1);plot(x+1,4,1,1,light);}
  if(!rear)mark(near,6,1,1);
 }else if(cut==='wings'){
  if(rear){mark(-3,3,profile?4:7,1);plot(-2,4,profile?2:5,1,dark);mark(near,5,2,1);}
  else {plot(near,2,1,5,dark);mark(near+1,4,2,1);}
 }else if(cut==='button'){
  if(rear)plot(-3,6,profile?4:7,1,dark);
  else {plot(near,1,2,3,ink);mark(near,4,1,1);mark(near,6,1,1);}
 }else if(cut==='chains'){
  mark(-3+near,1,profile?3:6,1);
  if(!rear){mark(-2+near,3,profile?3:5,1);plot(near,5,2,2,'#fff0ac');mark(near,6,2,1);}
 }else if(cut==='harness'){
  for(let y=1;y<=6;y++)plot(Math.floor(y*(rear?-1:1)/2)-(rear?-1:2)+near,y,2,1,trim);
  if(!rear){plot(near,4,2,2,'#f1d28d');plot(near,5,1,1,ink);}
 }else if(cut==='rescue'){
  mark(-3,1,1,6);
  if(!profile)mark(3,1,1,6);
  mark(-2,4,profile?4:5,1);
  if(rear)mark(near,5,2,2);
  else plot(near,4,1,2,ink);
 }
}
