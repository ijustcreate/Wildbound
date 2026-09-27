import {loadHouseStorage} from './src/house-design.mjs';
import {applyActiveHouse,applyChangedHouse} from './src/apply-house.mjs';
import { GameAudio } from './src/audio.mjs';
import { creatureCue } from './src/sound-bank.mjs';
import { openCharacterGallery } from "./src/character-gallery.mjs";
import { controlLabels, controlHelp, PAD_NAMES, DEFAULT_MAPPING, normalizeMapping, renderPlayerMappings } from "./src/controls.mjs";
import { openControllerKeyboard, navigateControllerKeyboard } from "./src/controller-keyboard.mjs";
import { FieldKit } from "./src/field-kit.mjs";
import { FrameMetrics, FixedClock } from "./src/performance.mjs";
import { DEFAULT_APPEARANCE, appearanceControls } from "./src/appearance.mjs";
import { drawPlayer } from "./src/player-motion.mjs";
import { generateWorld } from "./src/world.mjs";
import { MUSIC_TRACKS, musicTrack } from "./src/music.mjs";
import { Game, CENTER, EVENTS, FINISH, cameraTarget } from "./src/core.mjs";
import { Assets } from "./src/assets.mjs";
import { Renderer, drawMenu } from "./src/render.mjs";
import { drawBoard } from "./src/board.mjs";
import { Animator } from "./src/animation.mjs";
import { ITEM_ART_TYPES, drawItem } from "./src/item-art.mjs";
import {
  lionMotion,
  replaceLionMotion,
  defaultLionMotion,
} from "./src/lion-motion.mjs";
import {
  playerMotion,
  replacePlayerMotion,
  defaultPlayerMotion,
  poseAt,
  projectPoint,
  DIRECTIONS,
  directionVector,
} from "./src/player-motion.mjs";
import { Workshop } from "./src/workshop.mjs";
import { convertRegion, validateSprite } from "./src/pixels.mjs";
import { HeroUI } from "./src/hero-ui.mjs";
import { RIG_SUBJECTS } from "./src/rig-subjects.mjs";
import { FrameWorkshop } from "./src/frame-workshop.mjs";
let framesWorkshop;
import {
  Profiles,
  characterNameError,
  cleanCharacterName,
} from "./src/profiles.mjs";
import { count, give, equip, ITEMS } from "./src/items.mjs";
import { Designer } from "./src/designer.mjs";
import { loadDefinitions, creatures } from "./src/definitions.mjs";
loadDefinitions(EVENTS, ITEMS);
await (await import('./src/project-rigs.mjs')).loadProjectRigs(EVENTS, ITEMS);
let designer;
import { Rooms, cleanInput } from "./src/rooms.mjs";
import { saveSession, restoreSession } from "./src/session.mjs";
const rooms = new Rooms(onRoomEvent);
await loadHouseStorage();
const profiles = await new Profiles().load();
const heroRoot = document.createElement("div");
heroRoot.id = "hero-overlays";
document.getElementById("play").append(heroRoot);
const heroUI = new HeroUI(heroRoot);
const $ = (id) => document.getElementById(id);
const assets = new Assets();
const lobbyAnimator = new Animator(assets);
let game = new Game(),
  screen = "home",
  paused = false,
  workshop,
  renderer,
  ready = false;
let boardPinned = false,
  boardDismissedRoll = null;
let mapping = { ...DEFAULT_MAPPING };
try { Object.assign(mapping, normalizeMapping(JSON.parse(localStorage.getItem("wildbound-mapping") || "{}"))); } catch {}
const keys = new Set(),
  mouse = { x: 0, y: 0, down: false, active: false },
  previousPads = new Map(),
  controllerClaims = new Map(),
  pendingControllerClaims = new Set(),
  controllerLastSeen = new Map();
const controllerClaimKey = (pad) =>
  `${pad.index}|${pad.id || "unknown"}|${pad.mapping || ""}`;
function requestControllerClaim(pad, key) {
  if (!window.desktop?.claimController || pendingControllerClaims.has(key)) return;
  pendingControllerClaims.add(key);
  window.desktop.claimController(key).then((claimed) => {
    if (claimed) controllerClaims.set(pad.index, key);
  }).catch(() => {}).finally(() => pendingControllerClaims.delete(key));
}
function releaseControllerClaim(key) {
  if (window.desktop?.releaseController) window.desktop.releaseController(key).catch(() => {});
  for (const [index, owned] of controllerClaims)
    if (owned === key) controllerClaims.delete(index);
  controllerLastSeen.delete(key);
}
let soundEnabled = localStorage.getItem('wildbound-sound') !== 'off';
let musicVolume = Number(localStorage.getItem('wildbound-music-volume') ?? .45);
const audio = new GameAudio(); audio.enabled=soundEnabled;
let selectedMusic = MUSIC_TRACKS[0], levelMusicKey=null, lastLevelTrack=null;
const music = new Audio(selectedMusic.file); music.loop=true;
function startMusic(){audio.unlock();if(soundEnabled&&musicVolume>0)music.play().catch(()=>{});}
window.addEventListener('pointerdown',startMusic);window.addEventListener('keydown',startMusic);
document.addEventListener('focusin',e=>{if(e.target.matches('button,input,select'))audio.play('focus');});
document.addEventListener('click',e=>{if(e.target.closest('button'))audio.play('click');});
document.addEventListener('change',()=>audio.play('click'));
function sound(type,actor){audio.play(type,actor);}
function routeMusic(){
 const active=screen==='play',key=active?String(game.seed)+':'+(game.environment||'forest'):'menu';
 if(key!==levelMusicKey){levelMusicKey=key;if(active){const pool=MUSIC_TRACKS.slice(1).filter(t=>t.id!==lastLevelTrack);selectedMusic=pool[Math.floor(Math.random()*pool.length)];lastLevelTrack=selectedMusic.id;}else selectedMusic=MUSIC_TRACKS[0];music.src=selectedMusic.file;music.load();if(audio.unlocked)startMusic();if($('music-status'))$('music-status').textContent=(active?'Expedition: ':'Menu: ')+selectedMusic.name;}
 const target=soundEnabled?musicVolume*audio.settings.master*(performance.now()<(audio.duckUntil||0)?.4:1):0;music.volume+= (Math.max(0,Math.min(1,target))-music.volume)*.08;
}
window.addEventListener('wildbound-house-applied',e=>{
  if(rooms.role==='client'){e.detail.message='Saved locally. The host controls the current map.';return;}
  e.detail.message=applyActiveHouse(game)?'Saved and applied to the current House expedition.':'Saved and active. Your next House expedition will use this layout.';
});
function wireGame() {
  game.onSound = sound;
  game.pvp=localStorage.getItem("wildbound-pvp")==="on";
  game.controlLabels = controlLabels(mapping);
  game.spriteLibrary = assets.library;
  game.environment = $("environment").value;
  game.sharedStash = structuredClone(profiles.data.sharedStash || []);
  game.eventDuration = Number(
    localStorage.getItem("wildbound-event-duration") || 7,
  );
  game.persist = () => {
    game.uiRevision = (game.uiRevision || 0) + 1;
    profiles.capture(game);
    persistSession();
  };
}
let pendingSession = null,
  sessionSaving = false,
  lastSessionBody = "";
async function persistSession() {
  if (rooms.role === "client" || !game.players.length || game.phase === "lobby")
    return;
  const body = JSON.stringify(saveSession(game));
  if (body === lastSessionBody && !game.saveError) return;
  pendingSession = { body, data: JSON.parse(body) };
  if (sessionSaving) return;
  sessionSaving = true;
  game.saving = true;
  while (pendingSession) {
    const next = pendingSession;
    pendingSession = null;
    const started = performance.now();
    try {
      if (window.desktop) await window.desktop.saveSession(next.data);
      else localStorage.setItem("wildbound-session", next.body);
      lastSessionBody = next.body;
      game.saveError = null;
    } catch (e) {
      game.saveError = e.message;
      game.message("Save failed: " + e.message);
    } finally {
      if (typeof metrics !== "undefined")
        metrics.record("save", performance.now() - started);
    }
  }
  sessionSaving = false;
  game.saving = false;
}

wireGame();
const metrics = new FrameMetrics(),
  fixedClock = new FixedClock();
