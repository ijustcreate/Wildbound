const COMPARTMENT_SOFA_DEPTH=34,COMPARTMENT_WALL_DEPTH=5;
const compartmentSofaY=width=>-width*.22;
export const compartmentSeatStandY=seat=>seat.y+seat.h/2+7.25;
function compartmentWallY(width,legacy){
 const oldRow=width/2-23;
 if(legacy)return oldRow;
 const front=compartmentSeatStandY({y:compartmentSofaY(width),h:COMPARTMENT_SOFA_DEPTH});
 const clearRow=front+COMPARTMENT_WALL_DEPTH/2+7+.75;
 return Math.min(oldRow,Math.max(width/2-37,clearRow));
}
function usesCustomCompartments(design,car){
 if(design.interiors?.[car.id])return true;
 if(design.wideCompartmentArt===true)return false;
 for(let view=0;view<8;view++)if(design.art?.[`compartments:body:${view}`]||design.art?.[`compartments:furniture:${view}`])return true;
 return false;
}
export function nativeCompartmentAisle(design,car){
 if(car.kind!=='compartments'||usesCustomCompartments(design,car))return null;
 const wallY=compartmentWallY(car.width),inside=wallY+4,outside=car.width/2-9;
 return {wallY,center:(inside+outside)/2,half:(outside-inside)/2};
}
export function defaultInterior(car,{legacyCompartment=false}={}){
 const L=car.length,W=car.width,out=[],add=(id,kind,x,y,w,h,extra={})=>out.push({id,kind,x,y,w,h,...extra});
 if(car.kind==='seats'){for(let x=-L/2+53,i=0;x<L/2-32;x+=43,i++)for(const side of[-1,1])add('bench-'+i+'-'+side,'seat',x,side*(W/2-23),27,27,{facing:side<0?1:3});}
 if(car.kind==='compartments'){
  const start=-L/2+35,end=L/2-35,count=4,span=(end-start)/count;
  const wallY=compartmentWallY(W,legacyCompartment),back=-W/2+5,front=wallY-2;
  for(let i=0;i<count;i++){
   const x=start+i*span,center=x+span/2;
   add('partition-'+i,'wall',x,(back+front)/2,5,front-back);
   add('door-'+i,'door',center,wallY,22,COMPARTMENT_WALL_DEPTH,{open:false});
   for(const side of[-1,1])add('divider-'+i+'-'+side,'wall',center+side*(span/4+5.5),wallY,span/2-11,COMPARTMENT_WALL_DEPTH);
   for(const dx of[-span*.25,span*.25])add('sofa-'+i+'-'+dx,'seat',center+dx,compartmentSofaY(W),22,COMPARTMENT_SOFA_DEPTH,{facing:dx<0?0:2});
   add('table-'+i,'table',center,-W*.25,14,22);
  }
 }
 if(car.kind==='caboose'){for(const side of[-1,1])add('caboose-bench-'+side,'seat',-25,side*28,46,23,{facing:side<0?1:3});add('caboose-desk','table',35,-25,28,22);add('caboose-stove','firebox',42,28,18,18);}
 if(car.kind==='engine'){add('controls','console',-L*.34,-W*.23,25,18);add('firebox','firebox',-L*.12,0,22,36);add('cab-bulkhead','wall',-L*.06,0,6,W-18);}
 return out;
}
export function trainInterior(d,car){
 return d.interiors?.[car.id]||defaultInterior(car,{legacyCompartment:car.kind==='compartments'&&usesCustomCompartments(d,car)});
}
