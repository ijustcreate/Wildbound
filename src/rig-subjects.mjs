import {shoreGoblinMotion,defaultShoreGoblinMotion,replaceShoreGoblinMotion,drawShoreGoblin} from './shore-goblin-motion.mjs';
import {reaperMotion,defaultReaperMotion,replaceReaperMotion,drawReaper} from './reaper-motion.mjs';
import {dreadmaneLionMotion,defaultDreadmaneLionMotion,replaceDreadmaneLionMotion,drawDreadmaneLion} from './dreadmane-lion-motion.mjs';
import {wolfMotion, defaultWolfMotion, replaceWolfMotion, drawWolf} from './wolf-motion.mjs';
import {murkWolfMotion, defaultMurkWolfMotion, replaceMurkWolfMotion, drawMurkWolf} from './murk-wolf-motion.mjs';
import {warlockMotion,defaultWarlockMotion,replaceWarlockMotion,drawWarlock} from './warlock-motion.mjs';
import {bansheeMotion,defaultBansheeMotion,replaceBansheeMotion,drawBanshee} from './banshee-motion.mjs';
import {succubusMotion,defaultSuccubusMotion,replaceSuccubusMotion,drawSuccubus} from './succubus-motion.mjs';
import {impMotion,defaultImpMotion,replaceImpMotion,drawImp} from './imp-motion.mjs';
import {zombieMotion,defaultZombieMotion,replaceZombieMotion,drawZombie} from './zombie-motion.mjs';
import {ghostMotion,defaultGhostMotion,replaceGhostMotion,drawGhost} from './ghost-motion.mjs';
import { NIGHT_KINDS, nightMotions, nightRigLabels, defaultNightMotion, replaceNightMotion, drawNightRig } from './night-rigs.mjs';
import {
  BEAST_KINDS,
  beastMotions,
  defaultBeastMotion,
  replaceBeastMotion,
  drawBeast,
} from "./beast-motion.mjs";
import {
  alligatorMotion,
  defaultAlligatorMotion,
  replaceAlligatorMotion,
  drawAlligator,
} from "./alligator-motion.mjs";
import {
  SKELETON_KINDS,
  skeletonMotions,
  defaultSkeletonMotion,
  replaceSkeletonMotion,
  drawSkeleton,
} from "./skeleton-motion.mjs";
import {
  playerMotion,
  defaultPlayerMotion,
  defaultNativePlayerMotion,
  replacePlayerMotion,
  drawPlayer,
} from "./player-motion.mjs";
import {
  rhinoMotion,
  defaultRhinoMotion,
  replaceRhinoMotion,
  drawRhino,
} from "./rhino-motion.mjs";
import {
  lionMotion,
  tigerMotion,
  defaultLionMotion,
  replaceLionMotion,
  replaceTigerMotion,
  drawLion,
} from "./lion-motion.mjs";
import {
  batMotion,
  defaultBatMotion,
  replaceBatMotion,
  drawBat,
} from "./bat-motion.mjs";
import {
  creatureMotions,
  defaultCreatureMotion,
  replaceCreatureMotion,
  drawCreature,
  creatureRigLabels,
} from "./creature-motion.mjs";
import {oathlessCaptainMotion,defaultOathlessCaptainMotion,replaceOathlessCaptainMotion,drawOathlessCaptain} from './oathless-captain-motion.mjs';
import {safariHunterMotion,defaultSafariHunterMotion,replaceSafariHunterMotion,drawSafariHunter} from './safari-hunter-motion.mjs';
import {alanMotion,defaultAlanMotion,replaceAlanMotion,drawAlan} from './alan-motion.mjs';
import {villagerMotion,defaultVillagerMotion,replaceVillagerMotion,drawVillager} from './villager-motion.mjs';
import {slimeMotion,defaultSlimeMotion,replaceSlimeMotion,drawSlime} from './slime-motion.mjs';
export const RIG_SUBJECTS = {
  ghost:{name:'Ghost / spectral humanoid',data:ghostMotion,defaults:defaultGhostMotion,replace:replaceGhostMotion,draw:drawGhost,sprite:'ghost',selected:'head',palette:['head','body','arms','legs'],tracks:['handL','handR','footL','footR'],clip:'claw',scale:5},
  shore_goblin:{name:'Shore goblin / Murloc motion',data:shoreGoblinMotion,defaults:defaultShoreGoblinMotion,replace:replaceShoreGoblinMotion,draw:drawShoreGoblin,sprite:'shore_goblin',selected:'head',palette:Object.keys(shoreGoblinMotion.palette),shapeKeys:Object.keys(shoreGoblinMotion.shape),tracks:['handR','handL','footR','footL','mouth'],clip:'run',scale:6},
  villager:{name:'Villager / April and friends',data:villagerMotion,defaults:defaultVillagerMotion,replace:replaceVillagerMotion,draw:drawVillager,sprite:'villager',selected:'head',palette:Object.keys(villagerMotion.palette),shapeKeys:Object.keys(villagerMotion.shape),tracks:['handR','handL','swordTip','footR','footL'],clip:'wave',scale:6},
  grim_reaper:{name:'Grim Reaper / equipped humanoid',data:reaperMotion,defaults:defaultReaperMotion,replace:replaceReaperMotion,draw:drawReaper,sprite:'grim_reaper',selected:'handR',palette:['head','body','arms','legs'],tracks:['handL','handR','footL','footR'],clip:'reaper_channel',scale:5},
  oathless_captain:{name:'Oathless Captain / WoW human motion',data:oathlessCaptainMotion,defaults:defaultOathlessCaptainMotion,replace:replaceOathlessCaptainMotion,draw:drawOathlessCaptain,sprite:'oathless_captain',selected:'head',palette:Object.keys(oathlessCaptainMotion.palette),shapeKeys:Object.keys(oathlessCaptainMotion.shape),tracks:['handR','handL','swordTip','footR','footL'],clip:'walk',scale:6},
  dreadmane_lion:{name:'Dreadmane Lion / WoW motion',data:dreadmaneLionMotion,defaults:defaultDreadmaneLionMotion,replace:replaceDreadmaneLionMotion,draw:drawDreadmaneLion,sprite:'dreadmane_lion',selected:'head',palette:Object.keys(dreadmaneLionMotion.palette),shapeKeys:Object.keys(dreadmaneLionMotion.shape),tracks:['frontPawL','frontPawR','rearPawL','rearPawR','jawTip'],clip:'run',scale:6},
  slime:{name:'Slime / WoW slime motion',data:slimeMotion,defaults:defaultSlimeMotion,replace:replaceSlimeMotion,draw:drawSlime,sprite:'slime',selected:'crest',palette:Object.keys(slimeMotion.palette),shapeKeys:Object.keys(slimeMotion.shape),tracks:['crest','eyeL','eyeR','rimL','rimR'],clip:'run',scale:6},
  murk_wolf:{name:'Murk Wolf / motion transfer test',data:murkWolfMotion,defaults:defaultMurkWolfMotion,replace:replaceMurkWolfMotion,draw:drawMurkWolf,sprite:'murk_wolf',selected:'head',palette:Object.keys(murkWolfMotion.palette),shapeKeys:Object.keys(murkWolfMotion.shape),tracks:['frontPawL','frontPawR','rearPawL','rearPawR','jawTip'],clip:'run',scale:6},
  zombie:{name:'Zombie / shambling humanoid',data:zombieMotion,defaults:defaultZombieMotion,replace:replaceZombieMotion,draw:drawZombie,sprite:'zombie',selected:'handR',palette:['head','body','arms','legs'],tracks:['handR','handL','footR','footL'],clip:'walk',scale:5},
  safari_hunter:{name:'Safari Hunter / Oathless Captain rig',data:safariHunterMotion,defaults:defaultSafariHunterMotion,replace:replaceSafariHunterMotion,draw:drawSafariHunter,sprite:'safari_hunter',selected:'head',palette:['head','body','arms','legs'],shapeKeys:Object.keys(safariHunterMotion.shape),tracks:['handR','handL','footR','footL'],clip:'hunter_kneel_aim',scale:6},
  alan:{name:'Alan / Oathless Captain wilderness rig',data:alanMotion,defaults:defaultAlanMotion,replace:replaceAlanMotion,draw:drawAlan,sprite:'alan',selected:'head',palette:['head','body','arms','legs'],shapeKeys:Object.keys(alanMotion.shape),tracks:['handR','handL','footR','footL'],clip:'walk',scale:6},
  succubus:{name:'Succubus / winged humanoid',data:succubusMotion,defaults:defaultSuccubusMotion,replace:replaceSuccubusMotion,draw:drawSuccubus,sprite:'succubus',selected:'wingTipL',palette:['head','body','arms','legs'],tracks:['handL','handR','wingTipL','wingTipR','tailTip'],clip:'fly',scale:5},
  imp:{name:'Ember imp / small winged demon',data:impMotion,defaults:defaultImpMotion,replace:replaceImpMotion,draw:drawImp,sprite:'imp',selected:'wingTipL',palette:['head','body','arms','legs'],tracks:['handR','wingTipL','wingTipR','tailTip'],clip:'fly',scale:5},
  banshee_queen:{name:'Banshee Queen / equipped humanoid',data:bansheeMotion,defaults:defaultBansheeMotion,replace:replaceBansheeMotion,draw:drawBanshee,sprite:'banshee_queen',selected:'handL',palette:['head','body','arms','legs'],tracks:['handL','handR','footL','footR'],clip:'draw',scale:5},
  necromancer:{name:'Purple warlock / equipped humanoid',data:warlockMotion,defaults:defaultWarlockMotion,replace:replaceWarlockMotion,draw:drawWarlock,sprite:'necromancer',selected:'handR',palette:['head','body','arms','legs'],tracks:['handL','handR','footL','footR'],clip:'cast',scale:5},
  ...Object.fromEntries(NIGHT_KINDS.map(kind => {
    const data = nightMotions[kind];
    const selected = { carnivorous_flower: 'jawTop', night_stalker: 'frontPawR', burrower: 'head', mimic_vine: 'tendril6', poison_pod: 'sacR', carrion_pack: 'jaw', hunter: 'rifleMuzzle', elephant: 'trunkTip', zebra: 'frontPawR', pelican: 'wingTipR' }[kind];
    return [kind, {
      name: nightRigLabels[kind], data, defaults: () => defaultNightMotion(kind),
      replace: model => replaceNightMotion(kind, model),
      draw: (c, actor, time, model = nightMotions[kind], pose) => drawNightRig(c, actor, time, model, pose),
      sprite: kind, selected, palette: Object.keys(data.palette), shapeKeys: Object.keys(data.shape),
      tracks: [selected, ...Object.keys(data.joints).filter(n => /^(foot|frontPaw|jaw|tendril|wingTip)/.test(n) && n !== selected)].slice(0, 5),
      clip: kind === 'carnivorous_flower' ? 'sway' : kind === 'mimic_vine' ? 'wrap' : 'run', scale: kind === 'elephant' ? 4 : 5,
    }];
  })),
  ...Object.fromEntries(
    BEAST_KINDS.map((kind) => [
      kind,
      {
        name:
          ['beetle','spider','tarantula'].includes(kind)
            ? kind==='tarantula'?'Sandy tarantula / eight legs':kind==='spider'?'Black spider / eight legs':"Jade scarab / six articulated legs"
            : kind[0].toUpperCase() + kind.slice(1) + " / quadruped",
        data: beastMotions[kind],
        defaults: () => defaultBeastMotion(kind),
        replace: (m) => replaceBeastMotion(kind, m),
        draw: drawBeast,
        sprite: kind,
        selected: kind === "beetle" ? "antennaL" : "head",
        palette: Object.keys(beastMotions[kind].palette),
        tracks:
          ['beetle','spider','tarantula'].includes(kind)
            ? ["foot0L", "foot1R", "foot2L", kind!=='beetle'?'foot3R':"antennaL"]
            : ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "tailTip"],
        clip: "run",
        scale: 6,
      },
    ]),
  ),
  crocodile: {
    name: "Alligator / quadruped",
    data: alligatorMotion,
    defaults: defaultAlligatorMotion,
    replace: replaceAlligatorMotion,
    draw: drawAlligator,
    sprite: "crocodile",
    selected: "tailMid",
    palette: ["body", "shade", "light", "mouth"],
    tracks: ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "tailTip"],
    clip: "run",
    scale: 5,
  },
  ...Object.fromEntries(
    SKELETON_KINDS.map((kind) => [
      kind,
      {
        name: {
          skeleton: "Skeleton / sword",
          archer: "Skeleton / archer",
          skeleton_unarmed: "Skeleton / unarmed",
          skeleton_boss: "Skeleton / horned boss",
          frost_skeleton_mage: "Frost skeletal mage",
        }[kind],
        data: skeletonMotions[kind],
        defaults: () => defaultSkeletonMotion(kind),
        replace: (m) => replaceSkeletonMotion(kind, m),
        draw: drawSkeleton,
        sprite: kind,
        selected: "handR",
        palette: ["head", "headShade", "body", "bodyShade", "arms", "armShade", "legs", "legShade"],
        tracks: ["handL", "handR", "footL", "footR"],
        clip: "run",
      },
    ]),
  ),
  rhino: {
    name: "Rhino / quadruped",
    data: rhinoMotion,
    defaults: defaultRhinoMotion,
    replace: replaceRhinoMotion,
    draw: drawRhino,
    sprite: "rhino",
    selected: "hornTip",
    palette: ["body", "shade", "face", "horn"],
    tracks: ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "hornTip"],
    clip: "run",
    scale: 6,
  },
  player: {
    name: "Player / humanoid",
    data: playerMotion,
    defaults: defaultNativePlayerMotion,
    replace: replacePlayerMotion,
    draw: drawPlayer,
    sprite: "explorer-teal",
    selected: "handR",
    palette: ["head", "body", "arms", "legs"],
    tracks: ["handL", "handR", "footL", "footR"],
    clip: "run",
  },
  lion: {
    name: "Lion / quadruped",
    data: lionMotion,
    defaults: defaultLionMotion,
    replace: replaceLionMotion,
    draw: drawLion,
    sprite: "lion",
    selected: "frontPawR",
    palette: ["head", "body", "mane", "legs", "tail"],
    tracks: ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "tailTip"],
    clip: "run",
  },
  wolf: {
    name: "Wolf / quadruped",
    data: wolfMotion,
    defaults: defaultWolfMotion,
    replace: replaceWolfMotion,
    draw: drawWolf,
    sprite: "wolf",
    selected: "frontPawR",
    palette: ["head", "body", "cream", "legs", "tail"],
    tracks: ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "tailTip"],
    clip: "run",
  },
  bat: {
    scale: 5,
    name: "Bat / flying",
    data: batMotion,
    defaults: defaultBatMotion,
    replace: replaceBatMotion,
    draw: drawBat,
    sprite: "bat",
    selected: "wristR",
    palette: ["body", "head", "wing", "eyes"],
    tracks: ["wristL", "wristR", "wingTipL", "wingTipR"],
    clip: "fly",
  },
  ...Object.fromEntries(
    Object.entries(creatureMotions).map(([kind, data]) => [
      kind,
      {
        name: creatureRigLabels[kind],
        scale:
          kind === "dragon" ? 3 : kind === "fire_elemental" ? 5 : undefined,
        data,
        defaults: () => defaultCreatureMotion(kind),
        replace: (m) => replaceCreatureMotion(kind, m),
        draw: drawCreature,
        sprite: kind,
        selected: {
          fire_elemental: "flameCrown",
          water_elemental: "crest",
          dragon: "head",
          beholder: "eye",
          lesser_beholder: "eye",
          snake: "head",
          monkey: "handR",
          golem: "handR",
          vine: "jawTop",
          trap: "jawL",
        }[kind],
        palette: ["body", "shade", "face", "detail"],
        shapeKeys:
          kind === "snake"
            ? ["bodyWidth", "headRadius"]
            : kind === "golem" || kind === "vine"
              ? ["bodyWidth", "headRadius", "limbWidth"]
              : null,
        tracks: {
          beholder: ["eye", "stalk0Tip", "stalk1Tip", "stalk3Tip", "stalk4Tip"],
          lesser_beholder: ["eye", "stalk0Tip", "stalk1Tip", "stalk3Tip", "stalk4Tip"],
          fire_elemental: [
            "head",
            "handL",
            "handR",
            "footL",
            "footR",
            "flameCrown",
          ],
          water_elemental: ["head", "handL", "handR", "footL", "footR", "crest"],
          dragon: ["wingTipL", "wingTipR", "frontPawL", "frontPawR", "tailTip"],
          snake: ["segment2", "segment5", "tailTip", "jaw"],
          monkey: ["handL", "handR", "footL", "footR", "tailTip"],
          golem: ["handL", "handR", "footL", "footR"],
          vine: ["stem1", "stem2", "jawTop", "jawBottom"],
          trap: ["trigger", "hingeL", "jawL", "jawR"],
        }[kind],
        clip: {
          fire_elemental: "run",
          water_elemental: "idle",
          dragon: "run",
          snake: "slither",
          monkey: "run",
          golem: "walk",
          vine: "idle",
          trap: "snap",
        }[kind],
      },
    ]),
  ),
};
RIG_SUBJECTS.tiger={...RIG_SUBJECTS.lion,name:"Tiger / lion rig",data:tigerMotion,defaults:()=>defaultLionMotion(),replace:replaceTigerMotion,sprite:"tiger",draw:(c,a,t,m,p)=>drawLion(c,{...a,skin:"tiger"},t,m||tigerMotion,p)};
RIG_SUBJECTS.tsetse={...RIG_SUBJECTS.bat,name:"Tsetse fly / winged rig",sprite:"bat"};
// Boatless Captain uses the editable humanoid rig until a dedicated motion pack is authored.
RIG_SUBJECTS.boatless_captain={...RIG_SUBJECTS.player,name:"Boatless Captain / controller humanoid",sprite:"boatless_captain"};
RIG_SUBJECTS.coatless_captain={...RIG_SUBJECTS.boatless_captain,name:"Coatless Captain / controller humanoid",sprite:"coatless_captain"};
RIG_SUBJECTS.april={...RIG_SUBJECTS.boatless_captain,name:"April / controller humanoid",sprite:"april"};
RIG_SUBJECTS.captain={...RIG_SUBJECTS.boatless_captain,name:"Captain / controller humanoid",sprite:"captain"};
export const rigSubject = (name) =>
  RIG_SUBJECTS[name?.startsWith("explorer") ? "player" : name==='baby_spider'?'spider':name==='tsetse'?'tsetse':name];