let fieldWasPaused = false;
const fieldKit = new FieldKit({
  game: () => game,
  profiles,
  metrics,
  mapping,
  onPause: () => {
    fieldWasPaused = paused;
    paused = true;
    keys.clear();
    mouse.down = false;
  },
  onResume: () => {
    paused = fieldWasPaused;
    keys.clear();
    mouse.down = false;
    fixedClock.reset();
  },
});
document.documentElement.style.setProperty(
  "--ui-scale",
  localStorage.getItem("wildbound-ui-scale") || "1",
);
document.body.dataset.boardSize =
  localStorage.getItem("wildbound-board-size") || "compact";
function show(next) {
  if(next==='home'){newLobby();return;}
  screen = next;
  document.body.dataset.screen = next;
  keys.clear();
  mouse.down = false;
  for (const el of document.querySelectorAll(".screen"))
    el.classList.toggle("active", el.id === next);
  $("nav-play").classList.toggle("active", next !== "workshop");
  $("nav-workshop").classList.toggle("active", next === "workshop");
  if (next === "workshop") workshop?.render();
}
function newLobby() {
  if (game.phase !== "lobby") profiles.capture(game);
  boardPinned = false;
  boardDismissedRoll = null;
  game = new Game();
  wireGame();
  paused = false;
  show("lobby");
  renderLobby();
}
function onRoomEvent(data) {
  if (rooms.role === "host") {
    if (data.type === "hello") {
      let p = game.players.find((p) => p.device === "net:" + data.peer);
      if (!p) {
        p = game.players.find((p) => p.netDisconnected && p.name === data.name);
        if (p) {
          p.device = "net:" + data.peer;
          p.netDisconnected = false;
        }
      }
      if (!p) {
        p = game.addPlayer("net:" + data.peer, data.name);
        if (p) {
          const h = profiles.data.heroes.find(
            (h) =>
              h.name === data.name &&
              !game.players.some((q) => q !== p && q.profileId === h.id),
          );
          if (h) profiles.assign(p, h);
        }
      }
      rooms.send({ type: "welcome", peer: data.peer, playerId: p?.id });
      if (screen === "lobby") renderLobby();
    }
    if (data.type === "input")
      rooms.inputs["net:" + data.peer] = cleanInput(data.input);
    if (data.type === "action") {
      const p = game.players.find((p) => p.device === "net:" + data.peer);
      if (
        p &&
        [
          "portal",
          "usePotion",
          "openInventory",
          "leaveRoom",
          "inventoryAction",
        ].includes(data.action)
      )
        game[data.action](p, data.arg);
    }
    if (data.type === "left") {
      delete rooms.inputs["net:" + data.peer];
      const left = game.players.find((p) => p.device === "net:" + data.peer);
      if (left) left.netDisconnected = true;
      if (screen === "play")
        pause(
          "A room player disconnected. Rejoin with the same character name before continuing.",
        );
      else {
        game.players = game.players.filter(
          (p) => p.device !== "net:" + data.peer,
        );
        renderLobby();
      }
    }
  } else if (rooms.role === "client") {
    if (data.type === "welcome" && !rooms.peer) {
      rooms.peer = data.peer;
      rooms.playerId = data.playerId;
    }
    if (data.type === "disconnected") {
      rooms.role = null;
      pause("Room connection lost. Return home and rejoin the host.");
    }
    if (data.type === "state") {
      const oldSeed = game.seed;
      Object.assign(game, data.state);
      if (game.phase === "won") game.scenery = [];
      else if (!data.state.scenery && oldSeed !== game.seed)
        game.scenery = generateWorld(game.seed).scenery;
      game.explored = new Set(data.state.explored);
      game.spriteLibrary = assets.library;
      for (const action of [
        "portal",
        "usePotion",
        "openInventory",
        "leaveRoom",
        "inventoryAction",
      ])
        game[action] = (p, arg) => {
          if (p.id === rooms.playerId)
            rooms.send({ type: "action", action, arg });
        };
      game.persist = () => {};
      if (game.phase === "lobby") {
        if (screen !== "lobby") show("lobby");
        renderLobby();
        $("begin-button").disabled = true;
      } else if (screen !== "play") {
        renderer = new Renderer($("game-canvas"), assets);
        show("play");
        paused = false;
      }
    }
  }
}
const roomDialog = document.createElement("dialog");
roomDialog.innerHTML =
  '<h2>Play in a room</h2><p>Direct connection on your local network. Host shares the full room address. No public matchmaking server is used.</p><label>Your character name <input id="room-name" maxlength="16" value="Explorer"></label><label>Host address <input id="room-address" placeholder="192.168.1.10:port/code"></label><p id="room-status"></p><button id="room-host">Host room</button><button id="room-join">Join room</button><button id="room-close">Close</button>';
