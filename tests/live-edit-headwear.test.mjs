import assert from 'node:assert/strict';
import test from 'node:test';
import {applyHeadwear,beginHeadwearFrame,DEFAULT_HEADWEAR_FIT,headwearDrawSubject,headwearFor,headwearTargets,
  HEADWEAR_FACINGS,recordHeadwearTarget,renderedHeadwearFit,setHeadwearPicking,setHeadwearPreview} from '../src/live-edit-headwear.mjs';
import {Animator} from '../src/animation.mjs';
import {defaultNativePlayerMotion,DIRECTIONS,drawPlayer,playerHeadwearFacing,playerHeadwearPickingBounds} from '../src/player-motion.mjs';
import {Renderer} from '../src/render.mjs';

const explorer = (id,profileId='cypress')=>({id,profileId,name:'Cypress',x:250,y:300,hp:100,
  sprite:'explorer-teal',equipment:{head:'witch_hat'},faceX:0,faceY:1,animationAction:'idle',playerFrame:0});

test('Headwear edits can replay for a matching profile before the explorer spawns',()=>{
  assert.doesNotThrow(()=>setHeadwearPicking(null,false));
  const actor=explorer(1), other=explorer(2,'river'), game={seed:24,players:[actor,other]};
  const target=headwearTargets(game,{x:250,y:276})[0];
  assert.equal(target.category,'characters');
  const hat=headwearFor(game,target.id);
  assert.equal(hat.direction,'S');
  assert.deepEqual(HEADWEAR_FACINGS,DIRECTIONS);
  assert.deepEqual(hat.values,DEFAULT_HEADWEAR_FIT);
  const fit={x:11,y:-4,scale:1.5,rotation:18};
  assert.equal(applyHeadwear(game,hat.baseKey,fit),true);
  assert.equal(headwearDrawSubject(game,actor).key,hat.baseKey);
  assert.equal(headwearDrawSubject(game,other),null);
  assert.deepEqual(renderedHeadwearFit(game,hat.baseKey,0),fit);
  assert.deepEqual(headwearFor(game,target.id).values,fit);
  const next={seed:50,players:[]};
  assert.equal(applyHeadwear(next,hat.baseKey,fit),true);
  next.players.push(explorer(5));
  assert.deepEqual(headwearFor(next,'player:5').values,fit);
  assert.equal(applyHeadwear(game,hat.baseKey,null),true);
  assert.deepEqual(headwearFor(game,target.id).values,DEFAULT_HEADWEAR_FIT);
  assert.equal(applyHeadwear(game,'["profile","cypress","stone"]',fit),false);
  actor.field={cosmetics:{head:'witch_hat_plum'}};
  assert.equal(headwearFor(game,target.id).itemId,'witch_hat_plum');
  actor.field.cosmetics.hideHelmet=true;
  assert.equal(headwearFor(game,target.id),null);
});

test('Independent directions can override and restore their legacy all-facing fit',()=>{
  const actor=explorer(1), game={players:[actor]}, id='player:1';
  const west=headwearFor(game,id,'W'),east=headwearFor(game,id,'E');
  assert.deepEqual(JSON.parse(west.key),['profile','cypress','witch_hat','W']);
  const base={...DEFAULT_HEADWEAR_FIT,x:3},left={...base,x:5},right={...base,y:8};
  assert.equal(applyHeadwear(game,west.baseKey,base),true);
  assert.equal(applyHeadwear(game,west.key,left),true);
  assert.equal(applyHeadwear(game,east.key,right),true);
  assert.deepEqual(headwearFor(game,id,'W').values,left);
  assert.deepEqual(headwearFor(game,id,'E').values,right);
  assert.deepEqual(headwearFor(game,id,'NE').values,base);
  assert.equal(headwearFor(game,id,'NE').savedValues,null);
  assert.deepEqual(headwearFor(game,id,'all').savedValues,base);
  assert.equal(applyHeadwear(game,west.key,null),true);
  assert.deepEqual(headwearFor(game,id,'W').values,base);
  assert.equal(applyHeadwear(game,east.key,DEFAULT_HEADWEAR_FIT),true);
  assert.deepEqual(headwearFor(game,id,'E').savedValues,DEFAULT_HEADWEAR_FIT);
  assert.deepEqual(headwearFor(game,id,'E').values,DEFAULT_HEADWEAR_FIT);
  assert.equal(applyHeadwear(game,'["profile","cypress","witch_hat","F"]',base),false);
  const replacement={players:[]};
  assert.equal(applyHeadwear(replacement,east.key,right),true);
  assert.equal(applyHeadwear(replacement,west.baseKey,base),true);
  replacement.players.push(explorer(30));
  assert.deepEqual(headwearFor(replacement,'player:30','E').values,right);
  assert.deepEqual(headwearFor(replacement,'player:30','N').values,base);
});

