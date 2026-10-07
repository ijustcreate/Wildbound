import { paintLayers } from "./render-order.mjs";
import {pixelVolume,pixelPolygon,pixelLine} from './pixel-shapes.mjs';
import { defaultLionMotion, lionFrame, lionAction } from "./lion-motion.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  ellipse,
  limb,
  validateMotion,
} from "./player-motion.mjs";
export function defaultAlligatorMotion() {
  const m = defaultLionMotion();
  delete m.clips.sit;
  m.type = "crocodile";
  m.name = "Alligator";
  m.palette = {
    body: "#658353",
    shade: "#364f3c",
    light: "#a8b576",
    mouth: "#e7dbc0",
    eyes: "#e6bb60",
  };
  m.shape = { bodyWidth: 13, headWidth: 5, legWidth: 4, tailWidth: 9 };
  for (const [name, j] of Object.entries(m.joints)) {
    j.position[2] *= 0.48;
    if (/^(shoulder|elbow|frontPaw|hip|knee|hock|rearPaw)/.test(name))
      j.position[0] *= 1.5;
  }
  const set = (n, p) => (m.joints[n].position = p);
  set("head", [0, 20, 6]);
  set("face", [0, 25, 6]);
  set("muzzle", [0, 31, 5]);
  set("nose", [0, 34, 6]);
  set("eyeL", [-3, 23, 9]);
  set("eyeR", [3, 23, 9]);
  set("tailBase", [0, -15, 7]);
  set("tailMid", [0, -29, 5]);
  set("tailTip", [0, -44, 2]);
  for (const name of ["face", "muzzle", "nose"]) m.visibility[name].fill(true);
  m.visibility.earL.fill(false);
  m.visibility.earR.fill(false);
  for (const clip of Object.values(m.clips))
    for (const key of clip.keys)
      for (const v of Object.values(key.joints)) v[2] *= 0.4;
  m.clips.lunge = m.clips.pounce;
  delete m.clips.pounce;
  return m;
}
export const alligatorMotion = defaultAlligatorMotion();
export const validateAlligatorMotion = (m) =>
  m?.type === "crocodile" &&
  validateMotion(m, defaultAlligatorMotion()) &&
  Object.keys(defaultAlligatorMotion().visibility).every(
    (n) =>
      Array.isArray(m.visibility?.[n]) &&
      m.visibility[n].length === 8 &&
      m.visibility[n].every((v) => typeof v === "boolean"),
  );
