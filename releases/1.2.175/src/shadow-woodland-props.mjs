// Native woodland brush: same logical pixels, shading clusters and breeze as forest props.
import {paintForestAsset,drawForestAsset} from './forest-props.mjs';
export const SHADOW_WOODLAND_ASSETS=Object.freeze({
 thorn_fan:'forest_round_shrub_large',witch_fern:'forest_meadow_tuft',shadow_bloom:'forest_woodland_daisy',
 echo_fungus:'forest_fly_agaric_patch',mooncap_cluster:'forest_porcini_trio',
 veil_stone:'forest_limestone_boulder',underworld_rubble:'forest_moss_rock_cluster'
});
const poses=new WeakMap();
export function drawShadowWoodlandProp(c,p,y,time,g,library,resourceScale=1){
 const id=SHADOW_WOODLAND_ASSETS[p.kind];if(!id||library?.[p.kind]&&!library[p.kind].nativeShadowPlant)return false;
 let pose=poses.get(p);if(!pose){pose={};poses.set(p,pose);}
 const rustle=(g.players||[]).some(a=>a.hp>0&&!a.room&&a.moving&&!(a.jumpHeight>6)&&Math.hypot(a.x-p.x,a.y-y)<30);
 Object.assign(pose,p,{forestAsset:id,rootY:y,size:p.size*resourceScale,realmPalette:'shadow',plantBend:rustle?Math.sin(time*16)*.08:0});
 return drawForestAsset(c,pose,time,g);
}
export function paintShadowWoodlandProp(kind,{s,r}){
 const id=SHADOW_WOODLAND_ASSETS[kind];if(!id)return false;
 let x=0,y=6;const stack=[];const c={fillStyle:'#29233e',save(){stack.push([x,y]);},restore(){[x,y]=stack.pop();},translate(dx,dy){x+=dx;y+=dy;},fillRect(dx,dy,w,h){r(x+dx,y+dy,w,h,this.fillStyle);}};
 paintForestAsset(c,id,0,{shadow:true});s.nativeShadowPlant=true;return true;
}

// Structural props keep their saved roles, with forest-brush roots and foliage.
export function finishShadowWoodlandProp(kind,{s,r,p}){
 const u=s.width/64,R=(x,y,w,h,c)=>r(x*u,y*u,w*u,h*u,c),P=(pts,c)=>p(pts.map(([x,y])=>[x*u,y*u]),c);
 const ink='#29233e',wood='#4a3a57',lit='#786485',pale='#a494b0';
 const patch=(id,x,y,scale)=>{
  let ox=x-32*scale,oy=y-55*scale;const stack=[];
  const c={fillStyle:ink,save(){stack.push([ox,oy]);},restore(){[ox,oy]=stack.pop();},translate(dx,dy){ox+=dx*scale;oy+=dy*scale;},fillRect(dx,dy,w,h){R(ox+dx*scale,oy+dy*scale,Math.max(1,w*scale),Math.max(1,h*scale),this.fillStyle);}};
  paintForestAsset(c,id,0,{shadow:true});
 };
 if(kind==='ashen_log'){
  s.pixels.fill(0);
  P([[5,50],[11,40],[22,41],[25,33],[30,30],[28,40],[48,43],[58,50],[59,56],[52,61],[13,59]],ink);
  P([[10,49],[15,44],[46,47],[50,52],[48,56],[15,55]],wood);P([[13,45],[44,47],[46,50],[15,49]],lit);
  P([[48,47],[53,47],[57,51],[57,56],[52,59],[48,56],[46,52]],pale);P([[50,49],[53,50],[55,53],[54,56],[51,56],[49,53]],wood);
  P([[49,51],[52,50],[54,53],[52,55],[51,53]],ink);patch('forest_round_shrub_large',25,48,.34);patch('forest_porcini_pair',16,59,.45);
 }else if(kind==='hollow_stump'){
  s.pixels.fill(0);s.occludes=true;
  P([[5,61],[13,45],[14,26],[12,20],[22,15],[30,19],[39,14],[49,20],[48,43],[59,61],[43,57],[35,61],[23,58]],ink);
  P([[13,54],[18,39],[18,25],[25,22],[31,26],[39,21],[44,25],[44,44],[51,55],[40,52],[34,56],[25,52]],wood);
  P([[18,26],[23,25],[22,43],[17,53]],lit);P([[39,25],[43,27],[42,49],[38,46]],lit);
  P([[26,52],[25,38],[29,31],[36,30],[41,36],[41,51]],ink);P([[29,49],[29,39],[32,35],[36,35],[38,40],[37,49]],'#69547d');R(32,40,3,5,'#b4a0c8');
  patch('forest_round_shrub_large',24,26,.40);patch('forest_round_shrub_large',44,25,.33);patch('forest_porcini_pair',14,58,.45);
 }else if(kind==='root_arch'){
  s.pixels.fill(0);s.occludes=true;
  P([[2,61],[8,47],[9,31],[15,17],[24,9],[33,6],[43,12],[50,24],[52,44],[62,61],[51,58],[44,40],[43,28],[37,19],[29,16],[22,22],[17,35],[16,48],[12,61]],ink);
  P([[8,56],[12,45],[13,30],[19,19],[27,13],[34,11],[40,16],[45,27],[47,43],[54,57],[48,51],[41,28],[35,21],[29,19],[22,26],[18,38],[17,49],[13,56]],wood);
  P([[11,51],[15,31],[21,20],[28,15],[32,15],[24,22],[19,34],[17,48]],lit);P([[39,18],[43,21],[46,31],[48,44],[45,40],[42,29]],lit);
  P([[11,32],[6,24],[6,20],[10,25],[14,27]],wood);P([[47,30],[55,24],[57,17],[59,22],[55,30],[49,35]],wood);
  patch('forest_round_shrub_large',25,22,.43);patch('forest_round_shrub_large',42,26,.37);patch('forest_meadow_tuft',12,59,.35);
 }else if(kind==='moonwell'||kind==='thorn_shrine'||kind==='wisp_lantern'){
  const points=kind==='moonwell'?[[14,42,.31],[49,54,.30]]:kind==='thorn_shrine'?[[18,38,.35],[46,34,.33]]:[[29,39,.29]];
  for(const [x,y,size]of points)patch('forest_round_shrub_large',x,y,size);
 }
 // Shared cool-shadow ramps; bright flames, candle wax and rare magic stay readable.
 const ramp={'#121326':'#211d32','#1b1b32':'#29233e','#373347':'#40374f','#5b516c':'#60536f','#8b7b98':'#91829f','#53657b':'#53465f','#7d8c9b':'#82718f','#352e47':'#40334f','#51435e':'#5d4b6b','#81718e':'#91829f'};
 s.palette=s.palette.map(color=>ramp[color]||color);
}