test('Selection uses the live pose and can select a rendered NPC wearing a hat',()=>{
  const actor=explorer(1), game={seed:24,players:[actor]}, model=defaultNativePlayerMotion();
  const resident={...explorer('tailor'),name:'Tailor',profileId:undefined,x:320,y:180};
  setHeadwearPicking(game,true);
  beginHeadwearFrame(game);
  const subject=headwearDrawSubject(game,resident);
  const {bounds,hatBounds}=playerHeadwearPickingBounds(resident,0,43,model,subject.itemId);
  recordHeadwearTarget(game,subject,bounds,hatBounds,playerHeadwearFacing(resident,model));
  const point={x:hatBounds.x+hatBounds.width/2,y:hatBounds.y+hatBounds.height/2};
  assert.deepEqual(headwearTargets(game,point).map(target=>target.label),['Tailor']);
  assert.deepEqual(headwearFor(game,subject.id).bounds,hatBounds);
  assert.equal(headwearTargets(game,{x:actor.x,y:actor.y-20}).length,0);
  beginHeadwearFrame(game);
  assert.equal(headwearFor(game,subject.id),null);
});

test('Animator resolves the live head pose and pins only a render copy in compass preview',()=>{
  const actor={...explorer(1),locomotionVisualDirection:0,locomotionHeadDirection:5.51};
  const second=explorer(2,'river'),game={players:[actor,second]},id='player:1';
  const initial={...actor}, south={...DEFAULT_HEADWEAR_FIT,x:2}, east={...DEFAULT_HEADWEAR_FIT,x:15},west={...DEFAULT_HEADWEAR_FIT,y:8};
  for(const [direction,values] of [['S',south],['E',east],['W',west]])applyHeadwear(game,headwearFor(game,id,direction).key,values);
  setHeadwearPicking(game,true);
  const paintedActors=[];
  const collect=(ctx,actor)=>paintedActors.push(actor);
  const renderer={liveHeadwearGame:game,drawActor:collect,drawCutoutCharacter:collect};
  const draw=(actor,time)=>Animator.prototype.draw.call(renderer,{globalAlpha:1},actor,time,43);
  beginHeadwearFrame(game);
  draw(actor,1);
  assert.equal(headwearFor(game,id).direction,'E');
  assert.deepEqual(paintedActors.at(-1).liveHeadwearFit,east);
  assert.equal(setHeadwearPreview(game,id,'W'),true);
  assert.equal(headwearFor(game,id).direction,'W');
  draw(actor,1.1);
  assert.deepEqual(paintedActors.at(-1).liveHeadwearFit,west);
  assert.equal(paintedActors.at(-1).faceX,-1);
  assert.deepEqual(actor,initial);
  draw(second,1.1);
  assert.equal(paintedActors.at(-1).liveHeadwearPreviewView,undefined);
  assert.equal(setHeadwearPreview(game,id,null),true);
  beginHeadwearFrame(game);
  draw(actor,1.2);
  assert.equal(headwearFor(game,id).direction,'E');
  assert.deepEqual(paintedActors.at(-1).liveHeadwearFit,east);
  assert.equal(setHeadwearPreview(game,id,'W'),true);
  setHeadwearPicking(game,false);
  draw(actor,1.3);
  assert.equal(paintedActors.at(-1).liveHeadwearPreviewView,undefined);
  assert.deepEqual(paintedActors.at(-1).liveHeadwearFit,east);
});

