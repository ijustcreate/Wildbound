const mask = (name,color,detail)=>({
 name,base:'hat',slot:'head',style:'mask',rarity:'rare',stack:1,color,
 spellDamage:2,spellHealingFlat:2,supplyOnly:true,sellPrice:52,
 description:`${detail} +2 spell damage and healing while worn.`,
});

export const DEATH_EATER_MASKS={
 death_eater_ivory_mask:mask('Ivory Death Eater Mask','#dfcca1','A bone-white faceplate with crimson cheek seams.'),
 death_eater_iron_mask:mask('Iron Death Eater Mask','#8d88b0','An angular iron faceplate with a violet brow.'),
 death_eater_copper_mask:mask('Copper Death Eater Mask','#c98f57','A flared copper faceplate inlaid with verdigris.'),
};

const faces={
 death_eater_ivory_mask:{
  ink:'#302b2d',shadow:'#806358',body:'#d1b389',light:'#fff1cd',accent:'#953d42',
  rows:[[-5,-3,7],[-4,-5,11],[-3,-6,13],[-2,-6,13],[-1,-6,13],[0,-5,11],[1,-5,11],[2,-4,9],[3,-4,9],[4,-3,7],[5,-2,5],[6,-1,3]],
  detail:[[-4,-3,8,1,'light'],[-4,1,2,1,'accent'],[2,1,2,1,'accent'],[-3,2,1,2,'accent'],[3,2,1,2,'accent'],[-1,4,3,1,'shadow'],[0,2,1,1,'shadow']],
 },
 death_eater_iron_mask:{
  ink:'#201b30',shadow:'#4d4767',body:'#8b86a7',light:'#d4cce4',accent:'#b880d5',
  rows:[[-6,-6,2],[-6,5,2],[-5,-6,13],[-4,-5,11],[-3,-5,11],[-2,-5,11],[-1,-5,11],[0,-5,11],[1,-4,9],[2,-4,9],[3,-3,7],[4,-2,5],[5,-1,3],[6,0,1]],
  detail:[[-3,-4,7,1,'light'],[0,-3,1,3,'accent'],[-4,1,2,1,'light'],[3,1,2,1,'shadow'],[-1,2,1,2,'shadow'],[1,2,1,2,'shadow'],[0,4,1,2,'accent']],
 },
 death_eater_copper_mask:{
  ink:'#382630',shadow:'#825343',body:'#bf8150',light:'#f8c983',accent:'#6dc3a8',
  rows:[[-5,-2,5],[-4,-6,13],[-3,-7,15],[-2,-6,13],[-1,-6,13],[0,-5,11],[1,-6,13],[2,-6,13],[3,-5,11],[4,-3,7],[5,-2,5]],
  detail:[[-2,-4,5,1,'light'],[0,-3,1,2,'accent'],[-5,0,1,2,'accent'],[5,0,1,2,'accent'],[-4,2,2,1,'accent'],[3,2,2,1,'accent'],[-2,3,5,1,'light'],[-1,4,3,1,'shadow']],
 },
};

export function drawDeathEaterMask(c,head,d,id){
 const face=faces[id];
 if(!face)return false;
 const x=Math.round(head.x),y=Math.round(head.y);
 const r=(xx,yy,w,h,color)=>{
  c.fillStyle=face[color];c.fillRect(x+xx,y+yy,w,h);
 };
 const side=d===2||d===6, back=d>=3&&d<=5,sign=d<4?-1:1;
 if(d!==0){
  r(-6,-1,13,2,'ink');r(-5,-1,11,1,'shadow');
  r(-2,0,5,2,'shadow');r(-1,0,3,1,'light');
  if(back){
   if(d!==4){r(sign*5-1,-3,2,6,'ink');r(sign*5-1,-2,1,4,'body');}
   return true;
  }
 }
 // Compress the faceplate in profile while keeping the strap on the head joint.
 const scale=side?.48:d===0?1:.76,offset=(d===0?0:side?3:2)*sign;
 const span=(l,yy,w,h,color)=>{
  const left=Math.round(l*scale)+offset,right=Math.round((l+w)*scale)+offset;
  if(right>left)r(left,yy,right-left,h,color);
 };
 for(const [yy,left,w] of face.rows){
  span(left,yy,w,1,'ink');
  if(w>3&&yy>-5&&yy<5)span(left+1,yy,w-2,1,yy>2?'shadow':'body');
 }
 for(const [xx,yy,w,h,color] of face.detail)span(xx,yy,w,h,color);
 if(!side||sign<0){span(-4,-1,3,1,'ink');span(-3,0,2,1,'ink');}
 if(!side||sign>0){span(1,-1,3,1,'ink');span(1,0,2,1,'ink');}
 span(0,1,1,1,side?'ink':'light');
 return true;
}

export function paintDeathEaterMaskIcon(c,id){
 return drawDeathEaterMask(c,{x:12,y:12},0,id);
}