document.body.append(roomDialog);
const roomButton = document.createElement("button");
roomButton.textContent = "HOST / JOIN ROOM";
roomButton.className = "text-button";
$("local-button").after(roomButton);
roomButton.onclick = () => roomDialog.showModal();
$("room-close").onclick = () => roomDialog.close();
$("room-host").onclick = async () => {
  try {
    if (!window.desktop) throw Error("Rooms require the desktop app.");
    newLobby();
    const address = await rooms.host();
    $("room-address").value = address;
    $("room-status").textContent =
      "Room open. Share: " +
      address +
      " — close this panel to select characters and start.";
  } catch (e) {
    $("room-status").textContent = e.message;
  }
};
$("room-join").onclick = async () => {
  try {
    if (!window.desktop) throw Error("Rooms require the desktop app.");
    rooms.peer = null;
    await rooms.join($("room-address").value.trim(), $("room-name").value);
    roomDialog.close();
  } catch (e) {
    $("room-status").textContent = e.message;
  }
};
function renderLobby() {
  const pickers=new Map([...document.querySelectorAll('.character-gallery')].map(panel=>[panel.dataset.ownerDevice,panel]));
  const focused = document.activeElement?.dataset.lobbyFocus;
  const slots = [];
  const visibleSlots=Math.min(6,Math.max(2,game.players.length+1));
  $("player-slots").style.setProperty("--party-slots",visibleSlots);
  for (let i = 0; i < visibleSlots; i++) {
    const p = game.players[i],
      el = document.createElement("div");
    el.className = "player-slot" + (p ? "" : " empty");
    const n = document.createElement("span");
    n.className = "slot-number";
    n.textContent = String(i + 1).padStart(2, "0");
    el.append(n);
    if (p) {
      el.dataset.device=p.device;
      el.style.borderTop = "3px solid " + p.color;
      const c = document.createElement("canvas");
      c.width = 96;
      c.height = 96;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      lobbyAnimator.draw(
        ctx,
        {
          ...p,
          x: 48,
          y: 79.5,
          faceX: 0,
          faceY: 1,
          moving: false,
          animationAction: "idle",
          playerFrame: 0,
        },
        0,
        90,
      );
      const input = document.createElement("input");
      input.value = p.name;
      input.maxLength = 20;
      input.readOnly = true;
      input.dataset.lobbyFocus=p.id+'-name';
      input.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}};
      input.onclick = () => {
        const dialog=document.createElement('dialog');dialog.id='rename-character-dialog';dialog.dataset.ownerDevice=p.device;
        const title=document.createElement('h2');title.textContent='Edit '+p.name+"’s name?";
        const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.onclick=()=>{dialog.close();dialog.remove();input.focus();};
        const edit=document.createElement('button');edit.textContent='Edit';edit.onclick=()=>{dialog.close();dialog.remove();openControllerKeyboard(input);};
        dialog.append(title,cancel,edit);dialog.oncancel=e=>{e.preventDefault();cancel.click();};document.body.append(dialog);dialog.showModal();cancel.focus();
      };
      input.setAttribute("aria-label", "Player " + (i + 1) + " name");
      input.onchange = () => {
        const error = characterNameError(
          input.value,
          profiles.data.heroes,
          p.profileId,
        );
        input.setCustomValidity(error);
        if (error) {
          input.reportValidity();
          input.value = p.name;
          return;
        }
        p.name = cleanCharacterName(input.value);
        const h = profiles.data.heroes.find((h) => h.id === p.profileId);
        if (h) {
          h.name = p.name;
          profiles.save();
        }
      };
      const small = document.createElement("small");
      small.textContent =
        p.device === "keyboard"
          ? "KEYBOARD + MOUSE"
          : "CONTROLLER " + (Number(p.device.split(":")[1]) + 1);
      const remove = document.createElement("button");
      remove.className = "remove-player";
      remove.textContent = "×";
      remove.title = "Remove player";
      remove.onclick = () => {
        game.players = game.players.filter((q) => q !== p);
        renderLobby();
      };
      const select=document.createElement("button");select.textContent=profiles.data.heroes.length?"Choose character":"Create new character";select.dataset.lobbyFocus=p.id+"-saved";
      select.onclick=()=>profiles.data.heroes.length?openCharacterGallery({profiles,game,player:p,onChange:renderLobby,onNew:()=>nameNewCharacter(p)}):nameNewCharacter(p);
      const readyButton=document.createElement('button');readyButton.className='party-ready';readyButton.textContent=p.ready?'✓ READY':'Ready up · A';readyButton.dataset.lobbyFocus=p.id+'-ready';
      readyButton.onclick=()=>{if(!profiles.data.heroes.some(h=>h.id===p.profileId)){nameNewCharacter(p);return;}p.ready=!p.ready;renderLobby();};
      el.classList.toggle('is-ready',!!p.ready);
      el.append(small,c,input,select);
      if(profiles.data.heroes.some(h=>h.id===p.profileId))el.append(readyButton);
      el.append(remove);
      if(pickers.has(p.device)){el.replaceChildren(pickers.get(p.device));pickers.get(p.device).refreshAvailability();}
    } else {
      const plus = document.createElement("span");
      plus.textContent = "+";
      plus.style.fontSize = "30px";
      const text = document.createElement("small");
      text.textContent = i
        ? "PRESS A BUTTON TO JOIN"
        : "CONTROLLER BUTTON / ENTER";
      el.append(plus, text);
    }
    slots.push(el);
  }
  $("player-slots").replaceChildren(...slots);
  $("begin-button").disabled = !game.players.length || game.players.some(p=>!p.ready || !p.profileId);
  $('party-status').textContent=!game.players.length?'Press A to join · Enter for keyboard':game.players.every(p=>p.ready&&p.profileId)?'Everyone is ready. Press Start to begin.':'Choose your explorer, then ready up. '+game.players.filter(p=>p.ready).length+' / '+game.players.length+' ready';
  if(focused)document.querySelector(`[data-lobby-focus="${focused}"]`)?.focus({preventScroll:true});
}
function nameNewCharacter(p, done = () => {}) {
  const wasPaused = paused;
  if (screen === "play") paused = true;
  if (document.querySelector("#character-name-dialog")) return;
  const dialog = document.createElement("dialog");
  dialog.id = "character-name-dialog";
  dialog.dataset.ownerDevice=p.device;
  dialog.innerHTML =
    '<form><h2>Create your character</h2><p>D-pad / stick: move · Left/right: change options · A: choose · B: back. Use the name button only when you want the on-screen keyboard.</p><label>Character name <input name="characterName" minlength="2" maxlength="20" required autocomplete="off" readonly></label><canvas class="creation-preview" width="240" height="180"></canvas><details class="creation-details"><summary>Customize appearance</summary><div class="creation-appearance"></div></details><p class="name-error" role="alert"></p><footer class="creation-footer"><button type="submit">Create character</button><button type="button" class="name-cancel">Cancel</button></footer></form>';
  document.body.append(dialog);
  const input = dialog.querySelector("input");
  input.value = p.name;
  input.dataset.controllerSkip = "true";
  input.tabIndex = -1;
  const appearance = structuredClone(DEFAULT_APPEARANCE);
  let creationDirection = 0,
    creationPose = "idle",
    creationGear = {},
    starterKit = "classic";
  const preview = () => {
    const c = dialog.querySelector("canvas").getContext("2d");
    c.clearRect(0, 0, 240, 180);
    c.save();
    c.translate(120, 160);
    c.scale(4, 4);
    const [faceX, faceY] = directionVector(creationDirection);
    drawPlayer(
      c,
      {
        appearance,
        faceX,
        faceY,
        animationAction: creationPose,
        moving: creationPose === "run",
        attack:
          creationPose === "slash"
            ? 0.34 * (1 - ((performance.now() / 1000) % 1))
            : 0,
        equipment: creationGear,
      },
      performance.now() / 1000,
    );
    c.restore();
  };
  const kitLabel = document.createElement("label");
  kitLabel.className = "creation-choice creation-starting-gear";
  kitLabel.textContent = "Starting gear";
  const kit = document.createElement("select");
  kit.setAttribute("aria-label", "Starting gear");
  for (const [v, t] of [
    ["classic", "Classic · three traps"],
    ["melee", "Blade · sword and one trap"],
    ["ranged", "Archer · bow, eight arrows and one trap"],
    ["trapper", "Trapper · five traps"],
  ]) kit.append(new Option(t, v));
  kit.onchange = () => {
    starterKit = kit.value;
    preview();
  };
  kitLabel.append(kit);
  dialog.querySelector(".creation-preview").after(kitLabel);
  const nameTools = document.createElement("div");
  nameTools.className = "appearance-toolbar";
  const nameButton = document.createElement("button");
  nameButton.type = "button";
  nameButton.textContent = "Suggest unique name";
  nameButton.onclick = () => {
    input.value =
      ["Scout", "River", "Fern", "Echo", "Ember", "Willow", "Ash"][
        Math.floor(Math.random() * 7)
      ] +
      " " +
      Math.floor(100 + Math.random() * 900);
  };
  const editName=document.createElement('button');editName.type='button';editName.textContent='Edit name · on-screen keyboard';editName.onclick=()=>openControllerKeyboard(input);
  nameTools.append(editName,nameButton);
  input.parentElement.after(nameTools);
  appearanceControls(
    dialog.querySelector(".creation-appearance"),
    appearance,
    preview,
    { compact: true },
  );
  kit.focus({ preventScroll: true });
  const animateCreation = () => {
    if (!dialog.isConnected) return;
    preview();
    requestAnimationFrame(animateCreation);
  };
  animateCreation();
  dialog.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const error = characterNameError(input.value, profiles.data.heroes);
    if (error) {
      dialog.querySelector(".name-error").textContent = error;
      input.focus();
      return;
    }
    profiles.assign(p, profiles.create(input.value, appearance));
    if (starterKit !== "classic") {
      p.inventory = [];
      give(p.inventory, "trap", starterKit === "trapper" ? 5 : 1);
      if (starterKit === "melee") p.equipment.hand1 = "sword";
      if (starterKit === "ranged") {
        p.equipment.hand1 = "bow";
        p.equipment.hand2 = "occupied";
        give(p.inventory, "arrow", 8);
      }
      profiles.capture(game);
    }
    paused = wasPaused;
    dialog.close();
    dialog.remove();
    renderLobby();
    done();
  };
  const cancel = () => {
    paused = wasPaused;
    if (
      screen === "play" &&
      !profiles.data.heroes.some((h) => h.id === p.profileId)
    )
      game.players = game.players.filter((q) => q !== p);
    dialog.close();
    dialog.remove();
    renderLobby();
  };
  dialog.querySelector(".name-cancel").onclick = cancel;
  dialog.oncancel = (e) => {
    e.preventDefault();
    cancel();
  };
  dialog.showModal();
  editName.focus();
}
function startGame() {
  const unnamed = game.players.find(
    (p) => !profiles.data.heroes.some((h) => h.id === p.profileId),
  );
  if (unnamed) {
    nameNewCharacter(unnamed, startGame);
    return;
  }
  game.spriteLibrary = assets.library;
  game.environment = $("environment").value;
  if (!game.start()) return;
  game.difficulty = $("difficulty").value;
  game.diceCount = Number($("dice-count").value);
  profiles.capture(game);
  renderer = new Renderer($("game-canvas"), assets);
  paused = false;
  show("play");
  renderRoster();
}
function renderRoster() {
  const elements = game.players.map((p, i) => {
    const el = document.createElement("div");
    el.className = "roster-card" + (p === game.current ? " current" : "");
    el.style.setProperty("--player", p.color);
    const name = document.createElement("div");
    name.className = "roster-name";
    const b = document.createElement("b");
    b.textContent = p.name;
    const span = document.createElement("span");
    span.textContent =
      p.hp > 0
        ? Math.ceil(p.hp) +
          " HP" +
          (p.stun > 0 ? " · STUN " + p.stun.toFixed(1) + "s" : "")
        : "DOWN";
    name.append(b, span);
    const health = document.createElement("div");
    health.className = "health-track";
    const fill = document.createElement("i");
    fill.style.width = p.hp + "%";
    health.append(fill);
    const info = document.createElement("div");
    info.className = "roster-info";
    const progress = document.createElement("span");
    progress.textContent =
      p.progress >= FINISH
        ? "CENTER REACHED"
        : p.progress + " / " + FINISH + " SPACES";
    const traps = document.createElement("span");
    traps.textContent =
      p.traps +
      " TRAPS · " +
      count(p, "potion") +
      " POTIONS · " +
      count(p, "arrow") +
      " ARROWS · DASH " +
      (p.dodge > 0 ? p.dodge.toFixed(1) + "s" : "READY");
    if (p.staminaBoost > 0)
      traps.textContent += " · STAMINA " + Math.ceil(p.staminaBoost) + "s";
    info.append(progress, traps);
    const mana = document.createElement("div");
    mana.className = "mana-meter";
    if (ITEMS[p.equipment?.hand1]?.magic) {
      const label = document.createElement("small");
      label.textContent =
        Math.floor(p.mana ?? 100) + " / " + (p.maxMana || 100) + " MANA";
      const track = document.createElement("div");
      track.className = "health-track mana-track";
      const bar = document.createElement("i");
      bar.style.width = ((p.mana ?? 100) / (p.maxMana || 100)) * 100 + "%";
      track.append(bar);
      mana.append(label, track);
    }
    el.append(name, health, info, mana);
    const existing = [...$("roster").children].find((card) => card.hero === p);
    if (existing) {
      existing.className = el.className;
      existing.style.cssText = el.style.cssText;
      existing.replaceChildren(name, health, info, mana);
      return existing;
    }
    el.hero = p;
    return el;
  });
  for (const card of [...$("roster").children])
    if (!elements.includes(card)) card.remove();
  elements.forEach((card, index) => {
    if ($("roster").children[index] !== card)
      $("roster").insertBefore(card, $("roster").children[index] || null);
  });
}
function updateHud() {
  game.controlLabels = controlLabels(mapping);
  const p = game.current;
  $("round-label").textContent = "ROUND " + String(game.round).padStart(2, "0");
  $("turn-label").textContent = p
    ? p.name + "'s turn"
    : "First hits set turn order";
  $("turn-dot").style.background = p?.color || "#d5ad64";
  $("turn-dot").style.color = p?.color || "#d5ad64";
  $("turn-caption").textContent =
    game.phase === "won"
      ? "INTERACT: VICTORY CHEST · STRIKE: NEW JUNGLE"
      : game.players.some((p) => p.progress >= FINISH)
        ? "FINISHER: HOLD INTERACT AT TABLE TO CALL WILDBOUND"
        : game.roll
          ? "THE DICE HAVE SPOKEN"
          : game.players.every((p) => p.progress >= FINISH)
            ? "CLEAR THE JUNGLE & SEAL THE BOARD"
            : "HIT THE TABLE TO ROLL";
  $("threat-label").textContent =
    game.enemies.length + " CREATURE" + (game.enemies.length === 1 ? "" : "S");
  $("game-toast").textContent = game.log[0] || "";
  $("game-toast").classList.toggle('hidden',!!(game.event&&game.eventTime>0&&!profiles.error&&(game.log[0]||'').startsWith(game.event.name)));
  if (profiles.error)
    $("game-toast").textContent = "SAVE FAILED: " + profiles.error;
  $("event-card").classList.toggle(
    "hidden",
    !game.event || game.eventTime <= 0,
  );
  if (game.event) {
    $("event-card").style.opacity = String(
      Math.max(
        0,
        Math.min(
          1,
          ((game.eventDuration || 7) - game.eventTime) / 0.4,
          game.eventTime / 1.1,
        ),
      ),
    );
    $("event-name").textContent = game.event.name;
    $("event-verse").textContent = game.event.verse;
    $("event-tip").textContent = game.event.tip;
    $('event-progress').style.transform='scaleX('+Math.max(0,game.eventTime/(game.eventDuration||7))+')';
    if($('event-portrait').dataset.event!==game.event.name){
      const canvas=$('event-portrait'),c=canvas.getContext('2d');canvas.dataset.event=game.event.name;c.clearRect(0,0,144,144);c.imageSmoothingEnabled=false;
      c.strokeStyle='#c6ad6560';c.lineWidth=1;c.beginPath();c.arc(72,72,62,0,Math.PI*2);c.stroke();
      if(creatures[game.event.kind])lobbyAnimator.draw(c,{kind:game.event.kind,x:72,y:83,faceX:-1,faceY:1,state:'idle',hp:100,step:0},0,82);
      else {c.fillStyle='#dbc48a';c.font='64px Georgia';c.textAlign='center';c.fillText('✦',72,96);}
      $('event-count').textContent=game.event.count?game.event.count+' CREATURE'+(game.event.count===1?'':'S'):'WORLD EVENT';
    }
  }
  $("dice-result").classList.toggle(
    "hidden",
    !game.roll || game.roll.elapsed < 1.6,
  );
  if (game.roll && game.roll.elapsed >= 1.6)
    $("dice-result").textContent =
      game.roll.dice.join(" + ") + " = " + game.roll.total;
  $("game-hint").textContent = game.openingBoard
    ? "The board is waking. Hit it to roll; movement unlocks when the first event appears."
    : game.locked
      ? controlHelp(mapping) + " · Field Kit: " + game.controlLabels.field
      : "First round: use a controller to control your solo hero; Start/Menu on an unused controller or Enter adds a player";
  renderRoster();
}
function disconnected() {
  const pads = navigator.getGamepads?.() || [];
  if(!audio.unlocked&&Array.from(pads).some(p=>p?.buttons.some(b=>b.pressed)))startMusic();
  return game.players.filter(
    (p) => p.device.startsWith("pad:") && !pads[Number(p.device.split(":")[1])],
  );
}
function pause(reason) {
  if (screen !== "play") return;
  paused = true;
  persistSession();
  if (rooms.role !== "client") profiles.capture(game);
  keys.clear();
  mouse.down = false;
  const ended = ["won", "lost"].includes(game.phase);
  $("pause-eyebrow").textContent =
    game.phase === "won"
      ? "THE JUNGLE REMEMBERS YOUR NAMES"
      : game.phase === "lost"
        ? "THE BOARD IS STILL WAITING"
        : "TAKE A BREATH";
  $("pause-title").textContent =
    game.phase === "won"
      ? "You sealed the board."
      : game.phase === "lost"
        ? "The jungle won this time."
        : "The jungle can wait.";
  $("pause-text").textContent =
    reason ||
    (game.phase === "won"
      ? game.cleared + " creatures cleared. Everyone made it home."
      : game.phase === "lost"
        ? "Stay close, dodge the warning marks, and use your traps."
        : "Your expedition is paused.");
  $("resume-button").classList.toggle("hidden", ended);
  $("reassign-button").classList.toggle(
    "hidden",
    !disconnected().length || game.players.some((p) => p.device === "keyboard"),
  );
  if (!$("pause-dialog").open) {
    $("pause-dialog").showModal();
    const initial =
      game.phase === "play" ? $("resume-button") : $("restart-button");
    initial.focus();
  }
}
function resume() {
  if (disconnected().length) {
    $("pause-text").textContent =
      "Reconnect the missing controller and press a button, or assign keyboard control.";
    return;
  }
  $("pause-dialog").close();
  paused = false;
  keys.clear();
}
$("local-button").onclick = newLobby;
$("begin-button").onclick = startGame;
$('party-settings').onclick=()=>$('settings-button').click();
for(const button of document.querySelectorAll('[data-option-target]')){
  const select=$(button.dataset.optionTarget);
  const label={environment:'Map','dice-count':'Dice',difficulty:'Difficulty'}[button.dataset.optionTarget];
  const update=()=>{if(select.id==='difficulty')$('difficulty-description').textContent={gentle:'Gentle · Each hit deals only 1 damage. A relaxed expedition.',adventure:'Adventure · Take 35% less damage. The balanced adventure.',wild:'Wild · Full enemy damage. For a tougher expedition.'}[select.value];button.textContent=label+'   ‹  '+select.options[select.selectedIndex].text+'  ›';button.setAttribute('aria-label',label+': '+select.options[select.selectedIndex].text);};
  button.onclick=()=>{select.selectedIndex=(select.selectedIndex+1)%select.options.length;select.dispatchEvent(new Event('change'));update();};
  button.changeOption=delta=>{select.selectedIndex=(select.selectedIndex+delta+select.options.length)%select.options.length;select.dispatchEvent(new Event('change',{bubbles:true}));update();};update();
}
$("back-home").onclick = () => show("home");
$("how-button").onclick = () => $("info-dialog").showModal();
$("close-info").onclick = () => $("info-dialog").close();
$("nav-play").onclick = () => {
  if (screen === "play") {
    pause();
    return;
  }
  show("home");
};
$("home-link").onclick = (e) => {
  e.preventDefault();
  if (screen === "play") pause();
  else show("home");
};
$("nav-workshop").onclick = () => {
  if (screen === "play") {
    pause("Return to the landing screen before editing sprites.");
    return;
  }
  show("workshop");
};
$("pause-button").onclick = () => pause();
$("board-button").onclick = () => (boardPinned = !boardPinned);
$("close-board").onclick = () => {
  boardPinned = false;
  boardDismissedRoll = game.roll;
};
$("resume-button").onclick = resume;
$("pause-dialog").addEventListener("cancel", (e) => {
  e.preventDefault();
  if (game.phase === "play") resume();
});
$("restart-button").onclick = () => {
  $("pause-dialog").close();
  newLobby();
};
$("quit-button").onclick = () => {
  profiles.capture(game);
  persistSession();
  $("pause-dialog").close();
  paused = false;
  show("home");
};
$("reassign-button").onclick = () => {
  const p = disconnected()[0];
  if (p && !game.players.some((q) => q.device === "keyboard"))
    p.device = "keyboard";
  pause("Keyboard assigned. Press Back to the Jungle to continue.");
};
$("settings-button").onclick = () => {
  if (screen === "play") pause();
  $("settings-dialog").showModal();
  renderPlayerMappings($("player-mappings"), game, mapping);
};
$("close-settings").onclick = () => $("settings-dialog").close();
$("pvp-toggle").checked=game.pvp;
$("pvp-toggle").onchange=e=>{game.pvp=e.target.checked;localStorage.setItem("wildbound-pvp",game.pvp?"on":"off");game.persist();};
$("sound-toggle").checked = soundEnabled;
$("sound-toggle").onchange = (e) => {
  soundEnabled = e.target.checked; audio.enabled=soundEnabled; audio.apply();
  localStorage.setItem("wildbound-sound", soundEnabled ? "on" : "off");
  if (soundEnabled) startMusic();
  else music.pause();
};
$("music-volume").value = String(musicVolume);
$('music-track').append(new Option('Random expedition soundtrack','random'));$('music-track').disabled=true;
$('music-status').textContent='Curious Groove in the menu; a random adventure track for each expedition.';
$('music-volume').oninput=e=>{musicVolume=Number(e.target.value);localStorage.setItem('wildbound-music-volume',String(musicVolume));if(musicVolume>0)startMusic();};
for(const key of ['master','sfx','ui','ambience']){const label=document.createElement('label');label.className='field-label';label.textContent=key.toUpperCase()+' VOLUME';const input=document.createElement('input');input.type='range';input.min=0;input.max=1;input.step=.01;input.id=key+'-volume';input.value=audio.settings[key];input.setAttribute('aria-label',label.textContent);input.oninput=()=>audio.set(key,input.value);label.append(input);$('audio-mixer').append(label);}
$('audio-night').checked=audio.settings.night;$('audio-night').onchange=e=>audio.set('night',e.target.checked);
$('audio-test').onclick=()=>{startMusic();audio.play('loot');};
$("fullscreen-button").onclick = () => {
  if (window.desktop) window.desktop.fullscreen();
  else if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
};
for (const [action, value] of Object.entries(mapping)) {
  const label = document.createElement("label");
  label.textContent = action[0].toUpperCase() + action.slice(1);
  const input = document.createElement("select");
  input.dataset.mapping = action;
  for(let n=0;n<32;n++) input.append(new Option(`${PAD_NAMES[n] || 'Button'} · ${n}`, n));
  input.value = value;
  input.onchange = () => {
    const old = mapping[action], next = Number(input.value);
    const other = Object.keys(mapping).find(k=>k!==action && mapping[k]===next);
    if(other) { mapping[other]=old; document.querySelector(`[data-mapping="${other}"]`).value=old; }
    mapping[action] = Math.max(
      0,
      Math.min(31, Math.floor(Number(input.value) || 0)),
    );
    localStorage.setItem("wildbound-mapping", JSON.stringify(mapping));
    renderPlayerMappings($("player-mappings"), game, mapping);
  };
  label.append(input);
  $("mapping-fields").append(label);
}
window.addEventListener("keydown", (e) => {
  const editing = ["INPUT", "SELECT", "TEXTAREA"].includes(
    document.activeElement.tagName,
  );
  if (editing) return;
  if (
    screen === "play" &&
    ["Tab", "Enter"].includes(e.key) &&
    game.players.some((p) => p.device === "keyboard" && p.ui)
  )
    e.preventDefault();
  const hero = game.players.find((p) => p.device === "keyboard");
  if (
    screen === "play" &&
    e.code === "KeyG" &&
    !e.repeat &&
    !document.querySelector("dialog[open]")
  ) {
    e.preventDefault();
    fieldKit.open(hero);
    return;
  }
  if (screen === "play" && hero?.ui && e.key === "Escape") {
    e.preventDefault();
    hero.ui = null;
    return;
  }
  if (
    e.code === "KeyB" &&
    screen === "play" &&
    !document.querySelector("dialog[open]") &&
    !e.repeat
  ) {
    boardPinned = !boardPinned;
    return;
  }
  if (
    e.key === "Escape" &&
    screen === "play" &&
    !document.querySelector("dialog[open]")
  ) {
    e.preventDefault();
    pause();
    return;
  }
  if (document.querySelector("dialog[open]")) return;
  if (
    e.code === "Enter" &&
    rooms.role !== "client" &&
    (screen === "lobby" || (screen === "play" && !paused)) &&
    !e.repeat
  ) {
    const joined = game.addPlayer("keyboard");
    if (joined) {
      if (screen === "play") nameNewCharacter(joined);
      sound("heal");
      if (screen === "lobby") renderLobby();
    }
  }
  if (screen === "play") {
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        e.code,
      )
    )
      e.preventDefault();
    keys.add(e.code);
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  mouse.down = false;
  mouse.dash = false;
  mouse.active = false;
});
$("game-canvas").addEventListener("pointermove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
});
$("game-canvas").addEventListener("pointerdown", (e) => {
  if (e.button === 2) mouse.dash = true;
  if (e.button === 0) {
    mouse.down = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }
});
$("game-canvas").addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("pointerup", () => {
  mouse.down = false;
  mouse.dash = false;
});
window.addEventListener("gamepaddisconnected", (e) => {
  if (
    screen === "play" &&
    game.players.some((p) => p.device === "pad:" + e.gamepad.index)
  )
    pause(
      "Controller disconnected. Reconnect it and press a button to reclaim your explorer.",
    );
});
const previousLobbyAxes = new Map();
function lobbyController(pad, previous) {
  const controls = Array.from(
    document.querySelectorAll(
      "#lobby button:not(:disabled):not(.remove-player), #lobby select:not(:disabled), #lobby input[readonly]",
    ),
  ).filter((el) => el.getClientRects().length && (!el.closest('.player-slot') || el.closest('.player-slot').dataset.device === 'pad:'+pad.index));
  if (!controls.length) return;
  if(pad.buttons[9]?.pressed && !previous[9]) {
    const p=game.players.find(p=>p.device==='pad:'+pad.index);
    if(p&&!profiles.data.heroes.some(h=>h.id===p.profileId)){nameNewCharacter(p);return;}
    if(p)p.ready=true;renderLobby();$('begin-button').click();return;
  }
  const active = controls.indexOf(document.activeElement),
    axis = previousLobbyAxes.get(pad.index) || [0, 0],
    x = Math.abs(pad.axes[0] || 0) > 0.65 ? Math.sign(pad.axes[0]) : 0,
    y = Math.abs(pad.axes[1] || 0) > 0.65 ? Math.sign(pad.axes[1]) : 0,
    left =
      (!!pad.buttons[14]?.pressed && !previous[14]) || (x < 0 && axis[0] >= 0),
    right =
      (!!pad.buttons[15]?.pressed && !previous[15]) || (x > 0 && axis[0] <= 0),
    up =
      (!!pad.buttons[12]?.pressed && !previous[12]) || (y < 0 && axis[1] >= 0),
    down =
      (!!pad.buttons[13]?.pressed && !previous[13]) || (y > 0 && axis[1] <= 0),
    accept = !!pad.buttons[0]?.pressed && !previous[0],
    back = !!pad.buttons[1]?.pressed && !previous[1];
  previousLobbyAxes.set(pad.index, [x, y]);
  if(back){game.players=game.players.filter(p=>p.device!=='pad:'+pad.index);renderLobby();return;}
  if (active < 0 && (left || right || up || down || accept)) {
    const first =
      controls.find((el) => el.dataset.lobbyFocus?.endsWith('-saved')) || controls[0];
    first.focus();
    if (accept) first.click();
    return;
  }
  if (active < 0) return;
  const selected = controls[active];
  if((left||right)&&selected.changeOption){selected.changeOption(right?1:-1);}
  else if ((left || right) && selected instanceof HTMLSelectElement) {
    selected.selectedIndex =
      (selected.selectedIndex + (right ? 1 : selected.options.length - 1)) %
      selected.options.length;
    selected.dispatchEvent(new Event("change", { bubbles: true }));
    selected.dispatchEvent(new Event("input", { bubbles: true }));
    requestAnimationFrame(() =>
      document
        .querySelectorAll(
          "#lobby button:not(:disabled):not(.remove-player), #lobby select:not(:disabled)",
        )
        [active]?.focus(),
    );
  } else if (up || down) {
    controls[
      (active + (down ? 1 : controls.length - 1)) % controls.length
    ].focus();
  }
  if (accept) {
    if (selected instanceof HTMLSelectElement) {
      selected.selectedIndex=(selected.selectedIndex+1)%selected.options.length;
      selected.dispatchEvent(new Event('change',{bubbles:true}));
    } else selected.click();
  }
  if(back){game.players=game.players.filter(p=>p.device!=='pad:'+pad.index);renderLobby();}
}
const previousDialogAxes = new Map();
function dialogController(pad, previous) {
  const dialog = [...document.querySelectorAll("dialog[open]")].at(-1);
  if (!dialog) return;
  if(dialog.dataset.ownerDevice?.startsWith('pad:') && dialog.dataset.ownerDevice!=='pad:'+pad.index)return;
  const controls = Array.from(
    dialog.querySelectorAll(
      "button:not(:disabled), select:not(:disabled), input:not(:disabled), summary",
    ),
  ).filter((el) => {
    if (el.dataset.controllerSkip === "true") return false;
    if(!el.getClientRects().length)return false;
    for(let node=el.parentElement;node&&node!==dialog;node=node.parentElement)
      if(node.tagName==='DETAILS'&&!node.open && !(el.tagName==='SUMMARY'&&el.parentElement===node))return false;
    return true;
  });
  if (!controls.length) return;
  if (
    dialog.id === "field-kit-dialog" &&
    ((pad.buttons[4]?.pressed && !previous[4]) ||
      (pad.buttons[5]?.pressed && !previous[5]))
  ) {
    const tabs = ["Trail", "Storage", "Craft", "Look", "Settings"];
    fieldKit.tab =
      tabs[
        (tabs.indexOf(fieldKit.tab) + (pad.buttons[5]?.pressed ? 1 : 4)) % 5
      ];
    fieldKit.render();
    fieldKit.dialog
      .querySelector(".field-body button,.field-body select")
      ?.focus();
    return;
  }
  const active = controls.indexOf(document.activeElement),
    axis = previousDialogAxes.get(pad.index) || [0, 0],
    x = Math.abs(pad.axes[0] || 0) > 0.65 ? Math.sign(pad.axes[0]) : 0,
    y = Math.abs(pad.axes[1] || 0) > 0.65 ? Math.sign(pad.axes[1]) : 0,
    left =
      (!!pad.buttons[14]?.pressed && !previous[14]) || (x < 0 && axis[0] >= 0),
    right =
      (!!pad.buttons[15]?.pressed && !previous[15]) || (x > 0 && axis[0] <= 0),
    up =
      (!!pad.buttons[12]?.pressed && !previous[12]) || (y < 0 && axis[1] >= 0),
    down =
      (!!pad.buttons[13]?.pressed && !previous[13]) || (y > 0 && axis[1] <= 0),
    accept = !!pad.buttons[0]?.pressed && !previous[0],
    back = !!pad.buttons[1]?.pressed && !previous[1];
  previousDialogAxes.set(pad.index, [x, y]);
  if(dialog.id==='controller-keyboard') {navigateControllerKeyboard(dialog,{left,right,up,down,accept,back},pad,previous);return;}
  if(dialog.id==='character-gallery') {
    if(back){dialog.dispatchEvent(new Event('cancel',{cancelable:true}));return;}
    if(pad.buttons[2]?.pressed&&!previous[2]){dialog.deleteSelected();return;}
    const cards=[...dialog.querySelectorAll('.character-card:not(:disabled)')],index=cards.indexOf(document.activeElement);
    if(index>=0&&(left||right||up||down)){
      const cols=getComputedStyle(dialog.querySelector('.character-gallery-grid')).gridTemplateColumns.split(' ').length;
      const next=index+(left?-1:right?1:up?-cols:cols);
      if(next>=cards.length)dialog.querySelector('.gallery-footer button').focus();else cards[Math.max(0,next)]?.focus();
      document.activeElement.scrollIntoView({block:'nearest'});return;
    }
    if(index<0&&(left||right)){const buttons=[...dialog.querySelectorAll('.gallery-footer button:not(:disabled)')],i=buttons.indexOf(document.activeElement);buttons[(i+(right?1:buttons.length-1))%buttons.length]?.focus();return;}
  }
  if(['delete-character-dialog','rename-character-dialog'].includes(dialog.id)&&(left||right)){controls[(Math.max(0,active)+1)%controls.length]?.focus();return;}
  let selected = controls[active];
  if (active < 0 && (left || right || up || down || accept)) {
    selected = controls[0];
    selected.focus();
  } else if (active >= 0 && (up || down)) {
    selected =
      controls[(active + (down ? 1 : controls.length - 1)) % controls.length];
    selected.focus();
  }
  if ((left || right) && selected instanceof HTMLSelectElement) {
    selected.selectedIndex =
      (selected.selectedIndex + (right ? 1 : selected.options.length - 1)) %
      selected.options.length;
    selected.dispatchEvent(new Event("change", { bubbles: true }));
  }
  selected?.scrollIntoView({block:'nearest'});
  if (accept) {
    if(selected instanceof HTMLSelectElement){selected.selectedIndex=(selected.selectedIndex+1)%selected.options.length;selected.dispatchEvent(new Event('change',{bubbles:true}));}
    else selected?.click();
  }
  if (back) {
    if (dialog.id === "pause-dialog") {
      if (game.phase === "play") resume();
    } else if (dialog.id === "settings-dialog") $("close-settings").click();
    else if (dialog.id === "info-dialog") $("close-info").click();
    else if (dialog.id === "field-kit-dialog") fieldKit.close();
    else if (dialog.id === "character-name-dialog")
      dialog.querySelector(".name-cancel").click();
    else if(['delete-character-dialog','rename-character-dialog'].includes(dialog.id))dialog.dispatchEvent(new Event('cancel',{cancelable:true}));
  }
}
function inputFrame() {
  const inputs = {},
    pads = Array.from(navigator.getGamepads?.() || []).filter(Boolean);
  const now = performance.now(), claimSupported = !!window.desktop?.claimController;
  const seenControllerClaims = new Set();
  for (const pad of pads) {
    let previous = previousPads.get(pad.index) || [];
    const modal = !!document.querySelector("dialog[open]"),
      rising = pad.buttons.some((b, i) => b.pressed && !previous[i]);
    let joinedNow = false;
    // Reclaim an existing explorer before considering drop-in character creation.
    // Solo mouse-started expeditions should work as soon as a controller is used.
    const device = "pad:" + pad.index;
    const active = rising || pad.axes.slice(0, 2).some((v) => Math.abs(v) > 0.35);
    const claimKey = controllerClaimKey(pad), ownedKey = controllerClaims.get(pad.index);
    controllerLastSeen.set(claimKey, now);
    if (ownedKey === claimKey) {
      seenControllerClaims.add(claimKey);
    } else if (claimSupported) {
      if (active && document.hasFocus()) requestControllerClaim(pad, claimKey);
      previousPads.set(pad.index, pad.buttons.map((b) => b.pressed));
      continue;
    }
    if (active && screen === "play" && rooms.role !== "client" &&
        !game.players.some((p) => p.device === device)) {
      const connected = new Set(pads.map((p) => "pad:" + p.index));
      const missing = game.players.find((p) => p.device.startsWith("pad:") && !connected.has(p.device));
      const solo = !modal && game.players.length === 1 && game.players[0].device === "keyboard" &&
        !pad.buttons[9]?.pressed ? game.players[0] : null;
      const reclaim = (!modal || $("pause-dialog").open) && (missing || solo);
      if (reclaim) {
        reclaim.device = device;
        joinedNow = true;
        previous = pad.buttons.map((b) => b.pressed);
        if ($("pause-dialog").open) $("pause-text").textContent =
          "Controller reconnected. Resume when everyone is ready.";
      }
    }
    if (modal) dialogController(pad, previous);
    if (
      !modal &&
      screen === "play" &&
      game.players.some((p) => p.device === device) &&
      pad.buttons[mapping.field]?.pressed &&
      !previous[mapping.field]
    ) {
      fieldKit.open(game.players.find((p) => p.device === "pad:" + pad.index));
      previousPads.set(
        pad.index,
        pad.buttons.map((b) => b.pressed),
      );
      continue;
    }
    if (
      rising &&
      !joinedNow &&
      rooms.role !== "client" &&
      (screen === "lobby" || (screen === "play" && !game.locked && pad.buttons[9]?.pressed && !previous[9])) &&
      !modal
    ) {
      const joined = game.addPlayer("pad:" + pad.index);
      if (joined) {
        joinedNow = true;
        if (screen === "play") nameNewCharacter(joined);
        sound("heal");
        if (screen === "lobby") {renderLobby();document.querySelector(`[data-device="pad:${pad.index}"] [data-lobby-focus$="-saved"]`)?.focus();}
      }
    }
    const pressed = (key) => !joinedNow && (pad.buttons[mapping[key]]?.pressed || false);
    if (screen === "lobby" && !modal && !joinedNow) {
      const picker=document.querySelector(`.character-gallery[data-owner-device="${device}"]`);
      if(picker){picker.handleController(pad,previous);previousPads.set(pad.index,pad.buttons.map(b=>b.pressed));continue;}
      lobbyController(pad, previous);
      if(screen!=='lobby') {previousPads.set(pad.index,pad.buttons.map(b=>b.pressed));continue;}
    }
    if (
      screen === "lobby" &&
      ((pad.buttons[4]?.pressed && !previous[4]) ||
        (pad.buttons[5]?.pressed && !previous[5]))
    ) {
      const p = game.players.find((p) => p.device === "pad:" + pad.index),
        options = profiles.data.heroes.filter(
          (h) => !game.players.some((q) => q !== p && q.profileId === h.id),
        );
      if (p && options.length) {
        const n = options.findIndex((h) => h.id === p.profileId);
        profiles.assign(p, options[(n + 1) % options.length]);
        renderLobby();
      }
    }
    if (
      pressed("board") &&
      !previous[mapping.board] &&
      screen === "play" &&
      game.players.some((p) => p.device === device) &&
      !game.players.find((p) => p.device === "pad:" + pad.index)?.ui &&
      !modal
    )
      boardPinned = !boardPinned;
    if (pressed("pause") && !previous[mapping.pause] && screen === "play" && game.players.some((p) => p.device === device)) {
      if (paused && $("pause-dialog").open && game.phase === "play") resume();
      else if (!modal) pause();
    }
    const dead = (v) => (Math.abs(v || 0) < 0.18 ? 0 : v);
    inputs["pad:" + pad.index] = {
      x: dead(pad.axes[0]),
      y: dead(pad.axes[1]),
      aimX: dead(pad.axes[2]),
      aimY: dead(pad.axes[3]),
      attack: pressed("attack"),
      loot: pressed("loot"),
      jump: pressed("jump"),
      dodge: pressed("dodge") || pad.buttons[7]?.pressed,
      trap: pressed("trap"),
      interact: pressed("interact"),
      potion: pressed("potion"),
      block: pressed("block"),
      inventory: pressed("inventory"),
      portal: pressed("portal"),
      bait: pressed("bait"),
      next: !!pad.buttons[15]?.pressed || dead(pad.axes[0]) > 0.5,
      prev: !!pad.buttons[14]?.pressed || dead(pad.axes[0]) < -0.5,
      up: !!pad.buttons[12]?.pressed || dead(pad.axes[1]) < -0.5,
      down: !!pad.buttons[13]?.pressed || dead(pad.axes[1]) > 0.5,
      panel: !!pad.buttons[4]?.pressed || !!pad.buttons[5]?.pressed,
      use: !!pad.buttons[0]?.pressed,
      store: !!pad.buttons[2]?.pressed,
      offhand: !!pad.buttons[3]?.pressed,
      close: !!pad.buttons[1]?.pressed,
    };
    previousPads.set(
      pad.index,
      pad.buttons.map((b) => b.pressed),
    );
  }
  if (claimSupported) {
    for (const [index, key] of controllerClaims) {
      if (!seenControllerClaims.has(key) && now - (controllerLastSeen.get(key) || 0) > 1500)
        releaseControllerClaim(key);
    }
  }
  if (screen === "lobby") {
    $("device-status").textContent = pads.length
      ? pads
          .map(
            (p) =>
              p.id +
              " · sticks " +
              p.axes
                .slice(0, 2)
                .map((v) => v.toFixed(1))
                .join(", ") +
              " · buttons " +
              (p.buttons
                .map((b, i) => (b.pressed ? i : null))
                .filter((i) => i !== null)
                .join(", ") || "—"),
          )
          .join(" | ")
      : "No active controllers yet. Connect them, then press a button. Enter joins with keyboard & mouse.";
  }
  const p = game.players.find((p) =>
      rooms.role === "client"
        ? p.id === rooms.playerId
        : p.device === "keyboard",
    ),
    aim =
      mouse.active && renderer && p
        ? renderer.screenToWorld(mouse.x, mouse.y)
        : null;
  inputs.keyboard = {
    x:
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
    y:
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0),
    aimX: aim ? aim.x - p.x : 0,
    aimY: aim ? aim.y - p.y : 0,
    attack: mouse.down || keys.has("KeyF"),
    jump: keys.has("KeyJ"),
    dodge: keys.has("Space") || mouse.dash,
    trap: keys.has("KeyQ"),
    interact: keys.has("KeyE"),
    potion: keys.has("KeyH"),
    block: keys.has("KeyC"),
    inventory: keys.has("KeyI"),
    portal: keys.has("KeyP"),
    bait: keys.has("KeyT"),
    next: keys.has("ArrowRight"),
    prev: keys.has("ArrowLeft"),
    up: keys.has("ArrowUp"),
    down: keys.has("ArrowDown"),
    panel: keys.has("Tab"),
    use: keys.has("Enter"),
    store: keys.has("KeyR"),
    offhand: keys.has("Digit2"),
    drop: keys.has("Delete"),
  };
  return inputs;
}
let last = performance.now(),
  hudAge = 0;
