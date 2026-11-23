export function defaultInterior(car){
 const L=car.length,W=car.width,out=[],add=(id,kind,x,y,w,h,extra={})=>out.push({id,kind,x,y,w,h,...extra});
 if(car.kind==='seats'){for(let x=-L/2+53,i=0;x<L/2-32;x+=43,i++)for(const side of[-1,1])add('bench-'+i+'-'+side,'seat',x,side*(W/2-23),27,27,{facing:side<0?1:3});}
 if(car.kind==='compartments'){
  const start=-L/2+35,end=L/2-35,count=4,span=(end-start)/count;
  for(let i=0;i<count;i++){const x=start+i*span;add('partition-'+i,'wall',x,-10,5,W-30);add('door-'+i,'door',x+span/2,W/2-23,22,5,{open:false});for(const side of[-1,1])add('divider-'+i+'-'+side,'wall',x+span/2+side*(span/4+5.5),W/2-23,span/2-11,5);for(const dx of[-span*.25,span*.25])add('sofa-'+i+'-'+dx,'seat',x+span/2+dx,-W*.22,22,34,{facing:dx<0?0:2});add('table-'+i,'table',x+span/2,-W*.25,14,22);}
 }
 if(car.kind==='caboose'){for(const side of[-1,1])add('caboose-bench-'+side,'seat',-25,side*28,46,23,{facing:side<0?1:3});add('caboose-desk','table',35,-25,28,22);add('caboose-stove','firebox',42,28,18,18);}
 if(car.kind==='engine'){add('controls','console',-L*.34,-W*.23,25,18);add('firebox','firebox',-L*.12,0,22,36);add('cab-bulkhead','wall',-L*.06,0,6,W-18);}
 return out;
}
export function trainInterior(d,car){return d.interiors[car.id]||defaultInterior(car);}
