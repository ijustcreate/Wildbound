import {sampleTrainRoute,railElevation,railwayWater} from './train-track.mjs';
import {wildLandsGround,wildHash} from './wild-lands-world.mjs';
const colors={forest:['#526743','#677152','#8a8b72'],jungle:['#465f40','#5d6b48','#7c8264'],ice:['#b1c4c2','#8fa9af','#dae0cd'],beach:['#a59471','#b9a67d','#d2bd8d'],swamp:['#45584a','#5f6851','#858772'],graveyard:['#414e48','#616956','#8a8971'],house:['#586b43','#797b5c','#a29474']};
export function drawTrackShoulder(c,d,route,bounds){
 for(let s=0;s<route.length;s+=12){const q=sampleTrainRoute(route,s);if(q.x<bounds.left-90||q.x>bounds.right+90||q.y<bounds.top-90||q.y>bounds.bottom+90||railwayWater(d,q.x,q.y)||railElevation(d,q)>2)continue;const pal=colors[d.wildLands?wildLandsGround(d,q.x,q.y):'forest']||colors.forest;for(const side of[-1,1])for(let j=0;j<3;j++){const n=wildHash(Math.floor(s/12)+j,side+7),distance=side*(d.gauge/2+11+j*5),x=q.x-Math.sin(q.a)*distance,y=q.y+Math.cos(q.a)*distance;c.fillStyle=pal[j===2?0:1];c.fillRect(Math.round((x-5)/3)*3,Math.round((y-4)/3)*3,6+Math.floor(n*3)*3,3+Math.floor(n*2)*3);if(j<2&&n>.4){c.fillStyle=pal[2];c.fillRect(Math.round(x/3)*3,Math.round(y/3)*3,3,3);}}}
}
