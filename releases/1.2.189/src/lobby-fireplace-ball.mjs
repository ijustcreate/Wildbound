import {LOBBY_FLOOR} from './lobby-geometry.mjs';

export const LOBBY_FIREPLACE_GOAL=Object.freeze({x:226,y:113,halfWidth:24});
export const LOBBY_BALL_SPAWN=Object.freeze({x:226,y:270});
export const LOBBY_BALL_RADIUS=8;

const KICK_RANGE=38;
const KICK_SPEED=392;
const ROLL_DRAG=1.32;
const REBOUND=.68;
const MAX_PHYSICS_STEP=.01;
const GOAL_RECOVERY=.9;

function outsideFloor(x,y,r){
  const {left,top,right,bottom}=LOBBY_FLOOR;
  return x-r<left||x+r>right||y-r<top||y+r>bottom;
}

export class LobbyFireplaceBall {
  constructor(){
    this.goals=0;
    this.resetBall();
  }

  resetBall(){
    Object.assign(this,LOBBY_BALL_SPAWN,{vx:0,vy:0,roll:0,goalTime:0,scorer:null,lastKicker:null});
  }

  canKick(actor){
    if(!actor||this.goalTime>0||actor.jumpHeight>0||actor.groundHeight>0||actor.wingHover)return false;
    const dx=this.x-actor.x,dy=this.y-actor.y;
    const distance=Math.hypot(dx,dy);
    if(distance<2)return true;
    const facingLength=Math.hypot(actor.faceX,actor.faceY);
    return distance<=KICK_RANGE&&dx*actor.faceX+dy*actor.faceY>=distance*facingLength*.25&&facingLength>0;
  }

  kick(actor){
    if(!this.canKick(actor))return false;
    let dx=this.x-actor.x,dy=this.y-actor.y;
    if(Math.hypot(dx,dy)<2){
      dx=actor.faceX||0;
      dy=actor.faceY||0;
      if(!dx&&!dy)dy=-1;
    }

    const goal=LOBBY_FIREPLACE_GOAL;
    if(dy<0&&this.y>goal.y){
      const projectedX=this.x+(goal.y-this.y)*dx/dy;
      const offset=projectedX-goal.x;
      if(Math.abs(offset)<=goal.halfWidth+16){
        const inside=goal.halfWidth-LOBBY_BALL_RADIUS;
        dx=goal.x+Math.min(inside,Math.max(-inside,offset))-this.x;
        dy=goal.y-this.y;
      }
    }

    const scale=KICK_SPEED/Math.hypot(dx,dy);
    this.vx=dx*scale;
    this.vy=dy*scale;
    this.lastKicker=actor.id;
    return true;
  }

  step(dt,blocked=outsideFloor){
    if(dt<=0)return null;
    if(this.goalTime>0){
      this.goalTime-=dt;
      if(this.goalTime<=0)this.resetBall();
      return null;
    }
    if(!this.vx&&!this.vy)return null;

    const goal=LOBBY_FIREPLACE_GOAL;
    const r=LOBBY_BALL_RADIUS;
    const steps=Math.ceil(dt/MAX_PHYSICS_STEP);
    const stepTime=dt/steps;
    const drag=Math.exp(-ROLL_DRAG*stepTime);
    for(let i=0;i<steps;i++){
      const nextX=this.x+this.vx*stepTime;
      const nextY=this.y+this.vy*stepTime;
      if(this.y>=goal.y&&nextY<goal.y){
        const crossing=(this.y-goal.y)/(this.y-nextY);
        const goalX=this.x+(nextX-this.x)*crossing;
        if(Math.abs(goalX-goal.x)<=goal.halfWidth){
          this.x=goalX;
          this.y=goal.y;
          this.vx=0;
          this.vy=0;
          this.goalTime=GOAL_RECOVERY;
          this.scorer=this.lastKicker;
          this.goals++;
          return this.scorer;
        }
      }

      const beforeX=this.x,beforeY=this.y;
      if(blocked(nextX,this.y,r))this.vx*=-REBOUND;
      else this.x=nextX;
      if(blocked(this.x,nextY,r))this.vy*=-REBOUND;
      else this.y=nextY;
      this.roll+=Math.hypot(this.x-beforeX,this.y-beforeY)/r;
      this.vx*=drag;
      this.vy*=drag;
    }
    if(Math.hypot(this.vx,this.vy)<9){
      this.vx=0;
      this.vy=0;
    }
    return null;
  }
}