export function replaceAlligatorMotion(m) {
  if (!validateAlligatorMotion(m)) throw Error("Invalid alligator rig");
  Object.assign(alligatorMotion, structuredClone(m));
}
export function drawAlligator(
  c,
  a,
  time,
  m = alligatorMotion,
  suppliedPose = null,
) {
  const action =
    a.animationAction || (a.state === "charge" ? "lunge" : lionAction(a));
  const frame = Number.isFinite(a.playerFrame)
    ? a.playerFrame
    : action === "lunge"
      ? Math.max(0, 1 - (a.timer || 0) / (a.motionDuration || 0.48)) * 7
      : lionFrame({ ...a, animationAction: action }, time, m);
  const d = facingIndex(a.faceX, a.faceY),
    pose = suppliedPose || poseAt(m, action, frame),
    p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]),
    );
  const s = m.shape,
    pal = m.palette,
    q = [],
    add = (depth, fn, id, bone, bones) => q.push({ depth, fn, id, bone, bones }),
    visible = (n) => m.visibility[n]?.[d] !== false;
  for (const side of ["L", "R"])
    for (const chain of [
      ["shoulder", "elbow", "frontPaw"],
      ["hip", "knee", "hock", "rearPaw"],
    ]) {
      const names = chain.map((n) => n + side),
        x = names[0],
        z = names.at(-1);
      add((p[x].depth + p[z].depth) / 2, () => {
        for (let i = 1; i < names.length; i++)
          limb(
            c,
            p[names[i - 1]],
            p[names[i]],
            s.legWidth,
            i === 1 ? pal.shade : pal.body,
          );
        ellipse(c, p[z].x, p[z].y, 3, 1.5, pal.light);
      }, (chain[0] === "shoulder" ? "Front leg " : "Rear leg ") + side, x, names);
    }
  for (const [x, y, w] of [
    ["tailBase", "tailMid", s.tailWidth],
    ["tailMid", "tailTip", s.tailWidth * 0.5],
  ])
    add((p[x].depth + p[y].depth) / 2, () => {
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        ellipse(
          c,
          p[x].x + (p[y].x - p[x].x) * t,
          p[x].y + (p[y].y - p[x].y) * t,
          Math.max(0.5, (w * (1 - t * 0.7)) / 2),
          Math.max(0.5, (w * (1 - t * 0.7)) / 2),
          pal.body,
        );
      }
    }, y === "tailTip" ? "Tail tip" : "Tail base", x, [x, y]);
  add((p.pelvis.depth + p.chest.depth) / 2, () => {
    limb(c, p.pelvis, p.chest, s.bodyWidth, pal.body);
    const skin={...pal,outline:pal.shade};
    pixelVolume(c,pose.pelvis,s.bodyWidth*.53,11,4.5,d,skin);pixelVolume(c,pose.chest,s.bodyWidth*.52,10,5,d,skin);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      ellipse(
        c,
        p.pelvis.x + (p.chest.x - p.pelvis.x) * t,
        p.pelvis.y + (p.chest.y - p.pelvis.y) * t - 2,
        2,
        1,
        pal.light,
      );
    }
    for(let i=0;i<7;i++)for(const side of [-1,0,1]){
      const t=i/6,v=pose.pelvis.map((n,k)=>n+(pose.chest[k]-n)*t);v[0]+=side*s.bodyWidth*.27;v[2]+=5;
      const at=projectPoint(v,d);pixelPolygon(c,[{x:at.x-2,y:at.y+1},{x:at.x,y:at.y-2},{x:at.x+2,y:at.y+1}],i%2?pal.light:pal.shade);
    }
  }, "Body", "chest", ["pelvis", "chest"]);
  add(p.head.depth, () => {
    limb(c, p.chest, p.head, s.bodyWidth * 0.7, pal.shade);
    if (visible("face")) limb(c, p.head, p.face, s.headWidth * 2, pal.body);
    if (visible("muzzle")) {
      limb(c, p.face, p.muzzle, s.headWidth * 1.7, pal.body);
      limb(
        c,
        { x: p.face.x, y: p.face.y + 2 },
        { x: p.muzzle.x, y: p.muzzle.y + 2 },
        1,
        pal.mouth,
      );
      const open=['bite','lunge','windup'].includes(action)?(action==='windup'?2:3+Math.sin(Math.min(1,frame/7)*Math.PI)*3):0;
      const jawA={x:p.face.x,y:p.face.y+2},jawB={x:p.nose.x,y:p.nose.y+2};
      pixelLine(c,jawA,jawB,pal.shade,s.headWidth*1.7);
      if(open>0)pixelLine(c,{x:jawA.x,y:jawA.y+open},{x:jawB.x,y:jawB.y+open},pal.body,s.headWidth*1.6);
      pixelVolume(c,pose.face,s.headWidth*1.2,7,3,d,{...pal,outline:pal.shade});pixelVolume(c,pose.muzzle,s.headWidth,6,2,d,{...pal,outline:pal.shade});
      for(let i=1;i<=5;i++){const t=i/6,x=jawA.x+(jawB.x-jawA.x)*t,y=jawA.y+(jawB.y-jawA.y)*t;for(const side of [-1,1]){const xx=x+side*(s.headWidth*.5);pixelPolygon(c,[{x:xx-1,y},{x:xx+1,y},{x:xx,y:y+Math.max(1,open*.6)}],pal.mouth);}}
      pixelLine(c,{x:jawA.x-2,y:jawA.y},{x:jawB.x-2,y:jawB.y},pal.shade);
    }
    if (visible("nose")) ellipse(c, p.nose.x, p.nose.y, 2, 1, pal.shade);
    for (const n of ["eyeL", "eyeR"])
      if (visible(n)){ellipse(c,p[n].x,p[n].y,2,1.5,pal.eyes);c.fillStyle=pal.shade;c.fillRect(Math.round(p[n].x),Math.round(p[n].y)-1,1,2);pixelLine(c,{x:p[n].x-2,y:p[n].y-2},{x:p[n].x+2,y:p[n].y-1},pal.light);}
  }, "Head", "head", ["head", "neck"]);
  paintLayers(q, m, d, c, p);
  return p;
}
