import { VILLAGERS, VILLAGER_EVENT, villagerById } from "./villager-data.mjs";
import { villagerMotion } from "./villager-motion.mjs";
import { merchantSites } from "./traveling-merchant.mjs";
import { damageEnemy } from "./enemy-damage.mjs";
import { clearShot } from "./navigation.mjs";
import { creatures } from "./definitions.mjs";
import { snowAt } from "./ice-world.mjs";
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  ownerKey = (p) => String(p.profileId || p.id);
export { VILLAGER_EVENT };
const followers = (g) => (g.villageFollowers ||= []);
export function clearVillagerCamp(g) {
  g.villagers = [];
  g.villageFollowers = [];
  g.villageCampState = null;
  for (const p of g.players || []) {
    if (p.aprilFriend) p.aprilFriend.active = false;
    p.villageVisit = null;
    if (p.ui?.villagerId) p.ui = null;
  }
}
export function visibleVillagers(g) {
  const april = followers(g).some((a) =>
    g.players.some(
      (p) => ownerKey(p) === a.ownerKey && p.aprilFriend?.active,
    ),
  );
  return [
    ...(g.villagers || []).filter((v) => v.villagerId !== "april" || !april),
    ...followers(g).filter((a) => !a.room),
  ];
}
function actor(g, spec, position, campId) {
  return {
    id: g.nextId++,
    kind: "villager",
    sprite: "villager",
    villagerId: spec.id,
    campId,
    name: spec.name,
    title: spec.title,
    ...position,
    hp: 1,
    maxHp: 1,
    invincible: true,
    unattackable: true,
    faction: "neutral",
    faceX: 0,
    faceY: 1,
    moving: false,
    walking: true,
    equipment: { hand1: spec.sword ? "sword" : null, hand2: null },
    villagerClock: 0,
  };
}
export function spawnVillagerCamp(g) {
  if (g.villagers?.length) return g.villagers;
  const sites = merchantSites(g), specs = VILLAGERS.filter((v) => v.id !== "april");
  for(let i=specs.length-1;i>0;i--){const j=Math.floor((g.random?.()??Math.random())*(i+1));[specs[i],specs[j]]=[specs[j],specs[i]];}
  const selected=specs.slice(0,3);let positions=[];
  for(const anchor of sites){const group=[];for(const site of sites.filter(q=>distance(q,anchor)<=76)){
    if(group.every(q=>distance(q,site)>=42)&&!g.blocked(site.x,site.y,12,false,false,false,0))group.push(site);
    if(group.length===3)break;
  }if(group.length===3){positions=group;break;}}
  if(positions.length<3){g.message?.("The campers could not find a safe place for their fire.");return false;}
  const campId=`village:${g.nextId++}`,fire={x:positions.reduce((n,p)=>n+p.x,0)/3,y:positions.reduce((n,p)=>n+p.y,0)/3};
  g.villageCampState={campId,fire,camperIds:selected.map(v=>v.id),talked:[],aprilIncoming:false,aprilRecruited:false};
  g.villagers=selected.map((spec,i)=>actor(g,spec,positions[i],campId));
  g.reveal={...fire,life:5};g.message?.("Three campers have gathered around a fire. Listen to each of their stories.");g.persist?.();return g.villagers;
}
function bringAprilToCamp(g){
  const camp=g.villageCampState;if(!camp||camp.aprilIncoming||camp.aprilRecruited||camp.camperIds.some(id=>!camp.talked.includes(id)))return false;
  camp.aprilIncoming=true;camp.aprilSpawned=true;
  const side=(g.random?.()??Math.random())<.5?-1:1,target={x:camp.fire.x+side*34,y:camp.fire.y-12},spawn={x:camp.fire.x+side*260,y:camp.fire.y+24};
  const april=actor(g,villagerById("april"),spawn,camp.campId);Object.assign(april,{incoming:true,targetX:target.x,targetY:target.y,invincible:false,unattackable:false,hp:80,maxHp:80});
  g.villagers.push(april);g.message?.("April is hurrying back to the fire!");g.persist?.();return true;
}function visit(p, campId) {
  if (p.villageVisit?.campId !== campId)
    p.villageVisit = { campId, heard: [], rewarded: false };
  return p.villageVisit;
}
function nearby(g, p) {
  return visibleVillagers(g)
    .filter((v) => !v.ownerKey && !v.incoming && distance(v, p) <= 68)
    .sort((a, b) => distance(a, p) - distance(b, p))[0];
}
export function openVillagerDialogue(g, p) {
  if (p.ui || p.room || p.hp <= 0 || g.phase !== "play") return false;
  const v = nearby(g, p);
  if (!v) return false;
  const keeper = (g.questNpcs || []).some(
    (n) => distance(n, p) < distance(v, p),
  );
  if (keeper) return false;
  visit(p, v.campId);
  p.ui = {
    shop: "npc-dialogue",
    ownerDevice: p.device,
    villagerId: v.villagerId,
    villagerActorId: v.id,
    campId: v.campId,
    node: "hello",
    index: 0,
  };
  p.consumeInput = true;
  p.charge = 0;
  p.interactUsed = true;
  p.menuRepeat = 0;
  gesture(v, "wave");
  g.onSound?.("ui", p);
  return true;
}
const talkActor = (g, p) =>
  visibleVillagers(g).find((v) => v.id === p.ui?.villagerActorId);