function painted(actor,model) {
  const pixels=[], stack=[];
  let matrix=[1,0,0,1,0,0];
  const transform=(a,b,c,d,e,f)=>{
    const [u,v,w,x,y,z]=matrix;
    matrix=[u*a+w*b,v*a+x*b,u*c+w*d,v*c+x*d,u*e+w*f+y,v*e+x*f+z];
  };
  const context={fillStyle:'',fillRect(x,y,w,h){
    const [a,b,c,d,e,f]=matrix;
    pixels.push({x:a*x+c*y+e,y:b*x+d*y+f,w,h,color:this.fillStyle});
  },save(){stack.push(matrix.slice());},restore(){matrix=stack.pop();},
  translate(x,y){transform(1,0,0,1,x,y);},scale(x,y){transform(x,0,0,y,0,0);},
  rotate(angle){const c=Math.cos(angle),s=Math.sin(angle);transform(c,s,-s,c,0,0);}};
  drawPlayer(context,actor,0,model);
  assert.equal(stack.length,0);
  return pixels;
}

test('Fitting articulated headwear changes the hat without moving unrelated layers',()=>{
  const actor=explorer(1), model=defaultNativePlayerMotion();
  const move={...DEFAULT_HEADWEAR_FIT,x:12};
  const native=painted(actor,model), fitted=painted({...actor,liveHeadwearFit:move},model);
  assert.notDeepEqual(native,fitted);
  assert.deepEqual(fitted.filter(pixel=>pixel.y>-10),native.filter(pixel=>pixel.y>-10));
  const customColor='#f102be';
  const pixels=Array(256).fill(null);
  pixels[8+8*16]=customColor;
  model.wearables={...model.wearables,witch_hat:{0:{x:3,y:-1,scale:1,rotation:0,pixels}}};
  const before=painted(actor,model).find(pixel=>pixel.color===customColor);
  const after=painted({...actor,liveHeadwearFit:move},model).find(pixel=>pixel.color===customColor);
  assert.ok(before&&after);
  assert.equal(after.x-before.x,12);
  assert.equal(after.y,before.y);
  assert.equal(model.wearables.witch_hat[0].x,3);
});

test('Isolated worn art follows the same fit and keeps the native head underneath',()=>{
  const color='#fa05cd';
  const sprite={itemOnly:true,bone:'head',x:2,y:-10,width:1,height:1,palette:['transparent',color],pixels:[1]};
  const actor={...explorer(1),locomotionHeadDirection:2,itemArtItems:{witch_hat:{wornArt:{2:{'Head and headwear':sprite}}}}};
  const model=defaultNativePlayerMotion();
  assert.equal(painted({...actor,locomotionHeadDirection:0},model).some(pixel=>pixel.color===color),false);
  const before=painted(actor,model);
  const after=painted({...actor,liveHeadwearFit:{...DEFAULT_HEADWEAR_FIT,y:-7}},model);
  assert.equal(after.find(pixel=>pixel.color===color).y,before.find(pixel=>pixel.color===color).y-7);
  assert.deepEqual(after.filter(pixel=>pixel.color!==color),before.filter(pixel=>pixel.color!==color));
});

test('World markers round trip to client coordinates in shared and split cameras',()=>{
  const renderer={canvas:{getBoundingClientRect:()=>({left:12,top:24,width:900,height:500})},
    viewport:{w:1800,h:1000},camera:{x:300,y:400,zoom:2}};
  const roundTrip=(x,y)=>{
    const world=Renderer.prototype.screenToWorld.call(renderer,x,y);
    assert.deepEqual(Renderer.prototype.worldToClient.call(renderer,world,{x,y}),{x,y});
  };
  roundTrip(320,410);
  renderer.splitViews=[{x:900,y:0,w:900,h:1000,camera:{x:915,y:1200,zoom:1.5},
    poly:[{x:900,y:0},{x:1800,y:0},{x:1800,y:1000},{x:900,y:1000}]}];
  roundTrip(687,274);
});
