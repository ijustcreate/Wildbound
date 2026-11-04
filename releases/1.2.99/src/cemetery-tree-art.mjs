// Root-registered native scenery. Broad masses and sparse moonlit edges keep
// the winding lane legible; no new colliders, canopy sprites or saved data.
const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function stroke(c,a,b,width,color){
 const n=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))/2));
 for(let i=0;i<=n;i++)pixel(c,a[0]+(b[0]-a[0])*i/n-width/2,a[1]+(b[1]-a[1])*i/n-width/2,width,width,color);
}
export function drawCemeteryTree(c,p,forest=false){
 const h=p.size||120,v=((p.variant||0)%5+5)%5,lean=[-.12,.18,-.06,.11,-.2][v],flip=v%2?-1:1;
 const root=[0,0],hip=[lean*h*.25,-h*.23],elbow=[lean*h*1.4,-h*.50],neck=[lean*h*.7,-h*.73],tip=[(lean+.09*flip)*h,-h];
 const trunk=[root,hip,elbow,neck,tip],widths=[17,14,10,5];
 pixel(c,-23,-1,46,5,'#111e29');
 // Roots merge into the same trunk mass instead of a straight pole and spokes.
 for(const side of [-1,1]){
  const toe=[side*(27+v*2),4],knuckle=[side*12,-7];
  stroke(c,hip,knuckle,10,'#141e28');stroke(c,knuckle,toe,6,'#141e28');
  stroke(c,[knuckle[0]-1,knuckle[1]],[toe[0]-3,toe[1]-2],2,'#293744');
 }
 for(let i=0;i<4;i++)stroke(c,trunk[i],trunk[i+1],widths[i],'#131d27');
 // Two crooked reaching arms, each with one hooked fork and sparse twigs.
 for(const side of [-1,1]){
  const joint=side===flip?elbow:neck;
  const shoulder=[joint[0]+side*h*.16,joint[1]+h*.02];
  const wrist=[side*h*(.36+v*.015),-h*(.70+(v%3)*.035)];
  const claw=[wrist[0]+side*h*.11,wrist[1]-h*.18];
  stroke(c,joint,shoulder,8,'#141f29');stroke(c,shoulder,wrist,6,'#141f29');stroke(c,wrist,claw,3,'#141f29');
  const fork=[wrist[0]-side*h*.025,wrist[1]-h*.18];
  stroke(c,wrist,fork,3,'#141f29');stroke(c,fork,[fork[0]-side*h*.065,fork[1]-h*.08],2,'#141f29');
  const twig=[shoulder[0]+side*h*.035,shoulder[1]-h*.14];
  stroke(c,shoulder,twig,3,'#182430');stroke(c,twig,[twig[0]-side*h*.07,twig[1]-h*.08],2,'#182430');
  // Selective cool rim on the upper face; the shadow side remains one mass.
  stroke(c,[shoulder[0],shoulder[1]-2],[wrist[0]-side*2,wrist[1]-2],2,'#2c3d4e');
 }
 for(let i=0;i<3;i++)stroke(c,[trunk[i][0]-3,trunk[i][1]-3],[trunk[i+1][0]-3,trunk[i+1][1]],Math.max(2,5-i),'#293744');
 stroke(c,[hip[0]-3,hip[1]],[elbow[0]-3,elbow[1]+5],2,'#394a57');
 // Distinct silhouettes survive: narrow broken pine, low weeping willow, bare
 // oak/birch/deadwood. Never cover the upper fork in a green block canopy.
 if(forest&&p.treeType==='pine')for(let n=0;n<3;n++){
  const y=-h*(.55+n*.13),w=h*(.30-n*.06);
  pixel(c,-w*.5+lean*h,y,w,5,'#162831');pixel(c,-w*.25+lean*h,y-2,w*.55,3,'#243a44');
 }
 if(forest&&p.treeType==='willow')for(const side of [-1,1]){
  const x=side*h*.34;stroke(c,[x,-h*.70],[x+side*4,-h*.44],2,'#263a43');
 }
 pixel(c,-8,-8,7,4,'#263c40');pixel(c,-12,-2,11,3,'#30464a');
 if(v===2){pixel(c,elbow[0]-2,elbow[1]+3,4,7,'#0b141e');pixel(c,elbow[0]-3,elbow[1]+3,1,4,'#41515a');}
}
