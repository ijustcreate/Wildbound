import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {drawPortalFlash} from './portal-transition.mjs';
import {QUIDDITCH_TEAMS} from './quidditch-layout.mjs';
import {quidditchTeam} from './quidditch-match.mjs';
import {quidditchCoachActor,quidditchScenePrompt,quidditchVisualActor} from './quidditch-scene.mjs';
import {drawQuidditchGround,queueQuidditchPitch,drawQuidditchBall,drawQuidditchBallShadow,drawQuidditchScoreboard} from './quidditch-pitch-art.mjs';
import {controllerButtonNames} from './controls.mjs';
import {PitchCrowd} from './quidditch-spectators.mjs';
import {drawManaWardSparkles} from './diagon-garden-ward-art.mjs';

const BALL_ACTIONS=new Set(['THROW QUAFFLE','STEAL QUAFFLE','CATCH SNITCH','CATCH QUAFFLE','SWAT BLUDGER']);

export function drawQuidditchScene(renderer,g,w,h,bounds){
 const c=renderer.ctx,t=g.trainTest,match=t.quidditch,world=[];
 const visible=(x,y,r=50,up=r)=>x>bounds.left-r&&x<bounds.right+r&&y>bounds.top-r&&y-up<bounds.bottom;
 const crowd=renderer.pitchCrowd??=new PitchCrowd();
 crowd.begin(match,()=>g.players.filter(p=>p.hp>0&&!p.room&&visible(p.x,p.y-(p.jumpHeight||0),0,0)));
 drawQuidditchGround(c,bounds);
 queueQuidditchPitch(c,match,t.time,visible,world,crowd,bounds);
 const coach=quidditchCoachActor();
 if(visible(coach.x,coach.y,40,65))world.push({depth:coach.y,paint:()=>renderer.animator.draw(c,coach,g.time,PLAYER_RENDER_SIZE)});
 if(match){
  const riders=[...g.players,...match.ai];
  for(const p of riders){
   if(!visible(p.x,p.y,50,(p.jumpHeight||0)+75))continue;
   const team=QUIDDITCH_TEAMS[quidditchTeam(match,p)],z=p.jumpHeight||0;
   const actor=p.quidditchAI?{...p,kind:'player',sprite:'player',equipment:{},
    appearance:{...DEFAULT_APPEARANCE,skin:p.role==='keeper'?'#c49a78':'#a4775e',shirt:team?.dark,pants:'#374342'}}:p;
   if(team){
    c.globalAlpha=.53;c.fillStyle=team.color;c.fillRect(Math.round(p.x)-9,Math.round(p.y)+4,18,2);c.globalAlpha=1;
   }
   world.push({depth:p.y-z*.17,paint:()=>{
    renderer.animator.draw(c,quidditchVisualActor(actor),g.time,PLAYER_RENDER_SIZE);
    drawManaWardSparkles(c,p,g.time);
   }});
  }
  if(match.phase==='playing'){
   const balls=[...match.bludgers.map(ball=>['bludger',ball])];
   if(!match.quaffle.resetAt)balls.push(['quaffle',match.quaffle]);
   balls.push(['snitch',match.snitch]);
   for(const [kind,ball] of balls){
    if(!visible(ball.x,ball.y,22,(ball.z||0)+24))continue;
    drawQuidditchBallShadow(c,kind,ball);
    world.push({depth:ball.y-(ball.z||0)*.17+.8,paint:()=>drawQuidditchBall(c,kind,ball,t.time)});
   }
  }
 }
 for(const item of world.sort((a,b)=>a.depth-b.depth))item.paint();
 c.restore();
 drawQuidditchScoreboard(c,match,w,h);
 const local=g.players.filter(p=>!renderer.cameraOwnerIds?.length||renderer.cameraOwnerIds.includes(p.id));
 const player=local.find(p=>!p.ui&&quidditchScenePrompt(g,p));
 if(player){
  const keyboard=player.device==='keyboard',buttons=controllerButtonNames(player.controllerFamily||'generic');
  const action=quidditchScenePrompt(g,player),ball=BALL_ACTIONS.has(action);
  const button=ball?(keyboard?'X':buttons[2]):keyboard?'E':buttons[3];
  const prompt=action.startsWith('RETURN TO ')?action:button+' · '+action;
  c.save();c.textAlign='center';c.font='600 13px system-ui';
  c.strokeStyle='#142823';c.lineWidth=4;c.strokeText(prompt,w/2,h-34);c.fillStyle='#e9e0bd';c.fillText(prompt,w/2,h-34);c.restore();
 }
 const viewer=local.find(p=>!p.ui&&p.broomMount);
 if(viewer&&w>=350){
  const keyboard=viewer.device==='keyboard',buttons=controllerButtonNames(viewer.controllerFamily||'generic');
  const help=keyboard?'X play ball · J rise · Space descend · C dismount':buttons[2]+' play ball · '+buttons[0]+' rise · '+buttons[7]+' descend · '+buttons[1]+' dismount';
  c.save();c.textAlign='center';c.font='11px system-ui';c.strokeStyle='#162722';c.lineWidth=3;
  c.strokeText(help,w/2,h-16);c.fillStyle='#e5ddbd';c.fillText(help,w/2,h-16);c.restore();
 }
 drawPortalFlash(c,g,w,h,renderer.cameraOwnerIds);
}