let saveAge = 0;
const menuHeldInputs = new Map();
function frame(now) {
  const elapsed = Math.max(0, (now - last) / 1000);
  const dt = Math.min(elapsed, 0.05);
  metrics.record("frame", elapsed * 1000);
  last = now;
  if (ready) {
    designer?.animate(dt);
    const wasBlocked = paused || !!document.querySelector('dialog[open]');
    const inputs = inputFrame();
    const blocked = wasBlocked || paused || !!document.querySelector('dialog[open]');
    for(const [device,input] of Object.entries(inputs)) {
      const held=menuHeldInputs.get(device)||new Set();
      for(const [key,value] of Object.entries(input)) if(typeof value==='boolean') {
        if(blocked && value) held.add(key);
        if(!value) held.delete(key);
        if(blocked || held.has(key)) input[key]=false;
      }
      menuHeldInputs.set(device,held);
    }
    if(blocked) for(const p of game.players){p.charge=0;p.previousInput={};p.interactTime=0;p.interactUsed=false;}
    if (screen === "home") drawMenu($("menu-art"), assets, now / 1000);
    if (screen === "workshop") {
      workshop.animate(now / 1000);
      framesWorkshop?.animate(now / 1000);
    }
    if (screen === "play" && renderer) {
      const effective = rooms.tick(game, dt, inputs);
      if (!paused && rooms.role !== "client")
        metrics.measure("simulation", () =>
          fixedClock.advance(elapsed, (step) => game.update(step, effective)),
        );
      else fixedClock.reset();
      saveAge += dt;
      if (saveAge > 5 && !paused && rooms.role !== "client") {
        persistSession();
        profiles.capture(game);
        saveAge = 0;
      }
      renderer.animator.metrics = metrics;
      metrics.measure("world", () => renderer.draw(game, dt));
      metrics.measure("inventory", () =>
        heroUI.draw(
          game,
          renderer,
          rooms.role === "client" ? rooms.playerId : null,
        ),
      );
      fieldKit.tick(now / 1000);
      const boardVisible =
        boardPinned || (!!game.roll && game.roll !== boardDismissedRoll);
      $("board-panel").classList.toggle("hidden", !boardVisible);
      if (boardVisible) {
        const c = $("board-closeup").getContext("2d");
        c.imageSmoothingEnabled = false;
        c.clearRect(0, 0, 560, 380);
        c.save();
        c.translate(280, 185);
        c.scale(2, 2);
        drawBoard(c, game, game.time, { closeup: true });
        c.restore();
        $("board-caption").textContent = game.roll
          ? game.roll.resolved
            ? "The figure has landed. The jungle answers."
            : game.roll.elapsed < 1.6
              ? "The dice are rolling…"
              : "Moving space " +
                Math.min(48, Math.ceil(game.current.boardProgress)) +
                " · " +
                game.roll.total +
                " rolled"
          : "Figures walk every space. The jungle keeps moving.";
      }
      hudAge += dt;
      if (hudAge > 0.12) {
        updateHud();
        hudAge = 0;
      }
      if (game.phase === "won" && !game.victoryShown) {
        game.victoryShown = true;
        boardPinned = false;
      }
      if (game.phase === "lost" && !paused) pause();
    }
  }
  if (ready && screen === "lobby") rooms.tick(game, dt, {});
  if(!audio.unlocked&&Array.from(navigator.getGamepads?.()||[]).some(p=>p?.buttons.some(b=>b.pressed)))startMusic();
  routeMusic(); audio.update(game,screen==="play"&&!paused);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
try {
  await assets.load();
  workshop = new Workshop(assets);
  framesWorkshop = new FrameWorkshop(assets);
  designer = new Designer(assets, EVENTS, ITEMS, () => {
    for (const e of game.enemies) game.configureCreature(e);
    game.persist();
  });
  window.addEventListener('rig-sprite-edit', ({detail})=>{
    const priorScreen=screen, priorPaused=paused;
    const original={sprite:workshop.sprite,name:workshop.name,history:workshop.history,future:workshop.future};
    designer.dialog.close();show('workshop');paused=true;
    const finish=()=>{workshop.attachmentSave=null;Object.assign(workshop,original);back.remove();$('save-sprite').textContent='SAVE SPRITE';show(priorScreen);paused=priorPaused;designer.dialog.showModal();designer.playerStudio.animate(0);};
    const back=document.createElement('button');back.textContent='Cancel and return to rig';back.className='full';back.onclick=finish;$('save-sprite').after(back);
    workshop.name=detail.name;workshop.sprite=structuredClone(detail.sprite);workshop.history=[];workshop.future=[];workshop.layer='art';$('sprite-layer').value='art';$('sprite-name').value=detail.name;
    workshop.attachmentSave=async(sprite)=>{await detail.apply(sprite);finish();};$('save-sprite').textContent='SAVE TO BONE & RETURN';workshop.render();
  });
  const studioButton = document.createElement("button");
  studioButton.textContent = "ANIMATION & GAME STUDIO";
  studioButton.className = "text-button";
  $('party-menu').append(studioButton);studioButton.textContent='Rig studio';
  studioButton.onclick = () => {
    if (screen === "play") paused = true;
    designer.tab = "Players";
    designer.open();
  };
  designer.dialog.addEventListener("close", () => {
    if (screen === "play" && !$("pause-dialog").open) paused = false;
  });
  const resume = document.createElement("button");
  resume.textContent = "CONTINUE EXPEDITION";
  resume.className = "text-button";
  $('party-menu').prepend(resume);resume.textContent='Continue';
  resume.onclick = async () => {
    try {
      const saved = window.desktop
        ? await window.desktop.loadSession()
        : JSON.parse(localStorage.getItem("wildbound-session") || "null");
      if (!saved) throw Error("No saved expedition yet. Start a party first.");
      if(saved.state?.players?.some(p=>profiles.data.deletedIds?.includes(p.profileId))){newLobby();$('party-status').textContent='A saved explorer was deleted. Gather a new party.';return;}
      rooms.role = null;
      window.desktop?.stopRoom();
      game = restoreSession(saved);
      const stash = game.sharedStash;
      wireGame();
      game.sharedStash = stash;
      applyChangedHouse(game);
      renderer = new Renderer($("game-canvas"), assets);
      show("play");
      paused = false;
      if (disconnected().length)
        pause("Reconnect saved controllers, or reassign keyboard.");
    } catch (e) {
      roomDialog.showModal();
      $("room-status").textContent = e.message;
    }
  };
  ready = true;
  newLobby();
  $("loading").classList.add("done");
} catch (e) {
  $("loading").querySelector("p").textContent =
    "Could not load game assets. Restart the app.";
  console.error(e);
}

if (
  window.desktop?.testMode ||
  new URLSearchParams(location.search).has("tools")
) {
  const { installDebugTools } = await import("./src/debug-tools.mjs");
  installDebugTools({
    get drawPlayer() {
      return drawPlayer;
    },
    get fieldKit() {
      return fieldKit;
    },
    get metrics() {
      return metrics;
    },
    get Animator() {
      return Animator;
    },
    get assets() {
      return assets;
    },
    get RIG_SUBJECTS() {
      return RIG_SUBJECTS;
    },
    get DIRECTIONS() {
      return DIRECTIONS;
    },
    get directionVector() {
      return directionVector;
    },
    get game() {
      return game;
    },
    set game(value) {
      game = value;
    },
    get updateHud() {
      return updateHud;
    },
    get $() {
      return $;
    },
    get designer() {
      return designer;
    },
    set designer(value) {
      designer = value;
    },
    get Game() {
      return Game;
    },
    get wireGame() {
      return wireGame;
    },
    get renderer() {
      return renderer;
    },
    set renderer(value) {
      renderer = value;
    },
    get Renderer() {
      return Renderer;
    },
    get show() {
      return show;
    },
    get paused() {
      return paused;
    },
    set paused(value) {
      paused = value;
    },
    get boardPinned() {
      return boardPinned;
    },
    set boardPinned(value) {
      boardPinned = value;
    },
    get ITEM_ART_TYPES() {
      return ITEM_ART_TYPES;
    },
    get FINISH() {
      return FINISH;
    },
    get CENTER() {
      return CENTER;
    },
    get give() {
      return give;
    },
    get equip() {
      return equip;
    },
    get heroUI() {
      return heroUI;
    },
    get newLobby() {
      return newLobby;
    },
    get lobbyController() { return lobbyController; },
    get renderLobby() {
      return renderLobby;
    },
    get workshop() {
      return workshop;
    },
    set workshop(value) {
      workshop = value;
    },
    get replaceLionMotion() {
      return replaceLionMotion;
    },
    get defaultLionMotion() {
      return defaultLionMotion;
    },
    get MUSIC_TRACKS() {
      return MUSIC_TRACKS;
    },
    get selectedMusic() {
      return selectedMusic;
    },
    set selectedMusic(value) {
      selectedMusic = value;
    },
    get music() {
      return music;
    },
    get EVENTS() {
      return EVENTS;
    },
    get validateSprite() {
      return validateSprite;
    },
    get nameNewCharacter() {
      return nameNewCharacter;
    },
    get profiles() {
      return profiles;
    },
    get screen() {
      return screen;
    },
    set screen(value) {
      screen = value;
    },
    get keys() {
      return keys;
    },
    get mouse() {
      return mouse;
    },
    get convertRegion() {
      return convertRegion;
    },
    get previousPads() {
      return previousPads;
    },
    get inputFrame() {
      return inputFrame;
    },
    get startGame() {
      return startGame;
    },
    get Assets() {
      return Assets;
    },
    get renderRoster() {
      return renderRoster;
    },
    get heroRoot() {
      return heroRoot;
    },
    get count() {
      return count;
    },
    get Profiles() {
      return Profiles;
    },
    get saveSession() {
      return saveSession;
    },
    get restoreSession() {
      return restoreSession;
    },
    get creatures() {
      return creatures;
    },
    get playerMotion() {
      return playerMotion;
    },
    get replacePlayerMotion() {
      return replacePlayerMotion;
    },
    get projectPoint() {
      return projectPoint;
    },
    get poseAt() {
      return poseAt;
    },
    get lionMotion() {
      return lionMotion;
    },
  });
}