function valid(g, p) {
  const v = talkActor(g, p);
  return (
    !!v &&
    p.hp > 0 &&
    !p.room &&
    g.phase === "play" &&
    p.ui.ownerDevice === p.device &&
    g.players.filter((q) => q.device === p.device).length === 1 &&
    distance(v, p) < 110
  );
}
export function villagerDialogueView(g, p) {
  const u=p.ui||{},spec=villagerById(u.villagerId),npc=talkActor(g,p),camp=g.villageCampState;
  const heard=camp?.talked?.length||0,alreadyMet=camp?.talked?.includes(u.villagerId),aprilHere=!!camp?.aprilSpawned;
  const text=u.villagerId==="april"
    ? "Hello! I am April. I have been hoping to meet you. Would you like me to follow you?"
    : u.node==="story"?spec.story:u.node==="small"?spec.small:alreadyMet
      ? aprilHere?"Isn’t April the best?":"It was nice to meet you. Hope April gets here soon."
      : `Hello. I am ${spec.name}. There is room by our fire for one more.`;
  const choices=u.villagerId==="april"
    ? [{label:"Follow me.",action:"village:recruit"},{label:"Not yet.",action:"village:not-yet"}]
    : alreadyMet?[{label:"That was nice meeting you, too.",action:"close"}]
      : [{label:spec.reply,action:"village:story"},{label:"Share a little moment.",action:"village:small"},{label:`Safe travels, ${spec.name}.`,action:"close"}];
  return {npc:{...npc,name:spec.name,title:spec.title},title:spec.title,text,
    notice:u.notice||(u.villagerId==="april"?"April can follow only one player this encounter.":`${heard} / 3 campers met · April will arrive after everyone has shared a story.`),choices};
}export function gesture(v, name) {
  v.animationAction = name;
  v.gestureAge = 0;
}
function recruit(g,p,v){
  const camp=g.villageCampState;
  if(!camp?.aprilSpawned||camp.aprilRecruited||v.villagerId!=="april"||p.aprilFriend?.active||
    g.players.some(q=>q.aprilFriend?.active))return false;
  camp.aprilRecruited=true;const visitState=visit(p,v.campId);visitState.rewarded=true;
  p.aprilFriend={active:true,campId:v.campId};Object.assign(v,{ownerKey:ownerKey(p),faction:"ally",incoming:false,invincible:false,unattackable:false,hp:80,maxHp:80});
  v.attackCooldown=0;v.moving=false;gesture(v,"cheer");
  g.villagers=g.villagers.filter(a=>a.id!==v.id);followers(g).push(v);
  g.message?.(`April: Hello, ${p.name}! I’ll follow you. Let’s stay together.`);g.persist?.();return true;
}export function villagerDialogueAction(g, p, action) {
  if (!p.ui?.villagerId) return false;
  if (!valid(g, p)) {
    p.ui = null;
    p.consumeInput = true;
    return true;
  }
  const u = p.ui,
    v = talkActor(g, p),
    view = villagerDialogueView(g, p);
  if (["next", "prev", "down", "up"].includes(action)) {
    u.index =
      ((u.index || 0) +
        (["next", "down"].includes(action) ? 1 : -1) +
        view.choices.length) %
      view.choices.length;
    return true;
  }
  if (action === "use") action = view.choices[u.index || 0]?.action;
  if (action?.startsWith("choice:"))
    action = view.choices[+action.slice(7)]?.action;
  if (!view.choices.some((c) => c.action === action)) return true;
  if (action === "close") {
    p.ui = null;
    p.consumeInput = true;
    return true;
  }
  const spec = villagerById(v.villagerId);
  if(action==="village:recruit"){if(recruit(g,p,v)){p.ui=null;g.uiRevision=(g.uiRevision||0)+1;}return true;}
  if(action==="village:not-yet"){p.ui=null;return true;}
  if (action === "village:story") {
    u.node = "story";
    const s = visit(p, v.campId),camp=g.villageCampState;
    if (!s.heard.includes(spec.id)) s.heard.push(spec.id);
    if(camp?.campId===v.campId&&spec.id!=="april"&&!camp.talked.includes(spec.id)){camp.talked.push(spec.id);v.sitting=true;}
    gesture(v, "talk");bringAprilToCamp(g);
    const joined = recruit(g, p, v);
    u.notice = joined
      ? "April has joined you. She will stay until you die."
      : `${s.heard.length} / ${VILLAGERS.length} stories heard`;
  } else if (action === "village:small") {
    u.node = "small";
    u.notice = spec.detail;
    gesture(v, spec.gesture);
  } else {
    u.node = "practice";
    gesture(v, action.slice(8));
    u.notice = "A friendly demonstration. No one at the camp takes damage.";
  }
  u.index = 0;
  g.uiRevision = (g.uiRevision || 0) + 1;
  g.persist?.();
  return true;
}
function animate(v, dt) {
  v.villagerClock = (v.villagerClock || 0) + dt;
  if (v.animationAction) {
    v.gestureAge = (v.gestureAge || 0) + dt;
    const c = villagerMotion.clips[v.animationAction];
    if (!c || v.gestureAge > c.length / c.fps) {
      delete v.animationAction;
      delete v.gestureAge;
    }
  }
}
function threat(g, owner, april) {
  return (g.enemies || [])
    .filter((e) => e.hp > 0 && !e.defeated && !e.practiceTarget &&
      !["ally", "neutral"].includes(e.faction) &&
      !["ally", "neutral"].includes(creatures[e.kind]?.faction) &&
      distance(e, owner) < 175 && distance(e, april) < 160)
    .sort((a, b) => distance(a, april) - distance(b, april))[0];
}
export function tickVillagers(g, dt) {
  if (g.phase !== "play") return;
  for (const v of g.villagers || []) {
    animate(v, dt);
    if(v.incoming){const d=distance(v,{x:v.targetX,y:v.targetY}),step=Math.min(d,165*dt*(1-snowAt(g,v.x,v.y)*.45));v.moving=d>28;v.walking=false;if(d>28){const dx=(v.targetX-v.x)/d,dy=(v.targetY-v.y)/d,x=v.x+dx*step,y=v.y+dy*step;if(!g.blocked(x,y,10,false,false,false,0)){v.x=x;v.y=y;}else if(!g.blocked(x,v.y,10,false,false,false,0))v.x=x;else if(!g.blocked(v.x,y,10,false,false,false,0))v.y=y;v.faceX=dx;v.faceY=dy;}if(d<=30){v.incoming=false;v.moving=false;gesture(v,"cheer");g.message?.("April has made it back to the fire. She wants to meet you.");}continue;}
    const p = g.players.find((p) => p.ui?.villagerActorId === v.id);
    if (p) {
      const n = distance(p, v) || 1;
      v.faceX = (p.x - v.x) / n;
      v.faceY = (p.y - v.y) / n;
    }
  }
  for(const a of followers(g).filter(a=>a.hp<=0)){const owner=g.players.find(p=>ownerKey(p)===a.ownerKey);if(owner?.aprilFriend?.active){owner.aprilFriend.active=false;g.message?.("April has fallen. Her journey with you is over.");g.persist?.();}}
  for (const p of g.players) {
    if (p.ui?.villagerId && !valid(g, p)) p.ui = null;
    // Recreate only an earned, living follower after map travel or save restore.
    if (
      p.aprilFriend?.active &&
      !followers(g).some((a) => a.ownerKey === ownerKey(p))
    ) {
      const a = actor(
        g,
        villagerById("april"),
        { x: p.x + 24, y: p.y + 24 },
        p.aprilFriend.campId,
      );
      a.ownerKey = ownerKey(p);
      a.faction = "ally";
      followers(g).push(a);
    }
  }
  g.villageFollowers = followers(g).filter((a) => a.hp>0 &&
    g.players.some(
      (p) => ownerKey(p) === a.ownerKey && p.aprilFriend?.active,
    ),
  );
  for (const a of g.villageFollowers) {
    animate(a, dt);
    const owner=g.players.find((p)=>ownerKey(p)===a.ownerKey);
    if(a.controlledBy&&owner?.controlledFollowerId===a.id){
      a.x=owner.x;a.y=owner.y;a.room=owner.room||null;
      if(owner.room){a.roomX=owner.roomX;a.roomY=owner.roomY;}
      a.moving=owner.moving;a.walking=owner.walking;a.faceX=owner.faceX;a.faceY=owner.faceY;a.step=owner.step;
      continue;
    }
    a.attackCooldown = Math.max(0, (a.attackCooldown || 0) - dt);
    const p = g.players.find((p) => ownerKey(p) === a.ownerKey);
    a.moving = false;
    const previousRoom = a.room;
    a.room = p.room || null;
    if (a.room) {
      // Follow the owner's traversed room path rather than walking through walls.
      if (previousRoom !== a.room || !Number.isFinite(a.roomX)) {
        a.roomX = p.roomX;
        a.roomY = p.roomY;
        a.roomTrail = [];
      }
      a.roomTrail ||= [];
      const last = a.roomTrail.at(-1) || { x: a.roomX, y: a.roomY };
      if (Math.hypot(p.roomX - last.x, p.roomY - last.y) > 4)
        a.roomTrail.push({ x: p.roomX, y: p.roomY });
      if (a.roomTrail.length > 32)
        a.roomTrail.splice(0, a.roomTrail.length - 32);
      let budget = 100 * dt * (1-snowAt(g,a.roomX,a.roomY)*.45);
      const startX = a.roomX, startY = a.roomY;
      while (a.roomTrail.length > 4 && budget > 0) {
        const target = a.roomTrail[0],
          dx = target.x - a.roomX,
          dy = target.y - a.roomY,
          n = Math.hypot(dx, dy);
        if (n < 0.1) {
          a.roomTrail.shift();
          continue;
        }
        const step = Math.min(n, budget);
        a.roomX += (dx / n) * step;
        a.roomY += (dy / n) * step;
        a.faceX = dx / n;
        a.faceY = dy / n;
        a.moving = true;
        budget -= step;
        if (step === n) a.roomTrail.shift();
      }
      a.step = (a.step || 0) + Math.hypot(a.roomX - startX, a.roomY - startY) * .13;
      continue;
    }
    const target = distance(a, p) < 130 ? threat(g, p, a) : null;
    const goal = target || p, n = distance(a, goal), stop = target ? 43 : 26;
    if (n > stop + 5 && !g.players.some((q) => q.ui?.villagerActorId === a.id)) {
      const speed = n > 140 ? 165 : target ? 112 : 100,
        step = Math.min(n - stop, speed * dt * (1-snowAt(g,a.x,a.y)*.45)),
        dx = (goal.x - a.x) / n,
        dy = (goal.y - a.y) / n,
        startX = a.x, startY = a.y;
      for (let left = step; left > 0; left -= 4) {
        const d = Math.min(left, 4),
          x = a.x + dx * d,
          y = a.y + dy * d;
        if (!g.blocked(x, y, 10, false, false, false, 0)) {
          a.x = x;
          a.y = y;
          a.moving = true;
        } else if (!g.blocked(x, a.y, 10, false, false, false, 0)) {
          a.x = x;
          a.moving = true;
        } else if (!g.blocked(a.x, y, 10, false, false, false, 0)) {
          a.y = y;
          a.moving = true;
        } else break;
      }
      a.faceX = dx;
      a.faceY = dy;
      a.walking = speed <= 112;
      a.step = (a.step || 0) + Math.hypot(a.x - startX, a.y - startY) * .13;
    }
    if (target && distance(a, target) < 59 && a.attackCooldown <= 0 &&
        clearShot(g, a, target)) {
      const reach = distance(a, target) || 1;
      a.faceX = (target.x - a.x) / reach;
      a.faceY = (target.y - a.y) / reach;
      damageEnemy(target, 12);
      target.killedBy = p.id;
      a.attackCooldown = .85;
      gesture(a, "jump_slash");
    }
    if (n > 420) {
      const sites = merchantSites(g)
        .filter(
          (v) =>
            distance(v, p) < 160 &&
            !g.blocked(v.x, v.y, 12, false, false, false, 0),
        )
        .sort((a, b) => distance(a, p) - distance(b, p));
      if (sites[0]) Object.assign(a, sites[0]);
    }
  }
}
export function drawVillagerCampfire(c,g,fire){
  if(!fire)return;const pulse=.5+Math.sin((g.time||0)*7)*.08;
  c.save();c.fillStyle="#13221dcc";c.beginPath();c.ellipse(fire.x,fire.y+7,28,10,0,0,Math.PI*2);c.fill();
  c.fillStyle="#62513b";for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.arc(fire.x+Math.cos(a)*22,fire.y+Math.sin(a)*7,4,0,Math.PI*2);c.fill();}
  c.lineCap="round";c.lineWidth=5;c.strokeStyle="#65412b";c.beginPath();c.moveTo(fire.x-12,fire.y+3);c.lineTo(fire.x+12,fire.y-1);c.moveTo(fire.x-10,fire.y-1);c.lineTo(fire.x+10,fire.y+4);c.stroke();
  c.fillStyle="#d86b32";c.beginPath();c.moveTo(fire.x,fire.y-22*pulse);c.lineTo(fire.x-8,fire.y+2);c.lineTo(fire.x+7,fire.y+2);c.closePath();c.fill();
  c.fillStyle="#ffd36c";c.beginPath();c.moveTo(fire.x,fire.y-16*pulse);c.lineTo(fire.x-4,fire.y+1);c.lineTo(fire.x+4,fire.y+1);c.closePath();c.fill();
  c.restore();
}
export function drawVillagerNpc(c, g, v, animator) {
  animator.draw(c, v, g.time, 48);
  c.save();
  c.textAlign = "center";
  c.font = "bold 6px sans-serif";
  c.fillStyle = v.ownerKey ? "#f1c78d" : "#d5ead8";
  c.fillText(v.name, v.x, v.y - 54);
  c.font = "5px sans-serif";
  c.fillStyle = "#efd5a1";
  c.fillText(
    v.ownerKey ? "April · Your friend" : "Interact · Talk",
    v.x,
    v.y + 10,
  );
  c.restore();
}
