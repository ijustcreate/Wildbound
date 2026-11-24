// REVIEW ONLY. Authored polygons on the realm editor's 64px grid, no image input.
// Ground anchor (32,61); upper-left light; broad planes like native beach rocks.
const stone=['#344740','#59675f','#899087','#bbc0a1'];
const crystal=['#24434b','#397e8b','#7cc8c6','#c7f3e1'];
export const CAVERN_SAMPLE_SHAPES={
 limestone_shelf:[
  [0,[[7,56],[9,43],[17,32],[36,29],[48,35],[56,48],[55,59],[39,62],[16,61]]],
  [1,[[9,54],[12,43],[31,44],[48,39],[53,49],[52,57],[38,60],[16,58]]],
  [2,[[12,43],[19,34],[36,32],[46,36],[48,40],[31,46],[19,45]]],
  [3,[[19,34],[35,32],[41,34],[29,36],[18,38]]],
  [2,[[13,47],[20,48],[19,56],[12,54]]],
  [0,[[34,35],[32,42],[35,46],[35,55],[33,54],[33,47],[30,43],[32,36]]],
  [2,[[37,55],[49,53],[49,55],[39,57]]]
 ],
 cave_crystal:[
  [0,[[12,56],[16,44],[27,39],[40,43],[51,53],[49,60],[18,61]]],
  [1,[[15,55],[19,46],[29,43],[40,47],[47,55],[45,58],[20,58]]],
  [2,[[19,46],[27,41],[35,44],[27,49],[17,50]]],
  [4,[[24,52],[20,26],[27,17],[35,25],[36,48],[45,30],[51,33],[48,53],[39,58],[28,57]]],
  [6,[[23,27],[27,21],[29,27],[30,50],[26,51]]],
  [5,[[29,27],[33,26],[34,48],[31,52]]],
  [7,[[23,27],[27,21],[28,24],[25,29]]],
  [6,[[37,51],[45,34],[47,35],[43,52],[38,55]]],
  [5,[[47,35],[49,35],[46,51],[43,54]]],
  [1,[[23,53],[29,51],[34,55],[40,54],[43,58],[24,59]]],
  [2,[[23,53],[29,51],[33,54],[27,55]]]
 ]
};
export function makeCavernNativeSample(kind){
 const shapes=CAVERN_SAMPLE_SHAPES[kind];if(!shapes)throw Error('Unknown sample '+kind);
 const s={width:64,height:64,palette:['transparent',...stone,...crystal],pixels:Array(4096).fill(0),footprint:Array(4096).fill(0),occludes:false};
 for(const [color,points]of shapes)for(let y=0;y<64;y++){
  const hits=[];for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5))hits.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }hits.sort((a,b)=>a-b);for(let i=0;i<hits.length;i+=2)for(let x=Math.max(0,Math.ceil(hits[i]));x<Math.min(64,hits[i+1]);x++)s.pixels[y*64+x]=color+1;
 }
 // Editable ground-contact mask; tall crystal pixels do not become floor area.
 for(let y=54;y<62;y++)for(let x=12;x<53;x++)if(s.pixels[y*64+x])s.footprint[y*64+x]=1;
 return s;
}
