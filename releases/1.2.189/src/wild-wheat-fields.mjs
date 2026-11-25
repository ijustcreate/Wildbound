import {forestHash} from './forest-landscape.mjs';

// Three cultivated clearings on the dry ground east of the Homestead.
export const WILD_WHEAT_FIELDS=[
 {id:'north',x:9060,y:6830,w:282,h:184},
 {id:'east',x:9390,y:6890,w:250,h:146},
 {id:'south',x:9050,y:7070,w:320,h:190},
];

export function wildWheatFieldAt(x,y,padX=0,padY=padX){
 return WILD_WHEAT_FIELDS.some(field=>{
  const dx=Math.abs(x-field.x)/(field.w/2+padX),dy=Math.abs(y-field.y)/(field.h/2+padY);
  return dx<1&&dy<1&&dx**4+dy**4<1;
 });
}

const cropByDesign=new WeakMap();
const rowSpacing=18,tuftSpacing=54;

function plantField(field){
 const tufts=[],rows=Math.round(field.h/rowSpacing);
 for(let row=0;row<rows;row++){
  const dy=(row-(rows-1)/2)*rowSpacing;
  const width=field.w*(1-(2*dy/field.h)**4)**.25;
  const columns=Math.round(width/tuftSpacing);
  for(let col=0;col<columns;col++){
   const n=row*16+col;
   const size=76+Math.round(forestHash(n,field.y)*10);
   const x=field.x+(col-(columns-1)/2)*tuftSpacing+(row%2?5:-5)+Math.round((forestHash(field.x,n)-.5)*10);
   const rootY=field.y+dy+Math.round((forestHash(n,field.x)-.5)*8);
   tufts.push({
    id:`wild-wheat:${field.id}:${row}:${col}`,kind:'tall_grass',grassVariant:'wheat',
    x,y:rootY-size*.4,rootY,size,procedural:true,_biome:'house',
    grassShade:.9+forestHash(rootY,x)*.19,tuftSeed:Math.floor(forestHash(x,rootY)*0x7fffffff),
   });
  }
 }
 return tufts;
}

export function wildWheatProps(design,bounds){
 if(!design.wildLands||design.activeRoom)return [];
 let props=cropByDesign.get(design);
 if(!props){props=WILD_WHEAT_FIELDS.flatMap(plantField);cropByDesign.set(design,props);}
 // Supply whole fringe chunks to the grass worker as the camera approaches.
 // Bringing in only the visible roots would invalidate their buffers on pan.
 const lookahead=384;
 return props.filter(p=>p.x>bounds.left-lookahead&&p.x<bounds.right+lookahead&&p.rootY>bounds.top-lookahead&&p.rootY<bounds.bottom+lookahead);
}
