import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPlayerMotion,
  upgradePlayerMotion,
  validatePlayerMotion,
  HUMAN_FACE_PARTS,
  poseAt,
  setJointKey,
  drawPlayer,
} from "../src/player-motion.mjs";
import { humanoidHeadHalfWidth } from "../src/humanoid-hd.mjs";
import { withDetailedHeadScale } from "../src/humanoid-hd.mjs";
import { drawHumanHead, skinPalette } from "../src/human-head.mjs";
import { captureLayers, capturedLayers, releaseLayers } from "../src/render-order.mjs";

test("Human face silhouettes keep a broad rounded jaw and chin at the existing pixel scale", () => {
  assert.equal(humanoidHeadHalfWidth(2, 0), 3.3);
  assert.equal(humanoidHeadHalfWidth(3, 0), 3);
  assert.equal(humanoidHeadHalfWidth(4, 0), 2.8);
  assert.equal(humanoidHeadHalfWidth(4.5, 0), 2.7);
  assert.equal(humanoidHeadHalfWidth(5, 0), 2.6);
  assert.ok(humanoidHeadHalfWidth(4, 2) < humanoidHeadHalfWidth(4, 0));
  for(let direction=0;direction<8;direction++){
    assert.ok(humanoidHeadHalfWidth(4,direction)>=2.4,`facing ${direction} keeps a blunt chin`);
    assert.ok(humanoidHeadHalfWidth(4,direction)>=humanoidHeadHalfWidth(5,direction),`facing ${direction} tapers gently to the chin`);
  }
  assert.equal(humanoidHeadHalfWidth(4, 4), 2.8, "rear skull keeps the front jaw's broad lower silhouette");
});

test("Fallback face drawing steps inward at the jaw and chin", () => {
  const pixels = new Map();
  const c = {
    fillStyle: "",
    fillRect(x, y, w, h) {
      for (let a = x; a < x + w; a++) for (let b = y; b < y + h; b++) pixels.set(`${a},${b}`, this.fillStyle);
    },
  };
  const point = { x: 0, y: 0 };
  drawHumanHead(c, Object.fromEntries(["head", "eyeL", "eyeR", "earL", "earR", "nose", "mouth"].map(name => [name, point])), 0, "#d9ab76", {}, () => false);
  assert.equal(pixels.get("-2,4"), skinPalette("#d9ab76").base);
  assert.equal(pixels.get("2,4"), skinPalette("#d9ab76").base);
  assert.equal(pixels.get("-2,5"), undefined);
  assert.equal(pixels.get("1,5"), skinPalette("#d9ab76").base);
});
test("Head layers expose tucked ears separately from eyes and expression",()=>{
  const point={x:0,y:0},points=Object.fromEntries(["head","eyeL","eyeR","earL","earR","nose","mouth"].map(name=>[name,point]));
  const draw=parts=>{const pixels=[];const c={fillStyle:"",fillRect(x,y,w,h){pixels.push([x,y,w,h,this.fillStyle]);}};drawHumanHead(c,points,0,"#d9ab76",{hair:"crop"},()=>true,true,"#302b2b",parts);return pixels;};
  const ears=draw("ears"),face=draw("face");
  assert.ok(ears.length>0);assert.ok(ears.every(([, , , ,color])=>color!=="#fff3df"));
  assert.ok(face.some(([, , , ,color])=>color==="#fff3df"));
});
test("Base rig head size scales the complete head around its anchor",()=>{
  const calls=[],c={save(){calls.push('save')},restore(){calls.push('restore')},translate(...v){calls.push(['translate',...v])},scale(...v){calls.push(['scale',...v])}};
  let painted=false;withDetailedHeadScale(c,{x:4,y:8},true,()=>{painted=true},1.2);
  assert.ok(painted);assert.ok(calls.some(v=>Array.isArray(v)&&v[0]==='scale'&&v[1]===1.38&&v[2]===1.38));
  const model=defaultPlayerMotion();model.joints.head.editor={baseScale:1.2};assert.ok(validatePlayerMotion(JSON.parse(JSON.stringify(model))));
});
test("Old human rigs gain facial joints without losing edited head poses", () => {
  const old = defaultPlayerMotion();
  for (const n of HUMAN_FACE_PARTS) {
    delete old.joints[n];
    for (const c of Object.values(old.clips))
      for (const k of c.keys) delete k.joints[n];
  }
  delete old.visibility;
  old.joints.head.position[0] = 5;
  old.clips.run.keys[2].joints.head = [3, 2, 4];
  const before = structuredClone(old),
    m = upgradePlayerMotion(old);
  assert.ok(validatePlayerMotion(old));
  assert.deepEqual(old, before);
  assert.deepEqual(m.clips.run.keys[2].joints.head, [3, 2, 4]);
  for (const n of HUMAN_FACE_PARTS) {
    assert.deepEqual(m.clips.run.keys[2].joints[n], [3, 2, 4]);
    assert.equal(m.joints[n].parent, "head");
  }
  assert.equal(m.joints.eyeL.position[0], 3);
});
test("Eye keys move only the selected eye and survive export with visibility", () => {
  const m = defaultPlayerMotion(),
    before = poseAt(m, "run", 3);
  setJointKey(m, "run", 3, "eyeL", [
    before.eyeL[0] + 4,
    before.eyeL[1],
    before.eyeL[2],
  ]);
  m.visibility.eyeL[2] = false;
  const packed = JSON.parse(JSON.stringify(m));
  assert.ok(validatePlayerMotion(packed));
  const after = poseAt(packed, "run", 3);
  assert.equal(after.eyeL[0], before.eyeL[0] + 4);
  assert.deepEqual(after.eyeR, before.eyeR);
  assert.deepEqual(after.head, before.head);
  assert.equal(packed.visibility.eyeL[2], false);
});
test("Human facial pixels follow edited anchors and hidden eyes are removed", () => {
  const m = defaultPlayerMotion();
  m.joints.eyeL.position = [-12, 3, 31.5];
  const raster = () => {
    const pixels = new Map();
    const c = {
      fillStyle: "",
      fillRect(x, y, w, h) {
        for (let a = Math.floor(x); a < x + w; a++)
          for (let b = Math.floor(y); b < y + h; b++)
            pixels.set(a + "," + b, this.fillStyle);
      },
    };
    drawPlayer(
      c,
      { faceX: 0, faceY: 1, animationAction: "idle", playerFrame: 0 },
      0,
      m,
    );
    return pixels;
  };
  assert.equal(raster().get("-12,-30"), m.palette.outline);
  m.visibility.eyeL[0] = false;
  assert.notEqual(raster().get("-12,-30"), m.palette.outline);
});

test("The player head shape is captured as an isolated editable sprite", () => {
  const model=defaultPlayerMotion(),c={fillStyle:"",fillRect(){}};
  captureLayers(model);
  try{drawPlayer(c,{faceX:0,faceY:1,animationAction:"idle",playerFrame:0},0,model);}
  finally{releaseLayers(model);}
  const layers=capturedLayers(model,0);
  const shape=layers.find(layer=>layer.id==="Head shape");
  const face=layers.find(layer=>layer.id==="Head and headwear");
  assert.ok(shape,"head silhouette has a dedicated paint layer");
  assert.ok(face,"eyes and cosmetic details remain on their separate overlay layer");
  assert.deepEqual(shape.bones,["head"]);
  assert.ok(shape.sprite.pixels.some(Boolean));
});
