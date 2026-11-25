import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {drawPortalFlash} from './portal-transition.mjs';
import {QUIDDITCH_TEAMS} from './quidditch-layout.mjs';
import {quidditchCheckPrompt,quidditchTeam} from './quidditch-match.mjs';
import {quidditchCoachActor,quidditchScenePrompt,quidditchVisualActor} from './quidditch-scene.mjs';
import {drawQuidditchGround,queueQuidditchPitch,drawQuidditchBall,drawQuidditchBallShadow,drawQuidditchScoreboard,
 sampleQuidditchSnitchTrail,drawQuidditchSnitchTrail} from './quidditch-pitch-art.mjs';
import {controllerButtonNames} from './controls.mjs';
import {actionInputLabel} from './action-prompts.mjs';
import {PitchCrowd} from './quidditch-spectators.mjs';
import {drawManaWardSparkles} from './diagon-garden-ward-art.mjs';

const BALL_ACTIONS=new Set(['THROW QUAFFLE','STEAL QUAFFLE','STEAL SNITCH','CATCH SNITCH','CATCH QUAFFLE','SWAT BLUDGER']);
const ballButton=p=>p.device==='keyboard'?'X':controllerButtonNames(p.controllerFamily||'generic')[2];

function showPitchAction(g,p,action){
 if(action.startsWith('RETURN TO '))return action;
 if(action==='STEAL SNITCH'&&p.device==='keyboard')return 'F / X · '+action;
 if(action==='KNOCK QUAFFLE LOOSE')return (p.device==='keyboard'?'F':actionInputLabel(g,p,'interact'))+' · '+action;
 return (BALL_ACTIONS.has(action)?ballButton(p):actionInputLabel(g,p,'interact'))+' · '+action;
}

function drawSnitchCatchPrompt(c,camera,w,h,snitch,p){
 const sx=(snitch.x-camera.x)*camera.zoom+w/2;
 const sy=(snitch.y-(snitch.z||0)-camera.y)*camera.zoom+h/2;
 if(sx<12||sx>w-12||sy<12||sy>h-12)return false;
 c.save();
 c.font='600 13px system-ui';
 c.textAlign='center';
 const text=ballButton(p)+' · Catch Snitch',width=Math.ceil(c.measureText(text).width)+20;
 const x=Math.round(Math.max(width/2+7,Math.min(w-width/2-7,sx)));
 const y=Math.round(sy>88?sy-37:sy+26);
 c.fillStyle='#142823ea';
 c.fillRect(x-width/2,y-16,width,24);
 c.strokeStyle='#d4b676';
 c.strokeRect(x-width/2+.5,y-15.5,width-1,23);
 c.fillStyle='#fff0c9';
 c.fillText(text,x,y);
 c.restore();
 return true;
}

export function drawQuidditchScene(renderer,g,w,h,bounds){
 const c=renderer.ctx,t=g.trainTest,match=t.quidditch,world=[];
 const visible=(x,y,r=50,up=r)=>x>bounds.left-r&&x<bounds.right+r&&y>bounds.top-r&&y-up<bounds.bottom;
 const crowd=renderer.pitchCrowd??=new PitchCrowd();
 crowd.begin(match,()=>g.players.filter(p=>p.hp>0&&!p.room&&visible(p.x,p.y-(p.jumpHeight||0),0,0)));
 drawQuidditchGround(c,bounds);
 renderer.drawWorldLoot(g,w,h);
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
   const tail=sampleQuidditchSnitchTrail(match.snitch,match.time);
   if(tail.length>1)world.push({
    depth:match.snitch.y-(match.snitch.z||0)*.17,
    paint:()=>drawQuidditchSnitchTrail(c,tail,match.time,visible),
   });
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
 const actions=local.filter(p=>p.hp>0&&!p.ui&&!p.room).map(player=>({
  player,action:quidditchScenePrompt(g,player),check:match?quidditchCheckPrompt(match,player,g.players):'',
 }));
 const catcher=actions.find(entry=>entry.action==='CATCH SNITCH');
 const floatingCatch=catcher&&drawSnitchCatchPrompt(c,renderer.camera,w,h,match.snitch,catcher.player);
 const hints=actions.find(entry=>entry.check||entry.action&&!(floatingCatch&&entry===catcher));
 if(hints){
  const {player,action,check}=hints,prompts=[];
  if(action&&!(floatingCatch&&hints===catcher))prompts.push(showPitchAction(g,player,action));
  if(check)prompts.push(showPitchAction(g,player,check));
  c.save();c.textAlign='center';c.font='600 13px system-ui';
  c.strokeStyle='#142823';c.lineWidth=4;c.fillStyle='#e9e0bd';
  for(const [index,prompt] of prompts.entries()){
   const y=h-34-(prompts.length-1-index)*17;
   c.strokeText(prompt,w/2,y);c.fillText(prompt,w/2,y);
  }
  c.restore();
 }
 const viewer=local.find(p=>!p.ui&&p.broomMount);
 if(viewer&&w>=350){
  const keyboard=viewer.device==='keyboard',buttons=controllerButtonNames(viewer.controllerFamily||'generic');
  const dash=actionInputLabel(g,viewer,'dodge');
  const help=keyboard?'X play ball · J rise · K descend · '+dash+' dash · C dismount':buttons[2]+' play ball · '+actionInputLabel(g,viewer,'jump')+' rise · D-pad ↓ descend · '+dash+' dash · '+actionInputLabel(g,viewer,'loot')+' dismount';
  c.save();c.textAlign='center';c.font='11px system-ui';c.strokeStyle='#162722';c.lineWidth=3;
  c.strokeText(help,w/2,h-16);c.fillStyle='#e5ddbd';c.fillText(help,w/2,h-16);c.restore();
 }
 drawPortalFlash(c,g,w,h,renderer.cameraOwnerIds);
}
