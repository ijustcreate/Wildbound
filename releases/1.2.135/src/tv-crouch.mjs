// Opt-in pose shaping for the side-view TV game; ordinary Wildbound actors never set this flag.
export function applyTvCrouch(pose,actor,time){
 const blend=Math.max(0,Math.min(1,Number(actor.tvCrouch)||0));if(!blend)return pose;
 const phase=(actor.step||time*4),moving=!!actor.moving,bob=moving?Math.abs(Math.sin(phase))*.7:0;
 for(const [name,v]of Object.entries(pose)){
  if(/^foot/.test(name))continue;
  if(/^knee/.test(name)){v[1]+=(name.endsWith('L')?5:7)*blend;v[2]-=Math.min(v[2]-3,8)*blend;continue;}
  v[2]-=(11+bob)*blend;
  if(!/^hip|pelvis/.test(name))v[1]+=2*blend;
 }
 if(moving)for(const [name,offset]of [['footL',0],['footR',Math.PI]])if(pose[name]){
  const s=Math.sin(phase+offset);pose[name][1]+=s*2*blend;pose[name][2]=Math.max(0,pose[name][2]*.25+Math.max(0,s)*1.1*blend);
 }
 return pose;
}
export function canTvPlayerStand(p,solids){return !solids.some(s=>!s.oneWay&&p.x+12>s.x+.5&&p.x-12<s.x+s.w-.5&&p.y>s.y+.5&&p.y-58<s.y+s.h-.5);}
export function updateTvCrouch(p,input,solids,dt){
 const wants=!!input.down&&p.grounded&&!p.dashing;
 p.crouching=wants||!!p.crouching&&!canTvPlayerStand(p,solids);p.bodyHeight=p.crouching?34:58;
 const target=p.crouching?1:0;p.crouchBlend=(p.crouchBlend||0)+(target-(p.crouchBlend||0))*Math.min(1,dt*18);
 if(Math.abs(p.crouchBlend-target)<.01)p.crouchBlend=target;
}
