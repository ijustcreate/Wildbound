// Skull-relative cutout shared by the fitted hood, hair, and face lining.
export function hoodOpening(d){
 const view=Math.min(d,8-d),flip=d>4?-1:1;
 if(view>=3)return [];
 const points=view===2?[[-7,-4],[-3,-5],[0,-3],[0,2],[-3,4],[-6,3],[-7,0]]:view===1?[[-6,-4],[-3,-6],[0,-5],[2,-3],[2,2],[-1,4],[-5,3],[-6,0]]:[[-5,-3],[-4,-5],[-2,-5],[0,-4],[2,-5],[4,-4],[5,-2],[4,2],[2,4],[-2,4],[-5,2]];
 return points.map(([x,y])=>[x*flip,y]);
}
