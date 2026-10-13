import {drawTempleRoom} from './temple.mjs';
import {drawWetDrips} from './wet-weather.mjs';
import {drawBansheeSteps} from './banshee-steps.mjs';
import {merchantPanel} from './traveling-merchant.mjs';
import {npcDialoguePanel,drawNpcDialoguePortraits} from './npc-dialogue-ui.mjs';
import {getNpcQuestRevision} from './npc-quest-data.mjs';
import {quiverType} from './quiver.mjs';
import { bagAccepts, storeInBag, takeFromBag } from './inventory-containers.mjs';
import {GEAR_SETS,setProgress,socketCount,gearStat,RARITIES} from './items.mjs';
import {drawSocketWorkshop} from './socket-workshop.mjs';
import {salvageYield,salvageReason,salvageProgress} from './salvage.mjs';
import {inventoryToolbar} from './inventory-toolbar.mjs';
import {guardInventoryKeys} from './inventory-input.mjs';
import {Animator} from './animation.mjs';
import {drawOldWellRoom,wellForPlayer,WELL_TITLE} from './old-well.mjs';
import {drawRoomSpellEffects} from './room-spell-effects.mjs';
import { compareItem, itemStatDelta, canAccess, protectedItem } from "./field-systems.mjs";
import { controllerButtonNames, controllerFamily, CONTROLLER_NAMES } from "./controls.mjs";
import { chestName } from "./items.mjs";
import { ROOM_STATIONS } from "./shops.mjs";
import { drawStorageRobot, drawRobotPortrait } from "./robot-art.mjs";
import {drawStorageBackdrop,drawStorageChest,drawStorageLight,drawStorageDust} from './storage-art.mjs';
import {storageVisualActor} from './storage-room.mjs';
import {robotOnline,nearStorageRobot,ROBOT_REPAIR_SECONDS} from './storage-repair.mjs';
import { drawPortal } from "./portal-art.mjs";
import { shopPanel, drawVending } from "./shop-ui.mjs";
import { defaultPlayerMotion, drawPlayer } from "./player-motion.mjs";
import { ITEMS, SLOTS, count, itemKind, itemStats, sellValue } from "./items.mjs";
import { drawItem } from "./item-art.mjs";
const el = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
function liveControllerFamily(player) {
  if (player?.device?.startsWith('pad:')) {
    const index = Number(player.device.slice(4));
    const pad = Array.from(globalThis.navigator?.getGamepads?.() || []).find(item => item?.index === index);
    if (pad) return controllerFamily(pad);
  }
  return player?.controllerFamily || 'generic';
}
export class HeroUI {
  constructor(root) {
    this.root = root;
    this.panels = new Map();
    this.panelAnchors = new Map();
    root.addEventListener('keydown',guardInventoryKeys,true);
  }
  controllerText(game, p) {
    if (p.device === 'keyboard') return { accept:'Enter', collect:'2', close:'Esc', select:'Arrows', tabs:'Tab' };
    const names = controllerButtonNames(liveControllerFamily(p));
    return { accept:names[0], collect:names[3], close:names[1], select:'D-pad', tabs:`${names[4]} / ${names[5]}` };
  }
  itemTooltip(panel, button, game, p, item) {
    const def = ITEMS[item?.type];
    if (!def) return;
    const show = () => {
      let tip = panel.querySelector('.item-tooltip');
      if (!tip) { tip = el('div', null, 'item-tooltip'); panel.append(tip); }
      const name=el('strong',def.name,'item-name');
      name.style.color=RARITIES[def.rarity]||RARITIES.common;
      tip.replaceChildren(name);
      if (def.description) tip.append(el('p', def.description));
      if (button.dataset.tooltipExtra) tip.append(el('p',button.dataset.tooltipExtra,'item-tooltip-price'));
      const stats = el('div', null, 'item-tooltip-stats');
      const base = itemStats(item.type);
      if (base) stats.append(el('span', base, 'item-tooltip-base'));
      for (const delta of itemStatDelta(p, item.type,item.sockets)) {
        const sign = delta.value > 0 ? '+' : '';
        stats.append(el('span', `${delta.label} ${sign}${delta.value}  (${delta.current} â†’ ${delta.next})`, delta.value > 0 ? 'stat-up' : 'stat-down'));
      }
      if (!stats.children.length) stats.append(el('span', 'No equipment stat change', 'item-tooltip-muted'));
      tip.append(stats);
      if(button.dataset.mode==='pack'&&salvageYield(item.type,item).length){
        tip.append(el('p','Salvage one: '+salvageYield(item.type,item).map(v=>v.qty+' '+ITEMS[v.type].name).join(' + ')+'. Hold '+(p.device==='keyboard'?'V':controllerButtonNames(liveControllerFamily(p))[7])+' for 1.25 seconds.','item-tooltip-salvage'));
      }
      if (def.set && GEAR_SETS[def.set]) {
        const set = setProgress(p, def.set), checklist = el('section', null, 'item-tooltip-set');
        checklist.append(el('strong', `${set.name} Â· ${set.count}/${set.checks.length}`));
        for (const part of set.checks)
          checklist.append(el('div', (part.equipped ? 'âœ“ ' : 'â—‹ ') + part.ids.map(id => ITEMS[id].name).join(' / '), part.equipped ? 'set-active' : 'set-missing'));
        if (set.threeText) checklist.append(el('p', '3 pieces Â· ' + set.threeText, set.count >= 3 ? 'set-active' : 'set-missing'));
        if(set.twoText)checklist.append(el('p','2 pieces Â· '+set.twoText,set.count>=2?'set-active':'set-missing'));
        checklist.append(el('p', 'Complete Â· ' + set.fullText, set.complete ? 'set-active' : 'set-missing'));
        tip.append(checklist);
      }
      tip.hidden = false;
      const r = button.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      const scale=pr.width/panel.offsetWidth||1;
      const panelWidth=panel.clientWidth,panelHeight=panel.clientHeight;
      const gap=8,tw=tip.offsetWidth,th=tip.offsetHeight;
      const left=(r.left-pr.left)/scale-panel.clientLeft,right=(r.right-pr.left)/scale-panel.clientLeft,top=(r.top-pr.top)/scale-panel.clientTop,bottom=(r.bottom-pr.top)/scale-panel.clientTop;
      const sideRight=right+gap,sideLeft=left-tw-gap;
      const centeredX=Math.max(4,Math.min(panelWidth-tw-4,(left+right-tw)/2));
      const belowY=bottom+gap,aboveY=top-th-gap;
      const candidates=[
        {x:sideRight,y:Math.max(4,Math.min(panelHeight-th-4,(top+bottom-th)/2)),side:'right',fits:sideRight+tw<=panelWidth-4},
        {x:sideLeft,y:Math.max(4,Math.min(panelHeight-th-4,(top+bottom-th)/2)),side:'left',fits:sideLeft>=4},
        {x:centeredX,y:belowY,side:'bottom',fits:belowY+th<=panelHeight-4},
        {x:centeredX,y:aboveY,side:'top',fits:aboveY>=4},
      ];
      // Gear details sit over the bag, leaving the live character preview visible.
      if(button.dataset.mode==='gear'&&panel.classList.contains('inventory-workbench')){
        const sheet=button.closest('.equipment-window').getBoundingClientRect(),gearBottom=(sheet.bottom-pr.top)/scale-panel.clientTop+gap;
        candidates.unshift({x:centeredX,y:gearBottom,side:'bottom',fits:gearBottom+th<=panelHeight-4});
      }
      // Keep bag contents visible when inspecting backpack/chest items.
      if(button.dataset.mode==='pack'||button.dataset.mode==='chest') candidates.sort((a,b)=>(a.side==='top'?-1:0)-(b.side==='top'?-1:0));
      const placement=candidates.find(candidate=>candidate.fits)||candidates.reduce((best,candidate)=>{
        const visible=Math.max(0,Math.min(panelWidth,candidate.x+tw)-Math.max(0,candidate.x))*Math.max(0,Math.min(panelHeight,candidate.y+th)-Math.max(0,candidate.y));
        return !best||visible>best.visible?{...candidate,visible}:best;
      },null);
      const x=Math.max(4,Math.min(panelWidth-tw-4,placement.x));
      const y=Math.max(4,Math.min(panelHeight-th-4,placement.y));
      tip.style.left=x+'px';tip.style.top=y+'px';
      tip.style.setProperty('--tether-x',Math.max(4,Math.min(tw-4,r.right-pr.left-x))+'px');
      tip.classList.toggle('tooltip-above',placement.side==='top');
      tip.hidden = false;
    };
    const hide = () => { const tip = panel.querySelector('.item-tooltip'); if (tip) tip.hidden = true; };
    button.addEventListener('pointerenter', show, { passive:true });
    button.addEventListener('pointerleave', hide, { passive:true });
    button.addEventListener('focus', show);
    button.addEventListener('blur', hide);
    button.showItemTooltip=show;
  }
  draw(game, renderer, onlyId = null) {
    const wanted = new Set();
    const open = game.players.filter((p) => (onlyId === null || p.id === onlyId) && (p.ui || p.room));
    const bounds = this.root.getBoundingClientRect();
    const layoutKey = [bounds.width, bounds.height, ...open.map((p) => p.id)].join('|');
    let layoutChanged = layoutKey !== this.layoutKey;
    for (const p of game.players) {
      if (onlyId !== null && p.id !== onlyId) continue;
      if (!p.ui && !p.room) continue;
      // A shared underground room is rendered once. The room renderer already
      // draws every occupant, so duplicate room cards only waste half the view.
      if (p.room && !p.ui) {
        const roomLead = game.players.find(q => q.room === p.room && !q.ui);
        if (roomLead && roomLead.id !== p.id) continue;
      }
      wanted.add(p.id);
      if(p.ui)p.ui.ownerDevice??=p.device;
      let panel = this.panels.get(p.id);
      if (!panel) {
        panel = el("section", null, "hero-panel");
        panel.dataset.ownerDevice=p.device;
        this.root.append(panel);
        this.panels.set(p.id, panel);
      }
      panel.dataset.ownerDevice=p.ui?.ownerDevice??p.device;
      const focus = panel.contains(document.activeElement)
        ? document.activeElement.dataset.action
        : null;
      const portal = game.portals.find((door) => door.id === p.room);
      const owner = game.players.find((q) => q.id === portal?.owner);
      if(p.ui&&game.storageFor(p)&&!p.ui.loot){p.ui.loot=true;p.ui.panel='chest';p.ui.index=Math.max(0,game.storageFor(p).findIndex(Boolean));}
      const signature = [
        game.uiRevision || 0,
        p.name,
        liveControllerFamily(p),
        p.level,
        p.xp,
        count(p,'arrow'),
        p.coins,
        p.room,
        owner?.robotRepaired,
        p.ui?.panel,
        p.ui?.index,
        p.ui?.storage,
        p.ui&&game.storageFor(p)?JSON.stringify([p.inventory,game.storageFor(p),canAccess(game,p,true),canAccess(game,p,false)]):'',
        p.ui?.shop,
        p.ui?.shop==='npc-dialogue'?JSON.stringify([getNpcQuestRevision(),p.ui.npcId,p.ui.node,p.ui.offerBranch,p.ui.revision,p.npcQuests,p.inventory,p.equipment,p.appearance]):'',
        p.ui?.robotView,p.ui?.robotIndex,
        p.ui?.shop==='robot'?JSON.stringify([p.inventory,owner?.robotStock]):'',
        p.ui?.notice,
        p.ui&&!p.ui.shop?salvageReason(p):'',
        p.ui?.tab,
        p.ui?.page,game.merchant?.revision,
        JSON.stringify(p.ui?.carry||null),
        JSON.stringify(p.ui?.split || null),
        JSON.stringify(p.ui?.bag || null),
        game.phase, game.environment,
        JSON.stringify(p.ui?.socket||null),
        (p.vendingOrders || []).map((o) => o.ready).join(","),
        portal?.closing == null ? "" : Math.ceil(portal.closing),
        portal?.oldWell?Math.hypot(p.roomX-portal.well.exit.x,p.roomY-portal.well.exit.y)<36:'',
      ].join("|");
      this.preview(panel, p, game.time);
      const repairProgress=panel.querySelector('.robot-repair-progress');
      if(repairProgress){const progress=(p.robotRepair?.progress||0)/ROBOT_REPAIR_SECONDS;repairProgress.style.setProperty('--repair-progress',progress*100+'%');repairProgress.setAttribute('aria-valuenow',String(Math.round(progress*100)));}
      panel.querySelectorAll('.salvage-ring').forEach(r=>{const progress=salvageProgress(p);r.style.setProperty('--salvage-fill',progress*360+'deg');r.setAttribute('aria-valuenow',String(Math.round(progress*100)));});
      // Keep interactive nodes alive between pointerdown and pointerup.
      // Recreating buttons every animation frame prevents native clicks.
      if (panel.uiSignature === signature && panel.hero === p) {
        const canvas = panel.querySelector("canvas.room-view");
        if (canvas) this.room(canvas, game, p, portal, renderer);
        if (p.ui?.shop === "vending")
          drawVending(panel.querySelector(".vending-canvas"), game, p);
        drawRobotPortrait(panel.querySelector(".robot-portrait"), game.time);
        if(p.ui?.shop==='npc-dialogue')drawNpcDialoguePortraits(panel,game,p,renderer?.animator||(this.roomAnimator||=new Animator()));
        continue;
      }
      panel.uiSignature = signature;
      const selectionKey=p.ui?`${p.ui.panel}:${p.ui.index}`:'';
      panel.revealSelection=panel.selectionKey!==undefined&&panel.selectionKey!==selectionKey;
      panel.selectionKey=selectionKey;
      layoutChanged = true;
      panel.hero = p;
      panel.dataset.environment = game.phase === 'lobby' ? 'lobby' : p.room ? 'temple' : game.generatedEnvironment || game.environment || 'forest';
      panel.classList.toggle(
        "storage-session",
        !!(p.ui && p.ui.shop !== "vending" && p.ui.shop !== 'npc-dialogue'),
      );
      panel.classList.toggle("vending-panel", p.ui?.shop === "vending");
      panel.classList.toggle("merchant-session", p.ui?.shop === "merchant");
      panel.classList.toggle('npc-dialogue-session',p.ui?.shop==='npc-dialogue');
      panel.classList.toggle('inventory-redesign', !!p.ui && !p.ui.shop);
      panel.classList.toggle('victory-loot-session', p.ui?.storage === 'victory');
      panel.classList.toggle('tv-victory-loot',p.ui?.storage==='tv-victory');
      panel.classList.toggle('starter-chest-session',p.ui?.storage==='starter');
      panel.classList.toggle('loot-popup',!!game.storageFor(p));
      panel.classList.toggle('socket-session',!!p.ui?.socket);
      panel.classList.toggle('inventory-workbench',!!p.ui&&!p.ui.shop&&!p.ui.socket&&!game.storageFor(p));
      panel.classList.toggle('scrap-shop',p.ui?.shop==='robot');
      panel.classList.toggle('robot-intro-session',p.ui?.shop==='robot-intro');
      panel.classList.toggle('vending-refresh',p.ui?.shop==='vending');
      panel.replaceChildren();
      panel.style.borderColor = p.color;
      const head = el(
        "header",
        panel.classList.contains('inventory-workbench')?`${p.name} Â· LV ${p.level}`:p.name +
          " Â· " +
          (p.ui?.shop === "merchant" ? "TRADING POST" : p.ui?.storage === "victory" ? "VICTORY SPOILS" : wellForPlayer(game,p)?(wellForPlayer(game,p).mausoleum?'MAUSOLEUM CRYPT':WELL_TITLE.toUpperCase()):p.room === "temple-upper" ? "UPPER SANCTUM" : p.room ? "THE BETWEEN" : "BACKPACK") +
          " Â· LV " +
          p.level,
      );
      const progressRow=el('div','','inventory-progress-row');
      const xp=el('div','','inventory-xp'),needed=Math.max(1,p.level||1)*50;
      xp.setAttribute('role','progressbar');xp.setAttribute('aria-label','Experience to next level');
      xp.setAttribute('aria-valuemin','0');xp.setAttribute('aria-valuemax',String(needed));
      xp.setAttribute('aria-valuenow',String(p.xp||0));
      const fill=el('span','','inventory-xp-fill');fill.style.width=Math.min(100,Math.max(0,(p.xp||0)/needed*100))+'%';
      xp.append(fill,el('span',`${p.xp||0} / ${needed} XP`, 'inventory-xp-label'));
      progressRow.append(el('span',(p.coins||0)+' GOLD','coin-balance'),xp);
      panel.append(head,progressRow);
      const button = (text, action, fn) => {
        const b = el("button", text);
        b.dataset.action = action;
        if (action === 'close') b.setAttribute('aria-label', 'Close inventory');
        b.onclick = fn;
        return b;
      };
      panel.append(
        button(
          p.ui ? "\u00d7" : wellForPlayer(game,p)?(wellForPlayer(game,p).mausoleum?'Climb stairs':'Climb rope'):p.room === "temple-upper" ? "Return downstairs" : p.room ? "Return through portal" : "Close",
          "close",
          () => {
            if (p.ui?.socket)game.inventoryAction(p,'close');
            else if (p.ui) p.ui = null;
            else if (p.room) game.leaveRoom(p);
          },
        ),
      );
      const d = game.portals.find((d) => d.id === p.room);
      if(d?.oldWell&&!p.ui){const close=panel.querySelector('[data-action="close"]');close.disabled=p.wellExitArmed===false||Math.hypot(p.roomX-d.well.exit.x,p.roomY-d.well.exit.y)>=36;close.title=d.mausoleum?'Use the stairs in the crypt entrance hall.':'Return at the rope and circle of daylight.';}
      if (d?.closing !== null && d?.closing !== undefined)
        panel.append(
          el(
            "strong",
            "PORTAL COLLAPSES IN " +
              Math.ceil(d.closing) +
              "s Â· EJECTION COSTS 50% MAX HP",
            "portal-warning",
          ),
        );
      if (p.room && !p.ui) {
        const canvas = el("canvas");
        canvas.className = "room-view";
        canvas.width = 320;
        canvas.height = 240;
        canvas.setAttribute('aria-label', d?.mausoleum ? 'Mausoleum crypt map' : 'Underground room map');
        panel.append(canvas);
        this.room(canvas, game, p, d, renderer);
        if(d.oldWell){panel.append(el('p',d.mausoleum?'Explore the candlelit crypt. Interact with the lantern chest and the final coffin. Use the entrance stairs to return to the cemetery.':'Explore the tunnels. Interact at the treasure chest, or at the rope in the circle of daylight to climb out.','well-help'));}
        else if(d.temple){panel.append(el("p","Upper Sanctum Â· walk to the ritual chest and press Interact. The south doorway returns downstairs."),button("Open ritual chest","temple-chest",()=>game.openInventory(p,"temple")));}
        else {
        const owner = game.players.find((q) => q.id === d.owner);
        panel.append(
          el(
            "p",
            owner.name +
              "â€™s private storage Â· chests are north. Move to a chest and press Interact. P / D-pad up returns.",
          ),
        );
        for (let n = 0; n < 3; n++)
          panel.append(
            button(
              chestName(owner, n) +
                " Â· " +
                owner.chests[n].filter(Boolean).length +
                "/24",
              "chest" + n,
              () => game.openInventory(p, n),
            ),
          );
        if(robotOnline(owner))panel.append(button('SCRAP-9 Â· sell / buy back','robot',()=>game.openShop(p,'robot')));
        else{
          const repair=button('Hold to repair SCRAP-9','robot-repair',()=>{});
          repair.title='Stand beside the broken robot and hold Interact, or hold this button, for 2.4 seconds. No materials required.';
          repair.className='robot-repair-button';
          const progress=el('span','','robot-repair-progress');progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Robot repair');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow','0');repair.append(progress);
          repair.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();repair.setPointerCapture(e.pointerId);p.robotRepairPointer=true;};
          const stop=()=>{p.robotRepairPointer=false;};repair.onpointerup=stop;repair.onpointercancel=stop;repair.onlostpointercapture=stop;repair.onblur=stop;
          repair.onkeydown=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();p.robotRepairPointer=true;}};repair.onkeyup=stop;
          panel.append(repair,el('small','Robot offline Â· walk beside it and hold Interact to repair.','robot-repair-help'));
        }
        panel.append(button('Vending machine Â· potions','vending',()=>game.openShop(p,'vending')));
        }
      } else if(p.ui?.shop==='npc-dialogue'){
        panel.npcDialogueControls=this.controllerText(game,p);
        npcDialoguePanel(panel,game,p,button);
      } else if(p.ui?.shop==='robot-intro'){
        const greeting=el('div','','robot-first-meeting');greeting.setAttribute('role','dialog');greeting.setAttribute('aria-label','Meet SCRAP-9');
        const portrait=el('canvas','','robot-portrait');portrait.width=96;portrait.height=80;drawRobotPortrait(portrait,game.time);
        greeting.append(portrait,el('h2','SCRAP-9'),el('p',p.ui.robotIntroBroken?'â€œBzzztâ€¦ SCRAP-9, at your service. My circuits need a hand. Hold Interact beside me to repair themâ€”no parts needed. Once fixed, I stay fixed for this character.â€':'â€œSCRAP-9, at your service. Welcome to the storeroom!â€'),el('p','â€œI buy your unwanted items for gold. Changed your mind? My Buy back shelf keeps sold items at the same price. Your chests keep gear safe between expeditions.â€'));
        const next=button((p.device==='keyboard'?'Enter':controllerButtonNames(liveControllerFamily(p))[0])+' Â· Got it','robotContinue',()=>game.inventoryAction(p,'robotContinue'));next.classList.add('selected');greeting.append(next);panel.append(greeting);
      } else if(p.ui?.shop==='merchant'){
        merchantPanel(panel,game,p,button);
      } else if (p.ui?.shop) {
        shopPanel(panel, game, p, button,(node,item)=>this.itemTooltip(panel,node,game,p,item));
      } else if (p.ui && !p.ui.shop) {
        this.storagePanels(panel, game, p, button);
      }
      this.preview(panel, p, game.time);
      if(p.ui?.shop==='npc-dialogue')drawNpcDialoguePortraits(panel,game,p,renderer?.animator||(this.roomAnimator||=new Animator()));
      if (focus)
        panel
          .querySelector('[data-action="' + focus + '"]')
          ?.focus({ preventScroll: true });
    }
    for (const [id, panel] of this.panels)
      if (!wanted.has(id)) {
        panel.remove();
        this.panels.delete(id);
      }
    // Content caching must not freeze a neighbour's position when a panel opens,
    // closes, changes chest mode, or the game window is resized.
    if (layoutChanged) {
      const placedOpen = open.filter(p => this.panels.has(p.id));
      for (const p of placedOpen) this.place(this.panels.get(p.id), p, game, renderer, bounds, placedOpen);
      this.layoutKey = layoutKey;
    }
    for(const panel of this.panels.values()){
      const selected=panel.querySelector('.storage-sheet.active .selected,.robot-item-slot.selected,.npc-dialogue-choice.selected');
      if(panel.revealSelection&&!panel.classList.contains('inventory-redesign'))selected?.scrollIntoView({block:'nearest',inline:'nearest'});
      if(!panel.hero?.ui?.socket&&!panel.hero?.ui?.bag&&!panel.hero?.ui?.split&&(panel.hero?.device!=='keyboard'||panel.revealSelection)){
        if(selected?.showItemTooltip){if(panel.tooltipSelection!==selected||layoutChanged||panel.querySelector('.item-tooltip')?.hidden)selected.showItemTooltip();panel.tooltipSelection=selected;}
        else {const tip=panel.querySelector('.item-tooltip');if(tip)tip.hidden=true;}
      }
      panel.revealSelection=false;
    }
  }
  storagePopup(panel,game,p,button){
    const u=p.ui,storage=game.storageFor(p),reusable=Number.isInteger(u.storage)||u.storage==='shared'||u.storage==='starter';
    u.loot=true;if(!reusable)u.panel='chest';
    panel.classList.add('loot-popup');panel.classList.toggle('chest-transfer',reusable);
    const door=game.portals.find(d=>d.id===p.room),owner=game.players.find(q=>q.id===door?.owner);
    const title=reusable?(u.storage==='starter'?'Starter chest':u.storage==='shared'?'Shared stash':chestName(owner||p,u.storage)):u.storage==='old-well'?(wellForPlayer(game,p)?.mausoleum?'Crypt lantern chest':'Buried well treasure'):u.storage==='temple'?'Ritual chest':'Victory spoils';
    panel.querySelector('header').textContent=p.name+' Â· '+title;
    const switchTo=(mode,index)=>{game.inventoryAction(p,'panel:'+mode);if(index!==undefined)game.inventoryAction(p,'select:'+index);};
    const surface=el('div',null,'storage-containers');
    for(const mode of reusable?['chest','pack']:['chest']){
      const list=mode==='pack'?p.inventory:storage,deposit=mode==='pack',active=u.panel===mode;
      const section=el('section',null,'storage-container storage-sheet');section.classList.toggle('active',active);section.dataset.container=mode;
      const head=button(deposit?'Your backpack':'Chest contents','storage-'+mode,()=>switchTo(mode));
      head.className='storage-container-heading';head.append(el('span',list.filter(Boolean).length+(!deposit&&['shared','starter'].includes(u.storage)?' items':' / 24'),'storage-capacity'));head.setAttribute('aria-pressed',String(active));section.append(head);
      const grid=el('div',null,'storage-slots');grid.dataset.container=mode;
      const page=active?Math.floor(u.index/24):(u.storagePages?.[mode]||0);(u.storagePages||={})[mode]=page;
      for(let index=page*24;index<page*24+24;index++){
        const item=list[index],def=ITEMS[item?.type],b=button('',mode+'-slot-'+index,()=>switchTo(mode,index));
        b.dataset.index=index;b.dataset.mode=mode;b.dataset.rarity=def?.rarity||'common';
        b.classList.toggle('selected',active&&u.index===index);b.classList.toggle('empty-slot',!item);
        b.setAttribute('aria-label',(deposit?'Backpack':'Chest')+' slot '+(index+1)+': '+(def?.name||item?.type||'Empty')+(item?' Ã—'+item.qty:''));
        b.style.setProperty('--rarity',RARITIES[def?.rarity]||RARITIES.common);
        if(item){
          const icon=el('canvas');icon.width=icon.height=48;icon.className='item-icon';drawItem(icon.getContext('2d'),item.type,24,24,48);b.append(icon);
          if(item.qty>1)b.append(el('span',String(item.qty),'inventory-quantity'));
          if(def)this.itemTooltip(panel,b,game,p,item);else b.title=item.type;
          b.ondblclick=()=>{switchTo(mode,index);game.inventoryAction(p,'use');};
          if(!canAccess(game,p,!deposit)||(deposit&&protectedItem(p,item.type)))b.classList.add('locked-item');
        }
        grid.append(b);
      }
      section.append(grid);
      if(list.length>24){
        const pages=Math.ceil(list.length/24),nav=el('nav',null,'storage-pages');
        const previous=button('â€¹','storage-page-'+mode+'-prev',()=>switchTo(mode,Math.max(0,page-1)*24));previous.disabled=page===0;
        const next=button('â€º','storage-page-'+mode+'-next',()=>switchTo(mode,Math.min(pages-1,page+1)*24));next.disabled=page>=pages-1;
        nav.append(previous,el('span',(page+1)+' / '+pages),next);section.append(nav);
      }
      surface.append(section);
    }
    panel.append(surface);
    const deposit=u.panel==='pack',list=deposit?p.inventory:storage,item=list[u.index],allowed=canAccess(game,p,!deposit)&&!(deposit&&protectedItem(p,item?.type));
    const controls=this.controllerText(game,p),actions=el('nav',null,'storage-popup-actions');
    const primary=button(controls.accept+' Â· '+(deposit?'Deposit selected â†’':reusable?'â† Withdraw selected':'Take selected'),'storage-transfer',()=>game.inventoryAction(p,'use'));
    primary.disabled=!item||!allowed;actions.append(primary);
    const all=button(deposit?'Deposit all':reusable?'Withdraw all':'Loot all','lootAll',()=>game.inventoryAction(p,'lootAll'));all.disabled=!list.some(Boolean)||!canAccess(game,p,!deposit);actions.append(all);
    const notice=el('p',u.notice||(!storage.some(Boolean)?reusable?'Chest empty. Select an item in your backpack to deposit.':'No loot remaining.':'Select an item to transfer.'),'loot-notice');
    panel.append(actions,notice);
    panel.append(el('small',reusable?`${controls.select}: select Â· ${controls.tabs}: switch container Â· ${controls.accept}: transfer Â· ${controls.close}: close`:`${controls.select}: select Â· ${controls.accept}: take Â· ${controls.close}: close`,'storage-help'));
    if(u.storage==='starter')panel.append(el('small','Your starter selection Â· restocked each new level Â· deposited items are kept.','storage-help'));
    if(u.storage==='victory'){const nav=el('nav',null,'victory-loot-actions');for(const [text,action]of [['Restart this level','restart'],['Return to lobby','lobby']])nav.append(button(text,'victory-'+action,()=>panel.dispatchEvent(new CustomEvent('victory-action',{bubbles:true,detail:action}))));panel.append(nav);}
    if(u.storage==='tv-victory'){
      const nav=el('nav',null,'victory-loot-actions'),back=button(controls.accept+' Â· Return to lobby','tvReturn',()=>game.inventoryAction(p,'tvReturn'));
      back.disabled=storage.some(Boolean);nav.append(back);panel.append(nav);
      panel.append(el('small',storage.some(Boolean)?'Shared party treasure Â· loot before leaving. Backpack full? Close this chest and open your inventory to make room.':'Treasure collected. Confirm to return to the lobby.','storage-help'));
    }
  }
  storagePanels(panel, game, p, button) {
    if(p.ui.socket){drawSocketWorkshop(panel,game,p,button,el);return;}
    if(game.storageFor(p)){
      this.storagePopup(panel,game,p,button);return;
    }
    const u = p.ui,
      storage = game.storageFor(p),
      layout = el("div", null, "storage-layout");
    const victoryStorage=u.storage==='victory';
    layout.classList.toggle("has-chest", !!storage);
    const select = (mode, index) => {
      game.inventoryAction(p, "panel:" + mode);
      if (index !== undefined) game.inventoryAction(p, "select:" + index);
    };
    const door = game.portals.find((d) => d.id === p.room),
      owner = game.players.find((q) => q.id === door?.owner);
    const title =
      u.storage === "temple" ? "Ritual chest" : u.storage === "victory"
        ? "Victory chest"
        : u.storage === "shared"
          ? "Shared table stash"
          : (owner?.name || p.name) +
            " Â· " +
            chestName(owner, Number(u.storage));
    for (const mode of [...(victoryStorage ? [] : ["gear"]), "pack", ...(storage ? ["chest"] : [])]) {
      const active = u.panel === mode,
        gear = mode === "gear";
      const sheet = el(
        "section",
        null,
        "storage-sheet " +
          (gear
            ? "equipment-window"
            : mode === "pack"
              ? "inventory-window"
              : "chest-window"),
      );
      sheet.classList.toggle("active", active);
      sheet.setAttribute(
        "aria-label",
        gear ? "Equipped gear" : mode === "pack" ? "Backpack" : title,
      );
      sheet.append(
        el(
          "header",
          gear ? "Equipped gear" : mode === "pack" ? "Inventory" : title,
        ),
      );
      let previewFrame;
      if (gear) {
        const portrait = el("canvas");
        portrait.width = 180;
        portrait.height = 220;
        portrait.className = "equipment-preview";
        portrait.setAttribute('aria-label',p.name+' Â· live equipped character');
        previewFrame=el('div',null,'inventory-character');
        const scene=el('canvas',null,'inventory-scene');scene.setAttribute('aria-hidden','true');previewFrame.append(scene);
        const rotate=delta=>{u.previewDirection=((u.previewDirection||0)+delta+8)%8;};
        const previous=button('â€¹','preview-left',()=>rotate(-1));
        const next=button('â€º','preview-right',()=>rotate(1));
        previous.setAttribute('aria-label','Rotate character left');next.setAttribute('aria-label','Rotate character right');
        previous.className='preview-turn preview-turn-left';next.className='preview-turn preview-turn-right';
        previewFrame.append(portrait,previous,next);
        const previewColumn=el('div',null,'inventory-preview-column');previewColumn.append(previewFrame);sheet.append(previewColumn);
      }
      const controls = el("nav");
      controls.append(
        button(
          gear
            ? "Select equipment"
            : mode === "pack"
              ? "Select backpack"
              : "Select chest",
          mode,
          () => select(mode),
        ),
      );
      if (mode === "chest")
        controls.append(
          button("Close chest", "close-chest", () =>
            game.inventoryAction(p, "closeStorage"),
          ),
        );
      if (
        mode === "chest" &&
        typeof u.storage === "number" &&
        owner?.id === p.id
      ) {
        controls.append(
          button("Rename", "rename-chest", () => {
            if (sheet.querySelector(".chest-rename")) return;
            const form = el("form", null, "chest-rename"),
              label = el("label", "Chest name "),
              input = el("input");
            input.maxLength = 24;
            input.value = chestName(owner, u.storage);
            input.setAttribute("aria-label", "Chest name");
            label.append(input);
            form.append(label);
            const save = el("button", "Save");
            save.type = "submit";
            const cancel = el("button", "Cancel");
            cancel.type = "button";
            cancel.onclick = () => form.remove();
            form.append(save, cancel);
            form.onsubmit = (e) => {
              e.preventDefault();
              game.inventoryAction(p, "rename:" + input.value);
              form.remove();
            };
            form.onkeydown = (e) => e.stopPropagation();
            controls.after(form);
            input.focus();
            input.select();
          }),
        );
      }
      sheet.append(controls);
      if (mode === 'pack') {
        sheet.querySelector('header').append(el('span', `${p.inventory.filter(Boolean).length} / 24`, 'pack-capacity'));
      }
      const list = gear
        ? SLOTS.map((slot) => ({ slot, type: p.equipment[slot]==='occupied'?p.equipment.hand1:p.equipment[slot], qty: 1,sockets:p.equipmentSockets?.[slot]||[] }))
        : mode === "pack"
          ? p.inventory
          : storage;
      const index = active ? u.index : u.selections?.[mode] || 0;
      const page = mode === "chest" ? Math.floor(index / 24) : 0;
      if (mode === "chest" && list.length > 24) {
        const pages = Math.ceil(list.length / 24);
        controls.append(
          button("Previous page", "chest-prev", () =>
            select(mode, Math.max(0, page - 1) * 24),
          ),
          el("span", `${page + 1} / ${pages}`),
          button("Next page", "chest-next", () =>
            select(mode, Math.min(pages - 1, page + 1) * 24),
          ),
        );
      }
      const grid = el("div", null, "item-grid " + (gear ? "paper-doll" : ""));
      grid.dataset.container = mode;
      const dropTarget = (node, to) => {
        node.ondragover = (e) => {
          if (this.dragItem?.player === p) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            node.classList.add("drop-target");
          }
        };
        node.ondragleave = () => node.classList.remove("drop-target");
        node.ondrop = (e) => {
          e.preventDefault();
          e.stopPropagation();
          node.classList.remove("drop-target");
          const source = this.dragItem;
          this.dragItem = null;
          if (source?.player !== p) return;
          const current =
            source.from.mode === "gear"
              ? p.equipment[source.from.slot]
              : (source.from.mode === "pack"
                  ? p.inventory
                  : game.storageFor(p))?.[source.from.index];
          if (current !== source.ref) {
            u.notice = "Item changed while dragging. Try again.";
            return;
          }
          game.moveInventoryItem(p, source.from, to);
        };
      };
      if (!gear) dropTarget(grid, { mode, index: list.length });
      const indices = Array.from({length:gear ? SLOTS.length : 24}, (_, i) => page * 24 + i);
      for (const n of indices) {
        const item = list[n],
          displayItem = gear && item?.type === 'occupied' ? {...item,type:p.equipment.hand1} : item,
          def = ITEMS[displayItem?.type];
        const action = storage
          ? "storage-" + mode + "-" + n
          : active
            ? "item" + n
            : mode + "-item" + n;
        const b = button(
          (gear ? item.slot.toUpperCase().replace('HAND', 'HAND ') : (item?.type === "occupied" ? "BOTH" : "")) +
            (item?.qty > 1 ? " Ã—" + item.qty : ""),
          action,
          () => { select(mode, n); if (def?.bag) u.bag = {mode, index:n, selected:0}; },
        );
        b.classList.toggle("selected", active && n === index);
        b.classList.toggle('carried-source',!!u.carry&&u.carry.from.mode===mode&&(gear?u.carry.from.slot===item.slot:u.carry.from.index===n));
        b.classList.toggle('carry-target',!!u.carry&&active&&n===index);
        b.dataset.index = n;
        b.dataset.mode = mode;
        if (def?.bag) b.ondblclick = () => { select(mode, n); u.bag = {mode, index:n}; };
        b.setAttribute('aria-label',(gear?item.slot+': ':'')+(def?.name||'Empty slot')+(item?.qty>1?' Ã—'+item.qty:''));
        b.style.setProperty("--item", def?.color || "#405047");
        if (gear) {
          b.dataset.slot=item.slot;b.textContent='';
          const name=item.slot==='back'&&itemKind(item.type)==='quiver'?'QUIVER':item.slot==='hand1'?'R HAND':item.slot==='hand2'?'L HAND':item.slot.toUpperCase();
          const label=el('span',null,'equipment-slot-label');label.append(el('span',name,'equipment-label-full'),el('span',item.slot==='shoulders'?'SHLDRS':name,'equipment-label-compact'));b.append(label);
          b.setAttribute('aria-label',(item.slot==='hand1'?'Right hand (Hand 1)':item.slot==='hand2'?'Left hand (Hand 2)':item.slot==='back'?'Back / quiver':item.slot)+': '+(def?.name||'Empty slot'));
        }
        b.classList.toggle('empty-slot',!def);
        b.classList.toggle('two-hand-linked',gear && item?.type === 'occupied');
        b.dataset.rarity=def?.rarity||'common';
        b.style.setProperty('--rarity',RARITIES[def?.rarity]||RARITIES.common);
        b.title = def
          ? def.name +
            " Â· " +
            itemStats(displayItem.type) +
            " Â· " +
            compareItem(p, displayItem.type) +
            (def.relic && mode === "chest"
              ? " Â· Stored relics give no bonuses"
              : "") +
            (gear
              ? " Â· Drag to backpack to unequip"
              : " Â· Drag onto an equipment slot")
          : "Empty slot";
        if (def) this.itemTooltip(panel, b, game, p, displayItem);
        if (def) b.removeAttribute('title');
        if (def?.slot) b.style.color = def.color;
        if(!gear&&item?.qty>1){b.textContent='';b.append(el('span',String(item.qty),'inventory-quantity'));}
        if (def) {
          const icon = el("canvas");
          icon.width = icon.height = 48;
          icon.className = "item-icon";
          drawItem(icon.getContext("2d"), displayItem.type, 24, 24, 48);
          b.prepend(icon);
        }else if(gear){
          const sample=Object.keys(ITEMS).find(type=>ITEMS[type].slot===item.slot&&!ITEMS[type].gmOnly);
          if(sample){const icon=el('canvas');icon.width=icon.height=48;icon.className='item-icon empty-equipment-icon';drawItem(icon.getContext('2d'),sample,24,24,48);b.prepend(icon);}
        }
        if(gear&&itemKind(item.type)==='quiver'){
          const ammo=el('span',null,'quiver-ammo-indicator'),loaded=Math.min(3,count(p,quiverType(p)));
          ammo.setAttribute('aria-label',`${count(p,quiverType(p))} arrows loaded`);
          for(let arrow=0;arrow<loaded;arrow++)ammo.append(el('i','âž¶'));
          b.append(ammo);
        }
        b.draggable = !!def || item?.type === "occupied";
        b.ondragstart = (e) => {
          this.dragItem = {
            player: p,
            from: gear ? { mode, slot: item.slot } : { mode, index: n },
            ref: gear ? item.type : list[n],
          };
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData(
            "text/plain",
            def?.name || "Two-handed weapon",
          );
        };
        b.ondragend = () => {
          this.dragItem = null;
          panel
            .querySelectorAll(".drop-target")
            .forEach((e) => e.classList.remove("drop-target"));
        };
        dropTarget(b, gear ? { mode, slot: item.slot } : { mode, index: n });
        grid.append(b);
      }
      if (mode === 'pack') for (let n = indices.length; n < 24; n++) {
        const b = el('button', '', 'reserved-slot'); b.disabled = true;
        b.setAttribute('aria-label', 'Space occupied in another tab'); grid.append(b);
      }
      sheet.append(grid);
      const item = list[index],
        def = ITEMS[item?.type];
      sheet.append(
        el(
          "p",
          def
            ? def.name +
                " Â· " +
                itemStats(item.type) +
                " Â· " +
                compareItem(p, item.type) +
                (def.relic && mode === "chest"
                  ? " Â· Stored relics give no bonuses"
                  : "")
            : gear
              ? "Drag an item onto its slot."
              : "Select or drag an item.",
          "storage-detail",
        ),
      );
      layout.append(sheet);
    }
    panel.append(layout);
    this.inventoryToolbar(panel,game,p,button);
    if(victoryStorage){
      const endActions=el('nav',null,'victory-loot-actions');
      const restart=button('Restart this level','victory-restart',()=>panel.dispatchEvent(new CustomEvent('victory-action',{bubbles:true,detail:'restart'})));
      const lobby=button('Return to lobby','victory-lobby',()=>panel.dispatchEvent(new CustomEvent('victory-action',{bubbles:true,detail:'lobby'})));
      endActions.append(restart,lobby);panel.append(endActions);
    }
    const controls = this.controllerText(game, p);
    const detectedFamily = liveControllerFamily(p);
    const family = p.device === 'keyboard' ? 'Keyboard + mouse' : CONTROLLER_NAMES[detectedFamily] || 'Game controller';
    panel.append(el('small',u.carry?`Moving ${u.carry.name} Â· ${p.device==='keyboard'?'M / Enter':'LS / A'}: place Â· ${controls.close}: cancel`:`${controls.select}: select Â· ${controls.tabs}: equipment / bag Â· ${controls.close}: close`,'inventory-help'));
    this.inventoryPopovers(panel, game, p, button);
  }

  inventoryToolbar(panel,game,p,button){
    const pad=controllerButtonNames(liveControllerFamily(p)),{item,def,gear,options}=inventoryToolbar(game,p,pad);
    // Item names, stats and descriptions belong in the selected slot's tooltip.
    // This small live region is only for transaction feedback and move guidance.
    const summary=el('div',null,'inventory-selection');summary.setAttribute('role','status');
    const detail=p.ui.notice||(p.ui.carry?'Choose a destination, then Place. Close cancels the move.':'');
    summary.classList.toggle('status-empty',!detail);
    const notice=el('small',detail,'storage-notice');summary.append(notice);panel.append(summary);
    const actions=el('nav',null,'inventory-actions current-inventory-actions');actions.setAttribute('aria-label','Selected item actions');
    for(const option of options){
      const b=button('',option.id,()=>game.inventoryAction(p,option.action));
      b.disabled=!!option.reason;b.setAttribute('aria-label',option.label+' Â· '+option.key+(option.reason?' Â· '+option.reason:''));b.title=option.reason||option.label+' Â· '+option.key;
      const badge=option.key.replace(/Triangle/g,'â–³').replace(/Square/g,'â–¡').replace(/Circle/g,'â—‹').replace(/Cross/g,'Ã—').replace(/Shift\+Del/g,'â‡§Del');
      const compactLabel={'Learn recipe':'Learn'}[option.label]||option.label;
      b.append(el('span',badge,'inventory-key'),el('span',compactLabel,'inventory-action-label'));
      if(option.id==='salvage-hold'){
        const ring=el('span',null,'salvage-ring');ring.setAttribute('role','progressbar');ring.setAttribute('aria-label','Salvage hold progress');ring.setAttribute('aria-valuemin','0');ring.setAttribute('aria-valuemax','100');
        b.className='salvage-button';b.append(ring);b.onclick=()=>{};
        b.title=option.reason||'Hold '+option.key+' for 1.25 seconds to salvage one item. '+salvageYield(item?.type,item).map(v=>v.qty+' '+ITEMS[v.type].name).join(' + ');
        b.setAttribute('aria-label',b.title);
        b.onpointerdown=e=>{if(b.disabled||e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);if(p.ui)p.ui.salvagePointer=true;};
        const stop=()=>{if(p.ui)p.ui.salvagePointer=false;};b.onpointerup=stop;b.onpointercancel=stop;b.onlostpointercapture=stop;b.onblur=stop;
        b.onkeydown=e=>{if(!b.disabled&&['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();if(p.ui)p.ui.salvagePointer=true;}};b.onkeyup=stop;
      }
      actions.append(b);
    }
    panel.append(actions);
  }ûëÞí¢G§²ÚîÆ­yÕ&—6R—¶Ræw&fTVÖW&vVæ6S×¶VÆ6VC£ÆGW&F–öã¤u$dUôTÔU$tTä4Uõ4T4ôäE2Æ÷&–v–ã§·ƒ¦Rç‚Ç“¦Rç’Æw&÷VæE“¦Rç’³G×Ó¶Rç7FFSÒvVÖW&v–ærs·Ð¢f—'7BóóÒS°Ð¢ÐÐ¢f÷"†6öç7BRöbF†—2æVæVÖ–W2æf–ÇFW"†SÓæRæw&÷WÓÓÖw&÷WbfRæ¶–æCÓÓÒ'vöÆb"’—vöÆe6²‡F†—2ÆR“°Ð¢7F'Dæ–v‡DWfVçB‡F†—2ÇF†—2æWfVçBÇF†—2æVæVÖ–W2æf–ÇFW"†SÓæRæw&÷WÓÓÖw&÷W’“°Ð¢f÷"†6öç7BRöbF†—2æVæVÖ–W2––b†Ræw&÷WÓÓÖw&÷WbfRæ¶–æCÓÓÒv6&æ—f÷&÷W5öfÆ÷vW"rbfRçÆçEf&–çCÓÓ×VæFVf–æVB–RçÆçEf&–çCÖRæ–BS3ÓÓÓòv÷&6†–Bs¢vÖrs°Ð¢–b‡F†—2æWfVçBç7–FW$æW7Bbff—'7B—7–FW$æW7B‡F†—2Æf—'7BÆw&÷W“°Ð¢–b†&VTWfVçB‡F†—2æWfVçB’—7F'D&VT†—fR‡F†—2Æw&÷WÇF†—2æVæVÖ–W2æf–ÇFW"†SÓæRæw&÷WÓÓÖw&÷Wbe²v&VRrÂwv7uÒæ–æ6ÇVFW2†Ræ¶–æB’’“°Ð¢–b‚f—'7B’&WGW&âfÇ6S°¢F†—2ç&WfVÂÒ²ƒ¢f—'7Bç‚Â“¢f—'7Bç’ÂÆ–fS¢BÓ°Ð¢F†—2æÖW76vR‡F†—2æWfVçBææÖR²"(	B"²F†—2æWfVçBçF—“°Ð¢F†—2æöå6÷VæB‚&WfVçB"“°Ð¢ÐÐ¢G&‡’°Ð¢–b€Ð¢æ‡ÃÒÇÀÐ¢çG&2ÃÒÇÀÐ¢çG&6ööÆF÷vââÇÀÐ¢F†—2ç†6RÓÒ'Æ’ Ð¢Ð¢&WGW&âfÇ6S°Ð¢çG&2ÒÓ°Ð¢çG&6ööÆF÷vâÒãc°Ð¢F†—2çG&2çW6‚‡°Ð¢ƒ¢ç‚²æf6U‚¢3BÀÐ¢“¢ç’²æf6U’¢3BÀÐ¢Æ–fS¢'VÆW2çG&GW&F–öâÀÐ¢÷væW#¢æ–BÀÐ¢Æ6VDC¢F†—2çF–ÖRÀÐ¢f&–çC¢–æ—F–Æ—¦Tf–VÆB‡’çG&ÀÐ¢6GW&S¢æf–VÆBæ&ööâÓÓÒ'G&W""òãsR¢ÀÐ¢Ò“°Ð¢&V6÷&B‡Â'G&5Æ6VB"“°Ð¢F†—2æöå6÷VæB‚'G&"“°Ð¢&WGW&âG'VS°Ð¢ÐÐ¢WFFR†GBÂ–çWG2Ò·Ò’°Ð¢–b‡F†—2ç†6RÓÓÒ'6VÆ–ær"’°Ð¢F†—2ç6VÅF–ÖR³ÒÖF‚æÖ–â†GBÂãR“°Ð¢F†—2çF–ÖR³ÒÖF‚æÖ–â†GBÂãR“°Ð¢–b‡F†—2ç6VÅF–ÖRãÒ'VÆW2ç6VÄGW&F–öâ’F†—2æ6ö×ÆWFUf–7F÷'’‚“°Ð¢&WGW&ã°Ð¢ÐÐ¢–b‚²'Æ’"Â'vöâ%Òæ–æ6ÇVFW2‡F†—2ç†6R’’&WGW&ã°Ð¢GBÒÖF‚æÖ–â†GBÂãR“°Ð¢F†—2ç&öÆÄ6ööÆF÷vãÔÖF‚æÖ‚ƒÂ‡F†—2ç&öÆÄ6ööÆF÷vçÇÃ’ÖGB“°Ð¢–b‡F–6´&ö&E6WVVæ6R‡F†—2ÆGBÆ–çWG2’—&WGW&ã°¢F–6´6†&Õ7FGW6W2‡F†—2ÆGB“°¢–çWG3Ö6†&Ô–çWG2‡F†—2Æ–çWG2“°¢F–6´æ–v‡D7–6ÆR‡F†—2ÂGB“°Ð¢Vç7W&UFV×ÆR‡F†—2“°Ð¢F†—2çF–6´GfVçGW&R†GBÂ–çWG2“°Ð¢F–6´ç5VW7G2‡F†—2ÆGB“°¢–b‡F†—2ç&öÆÂ—&WGW&ã°Ð¢F–6´v†÷7G2‡F†—2ÆGB“°Ð¢F–6´‡VçFW%WG2‡F†—2ÆGBÆ–çWG2“°Ð¢F–6´f–VÆB‡F†—2ÂGBÂ–çWG2“°Ð¢F–6´†¦&G2‡F†—2ÂGB“°¢F–6´–×†¦&G2‡F†—2ÆGB“°¢F–6´Vçf—&öæÖVçB‡F†—2ÂGB“°Ð¢F–6´w&fW–&B‡F†—2ÆGB“·F–6µ7W&f6TV6öÆöw’‡F†—2ÆGB“°¢F–6´×—7FW'’‡F†—2“°Ð¢F–6´æ–v‡DWV—ÖVçB‡F†—2ÂGB“°Ð¢F–6´æ–v‡DVæV×”†¦&G2‡F†—2ÂGB“°Ð¢&Wv&Dæ–v‡D‡VçG2‡F†—2“°Ð¢WFFTÆ—f–ætV6÷7—7FVÒ‡F†—2ÂGB“°Ð¢WFFT&÷VæFÆW75v÷&ÆB‡F†—2ÆGB“°¢6VVEv–ÆDfVæ‡F†—2“°¢–b‡F†—2ç†6RÓÓÒ'6VÆ–ær"’&WGW&ã°Ð¢F†—2æ&ÆööÒÒÖF‚æÖ–âƒ2Â‡F†—2æ&ÆööÒÇÂ’²GB“°Ð¢F†—2çF–ÖR³ÒGC°Ð¢F†—2çF&ÆU6†¶RÒÖF‚æÖ‚ƒÂF†—2çF&ÆU6†¶RÒGB“°Ð¢F†—2æWfVçEF–ÖRÒÖF‚æÖ‚ƒÂF†—2æWfVçEF–ÖRÒGB“°Ð¢–b‡F†—2æWfVçCòæ6†–ãòç6öÖR‚†7F–öâÂ–æFW‚’Óâ7F–öâçG&–vvW"ÓÓÒ&FVÆ’"bbF†—2æWfVçD7F–öå'Vãòæ†2†–æFW‚’’’°Ð¢F†—2æWfVçBæ6†–å'VçF–ÖRÒ‡F†—2æWfVçBæ6†–å'VçF–ÖRÇÂ’²GC°Ð¢F†—2ç'VäWfVçD7F–öç2‚&FVÆ’"“°Ð¢ÐÐ¢–b‡F†—2ç&WfVÂ’°Ð¢F†—2ç&WfVÂæÆ–fRÓÒGC°Ð¢–b‡F†—2ç&WfVÂæÆ–fRÃÒ’F†—2ç&WfVÂÒçVÆÃ°Ð¢ÐÐ¢f÷"†6öç7BöbF†—2çÆ–W'2’°Ð¢–b‚F–6µv–ætfÆ–v‡B‡F†—2ÇÆ–çWG5·æFWf–6U×ÇÇ·ÒÆGBÆ6öÆÆ—6–öäöfg6WB‡F†—2Ç’’—F–6´§V×‡ÆGBÇF†—2Æ6öÆÆ—6–öäöfg6WB‡F†—2Ç’“°¢F–6µV–6·6æB‡F†—2ÇÆ–çWG5·æFWf–6U×ÇÇ·ÒÆGB“°Ð¢F–6µ7v–ÖÖ–ær‡F†—2ÇÆ–çWG5·æFWf–6U×ÇÇ·ÒÆGB“°Ð¢æFVF…F–ÖS×æ‡ÃÓò‡æFVF…F–ÖWÇÃ’¶GC£·ævWEWF–ÖSÔÖF‚æÖ‚ƒÂ‡ævWEWF–ÖWÇÃ’ÖGB“°Ð¢ç6ÆVW–ærÒÖF‚æÖ‚ƒÂ‡ç6ÆVW–ærÇÂ’ÒGB“°Ð¢æ–çFW&7Dæ–ÖF–öãÔÖF‚æÖ‚ƒÂ‡æ–çFW&7Dæ–ÖF–öçÇÃ’ÖGB“·ç&Wf—fTæ–ÖF–öãÔÖF‚æÖ‚ƒÂ‡ç&Wf—fTæ–ÖF–öçÇÃ’ÖGB“°Ð¢ç–6·WF–ÖSÔÖF‚æÖ‚ƒÂ‡ç–6·WF–ÖWÇÃ’ÖGB“·æf÷VæEVæ—VSÔÖF‚æÖ‚ƒÂ‡æf÷VæEVæ—VWÇÃ’ÖGB“°Ð¢ævF†W%F–ÖSÔÖF‚æÖ‚ƒÂ‡ævF†W%F–ÖWÇÃ’ÖGB“¶–b‚ævF†W%F–ÖR—ævF†W$7F–öãÖçVÆÃ°Ð¢ç''“ÔÖF‚æÖ‚ƒÂ‡ç''—ÇÃ’ÖGB“°Ð¢æGF6²ÒÖF‚æÖ‚ƒÂæGF6²ÒGB“°Ð¢–b‡çVWVVDGF6²bgæGF6³ÓÓÓ—¶6öç7BVWVVC×çVWVVDGF6³¶FVÆWFRçVWVVDGF6³¶–b‡VWVVBçVçF–Ãã×F†—2çF–ÖRbbç&ööÒbbçV’bgæ‡ã—F†—2æGF6²‡ÇVWVVBæ6†&vR“·ÐÐ¢ç7–âÒÖF‚æÖ‚ƒÂ‡ç7–âÇÂ’ÒGB“°Ð¢ç7GVâÒÖF‚æÖ‚ƒÂ‡ç7GVâÇÂ’ÒGB“°Ð¢æFöFvRÒÖF‚æÖ‚ƒÂæFöFvRÒGB“°Ð¢æF6…F–ÖRÒÖF‚æÖ‚ƒÂæF6…F–ÖRÒGB“°Ð¢æ–çgVÆâÒÖF‚æÖ‚ƒÂæ–çgVÆâÒGB“°Ð¢çG&6ööÆF÷vâÒÖF‚æÖ‚ƒÂçG&6ööÆF÷vâÒGB“°Ð¢æ†—BÒÖF‚æÖ‚ƒÂæ†—BÒGB“°¢–b†—46†&ÖVB‡’—·F–6´6†&ÖVEÆ–W"‡F†—2ÇÆGB“¶6öçF–çVS·Ð¢6öç7B–çWBÒ–çWG5·æFWf–6UÒÇÂ·Ó°Ð¢æ&÷t–Ö–ærÒ–çWBæ&Æö6²bb†4–ÕvVöâ‡’bbæ‡ãbbç&ööÒbbçV’bbæ6öç7VÖT–çWBbbç7v–ÖÖ–ærbbç6ÆVW–ærbbç7GVâbbF†—2æ÷Væ–æt&ö&C°Ð¢–b‡æ&÷t–Ö–ær—·æ&Æö6¶–æsÖfÇ6S·æF6…F–ÖSÓ·ç6Æ–FUƒ×ç6Æ–FU“Ó·ÐÐ¢–b‡ç&ööÒÇÂçV’ÇÂæ6öç7VÖT–çWBÇÂç7GVââ’°Ð¢æÖ÷f–ærÒfÇ6S·ç6Æ–FUƒ×ç6Æ–FU“Ó°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b‡ç6ÆVW–ærâ’°Ð¢æÖ÷f–ærÒfÇ6S°Ð¢ç6Æ–FU‚Òç6Æ–FU’Ò°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b‡æ‡ÃÒ’°Ð¢ÆWB†VÇW"ÒF†—2çÆ–W'2æf–æB€Ð¢‡’ÓàÐ¢æ‡âb`Ð¢F—7Fæ6R‡Â’ÂcRb`Ð¢†–çWG5·æFWf–6UÒÇÂ·Ò’æ–çFW&7BÀÐ¢“°Ð¢–b††VÇW"–†VÇW"ç&Wf—fTæ–ÖF–öãÒãS°Ð¢ç&Wf—fRÒ†VÇW"òç&Wf—fR²GB¢ÖF‚æÖ‚ƒÂç&Wf—fRÒGB“°Ð¢–b††VÇW#òæf–VÆCòç6¶–ÆÇ3òçV–6µ÷&Wf—fRÇÂç&Wf—fRãÒãb’°Ð¢–b††VÇW"’&V6÷&B††VÇW"Â'&W67VW2"“°Ð¢æ‡ÒSS°Ð¢ævWEWF–ÖSÒãC°Ð¢ç&Wf—fRÒ°Ð¢æ–çgVÆâÒ#°Ð¢F†—2æöå6÷VæB‚&†VÂ"“°Ð¢F†—2æÖW76vR‡ææÖR²"—2&6²öâF†V—"fVWBâ"“°Ð¢ÐÐ¢6öçF–çVS°Ð¢ÐÐ¢ÆWB×‚Ò–çWBç‚ÇÂÀÐ¢×’Ò–çWBç’ÇÂ°Ð¢6öç7BÆVâÒÖF‚æ‡—÷B†×‚Â×’“°Ð¢çvÆ¶–æsÖÆVããbfÆVãÂãc°Ð¢–b†ÆVââ’°Ð¢×‚óÒÆVã°Ð¢×’óÒÆVã°Ð¢ÐÐ¢–b‡F†—2æ÷Væ–æt&ö&B–f6T÷Væ–æt&ö&B‡“¶VÇ6RWFFT–Ôf6–ær‡Â–çWB“°Ð¢–b‚F†—2æ÷Væ–æt&ö&Bbf–çWBæ§V×bbæ§V×†VÆBbbçv–æt†÷fW"—7F'D§V×‡“°¢æ§V×†VÆCÒ–çWBæ§V×°Ð¢–b‡æ§V×†V–v‡Cã—·ç7v–ÖÖ–æsÖfÇ6S·æF—fTFWFƒÓ·ÐÐ¢–b‚F†—2æ÷Væ–æt&ö&Bbbæ&÷t–Ö–ærbb–çWBæFöFvRbbæF6„†VÆBbbæFöFvRÓÓÒ’°Ð¢æFöFvRÒ'VÆW2æF6„6ööÆF÷vâ¢‡ç7FÖ–æ&ö÷7BâòãR¢“°Ð¢æF6…F–ÖRÒ'VÆW2æF6„GW&F–öã°Ð¢æF6„æ–ÖF–öäGW&F–öâÒ'VÆW2æF6„GW&F–öã°Ð¢æF6…‚ÒÆVââãò×‚ò„ÖF‚æ‡—÷B†×‚Â×’’ÇÂ’¢æf6Uƒ°Ð¢æF6…’ÒÆVââãò×’ò„ÖF‚æ‡—÷B†×‚Â×’’ÇÂ’¢æf6U“°Ð¢æ–çgVÆâÒã3#°Ð¢F†—2æöå6÷VæB‚&FöFvR"“°Ð¢ÐÐ¢æF6„†VÆBÒ–çWBæFöFvS°Ð¢ç&ö÷FVBÒÖF‚æÖ‚ƒÂ‡ç&ö÷FVBÇÂ’ÒGB“°Ð¢6öç7B7VVBÐÐ¢æF6…F–ÖRâ Ð¢ò'VÆW2æF6…7VV@Ð¢¢ç&ö÷FVBâ Ð¢òSPÐ¢¢32¢‡æf–VÆCòæ&ööâÓÓÒ'66÷WB"òã"¢’¢ƒ·7FB‡Âw7VVD&öçW2r’“°Ð¢–b‡æF6…F–ÖRâ’°Ð¢×‚ÒæF6…ƒ°Ð¢×’ÒæF6…“°Ð¢ÐÐ¢–b‡æ&÷t–Ö–ær’·æÖ÷f–æsÖfÇ6S·çvÆ¶–æsÖfÇ6S·ÐÐ¢VÇ6R–b‚F†—2æ÷Væ–æt&ö&B’°Ð¢6öç7BÖ÷F–öãÖ–6TÖ÷F–öâ‡F†—2ÇÆ×‚Æ×’Ç7VVBÆGB’ÆöÆEƒ×ç‚ÆöÆE“×ç“°Ð¢F†—2æÖ÷fT7F÷"‡ÆÖ÷F–öâæG‚ÆÖ÷F–öâæG’“°Ð¢–b„ÖF‚æ'2‡ç‚ÖöÆE‚“Âã—ç6Æ–FUƒÓ¶–b„ÖF‚æ'2‡ç’ÖöÆE’“Âã—ç6Æ–FU“Ó°Ð¢ÐÐ¢VÇ6RæÖ÷f–ærÒfÇ6S°Ð¢–b‚F†—2æ÷Væ–æt&ö&Bbb–çWBçG&’F†—2çG&‡“°Ð¢f÷"†6öç7Bg'V—BöbF†—2ç–6·W2’°Ð¢–b‚g'V—BçW6VBbbF—7Fæ6R‡Âg'V—B’Â#‚’°Ð¢g'V—BçW6VBÒv—fR‡æ–çfVçF÷'’Â&g'V—B"“°Ð¢–b†g'V—BçW6VB’F†—2æöå6÷VæB‚&†VÂ"“°Ð¢VÇ6RF†—2æ–çfVçF÷'”gVÆÄæ÷F–6R‡Â&g'V—B"“°Ð¢ÐÐ¢ÐÐ¢ÐÐ¢6öç7BF&vWG2Ò²ââçF†—2çÆ–W'2Âââæ‡VçFW%WG2‡F†—2’Ââââ‡F†—2æv†÷7G7ÇÅµÒ’æf–ÇFW"†ÓæçWB•Òæf–ÇFW"‚‡’Óâæ‡âbbç&ööÒ“°Ð¢f÷"†6öç7BRöbF†—2æVæVÖ–W2’°Ð¢–b†Rç&7F–6UF&vWB–6öçF–çVS°Ð¢–b†Ræw&fTVÖW&vVæ6R–6öçF–çVS°¢–b†Ræ‡ãbgF–6µ&fVâ‡F†—2ÆRÆGB’–6öçF–çVS°¢6öç7BÆ—fRÒF&vWG2æf–ÇFW"‡ÓæVæV×”6å6VUF&vWB†RÇ’bb†Ræ¶–æCÓÓÒw7V67V'W2wÇÂ—46†&ÖVB‡’’“°¢–b†Ræ‡ãbfRæ¶–æCÓÓÒv&VUö†—fRr—·F–6´&VT†—fR‡F†—2ÆRÆGB“¶6öçF–çVS·ÐÐ¢–b†Ræ‡ãbfRæ¶–æCÓÓÒv&VRrbfRæf7F–öâÓÒvÆÇ’rbf7&VGW&W5¶Ræ¶–æEÓòæf7F–öâÓÒvÆÇ’r—·F–6´&VR‡F†—2ÆRÆGBÆÆ—fR“¶6öçF–çVS·Ð¢–b†Ræ‡ãbet”ÄEôdTäô´”äE2æ–æ6ÇVFW2†Ræ¶–æB’bfRæf7F–öâÓÒvÆÇ’rbf7&VGW&W5¶Ræ¶–æEÓòæf7F–öâÓÒvÆÇ’r—·F–6´§V×†RÆGBÇF†—2Ã“·F–6µv–ÆDfVæ‡F†—2ÆRÆGBÆÆ—fR“¶6öçF–çVS·Ð¢–b‚Æ—fRæÆVæwF‚bbRæ¶–æBÓÒw¦öÖ&–RrbbRæf7F–öâÓÒvÆÇ’rbb7&VGW&W5¶Ræ¶–æEÓòæf7F–öâÓÒvÆÇ’r’°¢f÷&vWD†–FFVåF&vWB†R“¶Ræ6ööÆF÷vãÔÖF‚æÖ‚ƒÂ†Ræ6ööÆF÷vçÇÃ’ÖGB“¶6öçF–çVS°Ð¢ÐÐ¢–b†Ræ‡ÃÓ–6öçF–çVS°Ð¢–b†Ræf7F–öãÓÓÒvÆÇ’wÇÆ7&VGW&W5¶Ræ¶–æEÓòæf7F–öãÓÓÒvÆÇ’r—°Ð¢F–6´§V×†RÆGBÇF†—2Æ6öÆÆ—6–öäöfg6WB‡F†—2ÆR’“·F–6´g&–VæFÇ”7&VGW&R‡F†—2ÆRÆGB“¶–b†Ræ¶–æCÓÓÒvæ6öæFr—WFFTæ6öæF&öG’‡F†—2ÆR“¶6öçF–çVS°Ð¢ÐÐ¢–b‡F–6µv–ÆD&E&ö÷7B‡F†—2ÆRÆGBÆÆ—fR’–6öçF–çVS°Ð¢F–6´§V×†RÆGBÇF†—2Æ6öÆÆ—6–öäöfg6WB‡F†—2ÆR’“°Ð¢–b†Ræ‡ÃÒÇÂ‚†Rç7F×VF–ærÇÂRæ¶–æBÓÓÒ'&†–æò"’bbRævw&ò’’6öçF–çVS°Ð¢–b†Ræ¶–æBÓÒwçF†W"rbb7&VGW&W5¶Ræ¶–æEÓòæ&V†f–÷'2æ§V×bfRç7FFSÓÓÒv‡VçBr—°Ð¢6öç7BF&vWCÖÆ—fRç&VGV6R‚†&W7BÇ“Óâ&W7GÇÆF—7Fæ6R†RÇ“ÆF—7Fæ6R†RÆ&W7B“÷¦&W7BÆçVÆÂ“°Ð¢–b‡F&vWBbfF—7Fæ6R†RÇF&vWB“ãcRbfF—7Fæ6R†RÇF&vWB“Ãƒbf6ÆV%6†÷B‡F†—2ÆRÇF&vWB’—7F'D§V×†R“°Ð¢ÐÐ¢–b‡F–6´v÷&–ÆÆ‡F†—2ÆRÆGBÆÆ—fR—ÇÇF–6µ7–FW"‡F†—2ÆRÆGBÆÆ—fR’–6öçF–çVS°Ð¢6öç7B6frÒ7&VGW&W5¶Ræ¶–æEÒÀÐ¢&V‚Ò6fsòæ&V†f–÷'2ÇÂ·Ó°Ð¢6öç7B”¶–æBÒ6fsòæ”¶–æBÇÂRæ¶–æC°Ð¢–b†6fsòæf7F–öâÓÓÒ&æWWG&Â"’6öçF–çVS°Ð¢–b‡F†—2æÖÖöFRÓÒv&÷VæFÆW72r—¶Rç‚Ò6Æ×†Rç‚Â#BÂtõ$ÄBÒ#B“¶Rç’Ò6Æ×†Rç’Â#BÂtõ$ÄBÒ#B“·ÐÐ¢RæfÆ6‚ÒÖF‚æÖ‚ƒÂRæfÆ6‚ÒGB“°Ð¢Rç7VÖÖöåVÇ6RÒÖF‚æÖ‚ƒÂ†Rç7VÖÖöåVÇ6RÇÂ’ÒGB“°Ð¢–b†RæÖ„Öæ’RæÖæÒÖF‚æÖ–â†RæÖ„ÖæÂ†RæÖæóòRæÖ„Öæ’²GB¢†RæÖæ&VvVâóòR’“°Ð¢Ræg&÷¦VâÒÖF‚æÖ‚ƒÂ†Ræg&÷¦VâÇÂ’ÒGB“°Ð¢–b†Ræg&÷¦Vââ’²RæÖ÷f–ærÒfÇ6S²6öçF–çVS²ÐÐ¢RæGF6²ÒÖF‚æÖ‚ƒÂ†RæGF6²ÇÂ’ÒGB“°Ð¢Ræ†VÄVffV7BÒÖF‚æÖ‚ƒÂ†Ræ†VÄVffV7BÇÂ’ÒGB“°Ð¢RçF‡&÷uF–ÖRÒÖF‚æÖ‚ƒÂ†RçF‡&÷uF–ÖRÇÂ’ÒGB“°Ð¢Ræ6ööÆF÷vâÓÒGC°Ð¢RçF7F–5F–ÖRÓÒGC°¢RæÖ÷f–ærÒfÇ6S°¢òòF†W6R7W7FöÒ‡VÖæö–B&÷WFW2&WGW&â&Vf÷&RF†RÆVv7’G&&Æö6²à¢òò¶VW6GW&Rö–çFW''WBF–Ö–æröâF†R6ÖRw&÷VæBÆæR2F†V—"fVWBà¢–b…²w7V67V'W2rÂv–×rÂw¦öÖ&–RuÒæ–æ6ÇVFW2†Ræ¶–æB’—°¢Rç&ö÷FVCÔÖF‚æÖ‚ƒÂ†Rç&ö÷FVGÇÃ’ÖGB“°¢–b†Ræ‡VÖæö–EG&&V6÷fW'’bfRç7FFSÓÓÒw&V6÷fW"r—°¢RçF–ÖW"ÓÖGC¶–b†RçF–ÖW#ÃÓ—¶Ræ‡VÖæö–EG&&V6÷fW'“ÖfÇ6S¶Rç7FFSÒv‡VçBs·Ö6öçF–çVS°¢Ð¢6öç7BG&ÖRç7FFRÓÒw6æ&VBrbgF†—2çG&2æf–æB‡CÓçBæÆ–fSãbfF—7Fæ6R‡BÆR“Ã3“°¢–b‡G&òçf&–çCÓÓÒw6Æ÷rr–Rç&ö÷FVCÔÖF‚æÖ‚†Rç&ö÷FVBÂãR“°¢VÇ6R–b‡G&—°¢G&æÆ–fSÓ¶Rç7FFS×G&çf&–çCÓÓÒv–çFW''WBsòw&V6÷fW"s¢w6æ&VBs°¢RçF–ÖW#×G&çf&–çCÓÓÒv–çFW''WBsóãƒ§'VÆW2æ6GW&UF–ÖR¢‡G&æ6GW&WÇÃ“°¢Ræ‡VÖæö–EG&&V6÷fW'“×G&çf&–çCÓÓÒv–çFW''WBs¶RæfÆ6ƒÒã#¶RæGF6³Ó°¢Rç7V67V'W4GF6³ÖçVÆÃ¶Rç7V67V'W5v–æGWÓ¶Rç7V67V'W4–ÓÖçVÆÃ¶Rç7V67V'W4fÆ–v‡D†V–v‡CÓ°¢Ræ–×v–æGWÓ¶Ræ–×–ÓÖçVÆÃ¶Rç¦öÖ&–Uv–æGWÓ¶Rç¦öÖ&–T–ÓÖçVÆÃ¶Rç¦öÖ&–UF&vWCÖçVÆÃ°¢F†—2æöå6÷VæB‚wG&rÆR“¶6öçF–çVS°¢Ð¢Ð¢–b†Ræ¶–æCÓÓÒw7V67V'W2r—·F–6µ7V67V'W2‡F†—2ÆRÆÆ—fRÆGBÆ6fsòç7FG2Æ&V‚“¶6öçF–çVS·Ð¢–b†Ræ¶–æCÓÓÒv–×r—·F–6´–×‡F†—2ÆRÆÆ—fRÆGBÆ6fsòç7FG2Æ&V‚“¶6öçF–çVS·Ð¢–b†Ræ¶–æCÓÓÒw¦öÖ&–Rr—·F–6µ¦öÖ&–R‡F†—2ÆRÆÆ—fRÆGBÆ6fsòç7FG2Æ&V‚“¶6öçF–çVS·Ð¢–b†Ræ¶–æCÓÓÒvæ6öæFr—·F–6´æ6öæF‡F†—2ÆRÆÆ—fRÆGBÆ6fsòç7FG2Æ6fsòæ&V†f–÷'2“¶6öçF–çVS·Ð¢–b†Ræ¶–æBÓÓÒ'vöÆb"—·F–6µvöÆb‡F†—2ÆRÆÆ—fRÆGB“¶6öçF–çVS·ÐÐ¢6öç7BæV&W7BÒÆ—fRç&VGV6R€Ð¢†&W7BÂ’Óâ‚&W7BÇÂF—7Fæ6R†RÂ’ÂF—7Fæ6R†RÂ&W7B’ò¢&W7B’ÀÐ¢çVÆÂÀÐ¢“°Ð¢–b‡F–6´æ–v‡DVæV×’‡F†—2ÆRÆæV&W7BÆGB’–6öçF–çVS°Ð¢ÆWBÐÐ¢RçFV×W&ÖVçBÓÓÒ'&W7FÆW72"bbÆ—fRæÆVæwF‚âÐ¢òÆ—fU¶Ræ–BRÆ—fRæÆVæwF…ÐÐ¢¢æV&W7C°Ð¢–b†”¶–æBÓÓÒ'f–æR"Ð¢ÒF†—2æ&—G2æf–æB‚†"’ÓâF—7Fæ6R†"ÂR’Âƒ’ÇÂ°Ð¢–b‚’6öçF–çVS°Ð¢–b†”¶–æBÓÓÒwçF†W"r’²F–6µçF†W"‡F†—2ÆRÇÆGBÆ6fsòç7FG2“²6öçF–çVS²ÐÐ Ð¢–b†6fsòç7FG3òæFWFV7F–öâbbF—7Fæ6R†RÂ’â‡F†—2æ†÷W6Só##¦6frç7FG2æFWFV7F–öâ’Ð¢6öçF–çVS°Ð¢6öç7B&ævUFõF&vWBÒF—7Fæ6R†RÂ’ÇÂ°Ð Ð¢6öç7B–Õ‚Ò‡ç‚ÒRç‚’ò&ævUFõF&vWBÀÐ¢–Õ’Ò‡ç’ÒRç’’ò&ævUFõF&vWC°Ð¢–b‡F†—2æ†÷W6Rbb‚6ÆV%6†÷B‡F†—2ÆRÇ—ÇÂ‡&ævUFõF&vWCãbe²&Æ–öâ"Â'v†—FUöÆ–öâ"Â'6æ÷uöÆV÷&B%Òæ–æ6ÇVFW2†Ræ¶–æB’’’’°Ð¢RæGF6²Ò°Ð¢æf–vFTVæV×’‡F†—2ÆRÇÆGB“°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†&V‚æf—&V&ÆÂ’°Ð¢Ræf—&V&ÆÇ4GF6²ÒÖF‚æÖ‚ƒÂ†Ræf—&V&ÆÇ4GF6²ÇÂ’ÒGB“°Ð¢6öç7B&Wf–÷W5‚ÒRç‚ÀÐ¢&Wf–÷W5’ÒRç“°Ð¢RæÖ÷f–ærÒfÇ6S°Ð¢Ræf—&T6ööÆF÷vâÒ†Ræf—&T6ööÆF÷vâóòãR’ÒGC°Ð¢Ræf6U‚Ò–Õƒ°Ð¢Ræf6U’Ò–Õ“°Ð¢–b‡&ævUFõF&vWBÂ3cbbRæf—&T6ööÆF÷vâÃÒ’°Ð¢Ræf—&V&ÆÇ4GF6²ÒãCS°Ð¢F†—2æf—&V&ÆÇ2çW6‚‡°Ð¢ƒ¢Rç‚ÀÐ¢“¢Rç’ÀÐ¢gƒ¢–Õ‚¢“ÀÐ¢g“¢–Õ’¢“ÀÐ¢Æ–fS¢2ãÀÐ¢G&–Ã¢ÀÐ¢FÖvS¢RæFÖvRÀÐ¢'W&äFÖvS¢6frç7FG2æ'W&äFÖvRÀÐ¢vFW#¢”¶–æBÓÓÒ'vFW%öVÆVÖVçFÂ"ÀÐ¢–6S¢”¶–æBÓÓÒ'vFW%öVÆVÖVçFÂ"ÀÐ¢Ò“°Ð¢Ræf—&T6ööÆF÷vâÒ6frç7FG2æf—&T6ööÆF÷vâÇÂ"ãC°Ð¢ÐÐ¢–b‡&ævUFõF&vWBÂÐ¢F†—2æÖ÷fT7F÷"†RÂÖ–Õ‚¢Rç7VVB¢GBÂÖ–Õ’¢Rç7VVB¢GB“°Ð¢VÇ6R–b‡&ævUFõF&vWBâ“Ð¢F†—2æÖ÷fT7F÷"†RÂ–Õ‚¢Rç7VVB¢GBÂ–Õ’¢Rç7VVB¢GB“°Ð¢–b†RæÖ÷f–ærbb&V‚æf—&UG&–Âbb”¶–æBÓÒ'vFW%öVÆVÖVçFÂ"’°Ð¢Ræf—&UG&–ÅF–ÖW"Ò†Ræf—&UG&–ÅF–ÖW"ÇÂ’ÒGC°Ð¢–b†Ræf—&UG&–ÅF–ÖW"ÃÒ’°Ð¢f—&UF6‚‡F†—2Â&Wf–÷W5‚Â&Wf–÷W5’Âã‚Â6frç7FG2æ'W&äFÖvR“°Ð¢Ræf—&UG&–ÅF–ÖW"Òã3ƒ°Ð¢ÐÐ¢–b„ÖF‚ç&æFöÒ‚’ÂGB¢2Ð¢F†—2æf—&U'F–6ÆW2çW6‚‡°Ð¢ƒ¢Rç‚²„ÖF‚ç&æFöÒ‚’ÒãR’¢BÀÐ¢“¢Rç’ÒÀÐ¢Æ–fS¢ãrÀÐ¢6Öö¶S¢G'VRÀÐ¢Ò“°Ð¢ÐÐ¢6öçF–çVS°Ð¢ÐÐ¢–b†&V‚æfÆÖT'&VF‚ÇÂ&V‚çF–Å7v—R’°Ð¢Ræf—&T6ööÆF÷vâÒ†Ræf—&T6ööÆF÷vâÇÂ’ÒGC°Ð¢–b†Ræf—&T7F–öâ’°Ð¢Ræf—&T7F–öåF–ÖW"ÓÒGC°Ð¢–b†Ræf—&T7F–öåF–ÖW"ÃÒ’°Ð¢–b†Ræf—&T7F–öâÓÓÒ'F–Â"’°Ð¢f÷"†6öç7BöbÆ—fR’°Ð¢6öç7BBÒF—7Fæ6R†RÂ’ÇÂ°Ð¢–b€Ð¢BÂƒbb`Ð¢‚‡ç‚ÒRç‚’¢Ræf6U‚²‡ç’ÒRç’’¢Ræf6U’’òBÂã€Ð¢Ð¢F†—2æ‡W'B‡ÂRæFÖvRÂR“°Ð¢ÐÐ¢F†—2æVffV7G2çW6‚‡°Ð¢ƒ¢Rç‚²Ræf6U‚¢3bÀÐ¢“¢Rç’²Ræf6U’¢3bÀÐ¢&F—W3¢S"ÀÐ¢6öÆ÷#¢"6Cƒ†C’"ÀÐ¢Æ–fS¢ã3RÀÐ¢Ò“°Ð¢ÒVÇ6R°Ð¢6öç7B&V6‚Ò6frç7FG2æfÆÖU&ævRÇÂ“°Ð¢f÷"†ÆWB7FWÒ#²7FWÃÒ&V6ƒ²7FW³Ò#‚’°Ð¢6öç7B7‚ÒRç‚²Ræf6U‚¢7FWÀÐ¢7’ÒRç’²Ræf6U’¢7FW°Ð¢f—&UF6‚‡F†—2Â7‚Â7’Â2Â6frç7FG2æ'W&äFÖvR“°Ð¢f—&UF6‚€Ð¢F†—2ÀÐ¢7‚ÒRæf6U’¢#"ÀÐ¢7’²Ræf6U‚¢#"ÀÐ¢"ãBÀÐ¢6frç7FG2æ'W&äFÖvRÀÐ¢“°Ð¢f—&UF6‚€Ð¢F†—2ÀÐ¢7‚²Ræf6U’¢#"ÀÐ¢7’ÒRæf6U‚¢#"ÀÐ¢"ãBÀÐ¢6frç7FG2æ'W&äFÖvRÀÐ¢“°Ð¢ÐÐ¢f÷"†6öç7BöbÆ—fR’°Ð¢6öç7BG‚Òç‚ÒRç‚ÀÐ¢G’Òç’ÒRç’ÀÐ¢BÒÖF‚æ‡—÷B†G‚ÂG’’ÇÂ°Ð¢–b†BÂ&V6‚bb†G‚¢Ræf6U‚²G’¢Ræf6U’’òBâãc"’°Ð¢F†—2æ‡W'B‡ÂRæFÖvRÂR“°Ð¢æ'W&æ–ærÒÖF‚æÖ‚‡æ'W&æ–ærÇÂÂ"“°Ð¢æ'W&äFÖvRÒ6frç7FG2æ'W&äFÖvS°Ð¢æ'W&åF–6²ÒãS°Ð¢ÐÐ¢ÐÐ¢ÐÐ¢Ræf—&T7F–öâÒçVÆÃ°Ð¢Rç7FFRÒ'&V6÷fW"#°Ð¢RçF–ÖW"ÒãƒS°Ð¢Ræ6ööÆF÷vâÒ6frç7FG2æf—&T6ööÆF÷vâÇÂ2ã#°Ð¢ÐÐ¢6öçF–çVS°Ð¢ÐÐ¢Ræf6U‚Ò–Õƒ°Ð¢Ræf6U’Ò–Õ“°Ð¢–b†Ræf—&T6ööÆF÷vâÃÒ’°Ð¢–b‡&ævUFõF&vWBÂ“’°Ð¢Ræf—&T7F–öâÒ'F–Â#°Ð¢Ræf—&T7F–öåF–ÖW"ÒãCS°Ð¢Rç7FFRÒ'F–Å7v—R#°Ð¢ÒVÇ6R–b‡&ævUFõF&vWBÃÒ†6frç7FG2æfÆÖU&ævRÇÂ“’’°Ð¢Ræf—&T7F–öâÒ&'&VF‚#°Ð¢Ræf—&T7F–öåF–ÖW"Òãƒ°Ð¢Rç7FFRÒ&'&VF‚#°Ð¢ÐÐ¢ÐÐ¢–b‡&ævUFõF&vWBâÐ¢F†—2æÖ÷fT7F÷"†RÂ–Õ‚¢Rç7VVB¢GBÂ–Õ’¢Rç7VVB¢GB“°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†”¶–æBÓÓÒ&vöÆVÒ"’°Ð¢Rç&ö6µF–ÖW"Ò†Rç&ö6µF–ÖW"ÇÂ’ÒGC°Ð¢–b†Ræ&÷VÆFW%&VG’bb&ævUFõF&vWBÂ#3R’°Ð¢F†—2æ'&÷w2çW6‚‡°Ð¢–C¢F†—2ææW‡D–B²²ÀÐ¢ƒ¢Rç‚ÀÐ¢“¢Rç’ÀÐ¢£¢#‚ÀÐ¢gƒ¢–Õ‚¢cRÀÐ¢g“¢–Õ’¢cRÀÐ¢g£¢3RÀÐ¢FÖvS¢RæFÖvRÀÐ¢†÷7F–ÆS¢G'VRÀÐ¢&ö6³¢G'VRÀÐ¢Ò“°Ð¢Ræ&÷VÆFW%&VG’ÒfÇ6S°Ð¢RæGF6²ÒãCS°Ð¢Rç7FFRÒ'&V6÷fW"#°Ð¢RçF–ÖW"Òã“°Ð¢Ræ6ööÆF÷vâÒ#°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b€Ð¢Ræ&÷VÆFW%&VG’b`Ð¢&ævUFõF&vWBâsb`Ð¢Rç&ö6µF–ÖW"ÃÒb`Ð¢Rç7FFRÓÒ'&ö6¶Æ–gB Ð¢’°Ð¢Rç7FFRÒ'&ö6¶Æ–gB#°Ð¢RçF–ÖW"Òãƒ°Ð¢Rç&ö6µF–ÖW"ÒRãS°Ð¢Ræf6U‚Ò–Õƒ°Ð¢Ræf6U’Ò–Õ“°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†Rç7FFRÓÓÒ'&ö6¶Æ–gB"’°Ð¢RçF–ÖW"ÓÒGC°Ð¢–b†RçF–ÖW"ÃÒ’°Ð¢Rç7FFRÒ&‡VçB#°Ð¢Ræ&÷VÆFW%&VG’ÒG'VS°Ð¢ÐÐ¢6öçF–çVS°Ð¢ÐÐ¢ÐÐ¢–b†”¶–æBÓÓÒvæV7&öÖæ6W"rÇÂ”¶–æBÓÓÒw6¶VÆWFöåö67FW"r’°Ð¢–b†”¶–æBÓÓÒvæV7&öÖæ6W"r’°Ð¢Rç7VÖÖöä6ööÆF÷vâÒÖF‚æÖ‚ƒÂ†Rç7VÖÖöä6ööÆF÷vâÇÂ’ÒGB“°Ð¢–b†Rç7VÖÖöä6ööÆF÷vâÃÒbbF†—2ç7VÖÖöäæV7&öÖæ6W$Ö–æ–öç2†R’’6öçF–çVS°Ð¢ÐÐ¢Ræ†VÄ6ööÆF÷vâÒ†Ræ†VÄ6ööÆF÷vâóò"’ÒGC°Ð¢6öç7BÆÇ’ÒF†—2æVæVÖ–W2æf–ÇFW"‡ÓâÓÒRbbæ‡âbbæw&÷WÓÓÒRæw&÷Wbbæ‡ÂæÖ„‡Ð¢ç6÷'B‚†Æ"’Óâæ‡òæÖ„‡Ò"æ‡ò"æÖ„‡•³Ó°Ð¢6öç7BÖæ6÷7BÒ"ÂF&vWDF—7Fæ6RÒÆÇ’òF—7Fæ6R†RÂÆÇ’’¢–æf–æ—G“°Ð¢–b†ÆÇ’bbRæ†VÄ6ööÆF÷vâÃÒbb†RæÖæóò’ãÒÖæ6÷7BbbF&vWDF—7Fæ6RÂ3“’°Ð¢ÆÇ’æ‡ÒÖF‚æÖ–â†ÆÇ’æÖ„‡ÂÆÇ’æ‡²†”¶–æBÓÓÒvæV7&öÖæ6W"rò3B¢#"’“°Ð¢RæÖæÓÒÖæ6÷7C²Ræ†VÄ6ööÆF÷vâÒ”¶–æBÓÓÒvæV7&öÖæ6W"rò‚¢c²Ræ†VÄVffV7BÒãƒ°Ð¢F†—2æVffV7G2çW6‚‡·ƒ¦ÆÇ’ç‚Ç“¦ÆÇ’ç’Ç&F—W3£#‚Æ6öÆ÷#¢r6Csv6fbrÆÆ–fS¢ã‚ÇFW‡C¢r²wÒ“°Ð¢F†—2æöå6÷VæB‚vÖv–2rÆR“²6öçF–çVS°Ð¢ÐÐ¢6öç7B6Æ÷6RÒ&ævUFõF&vWBÂs#°Ð¢–b†6Æ÷6RbbRæ6ööÆF÷vâÃÒ’°Ð¢RæGF6²Òã3C²Ræ6ööÆF÷vâÒãS²F†—2æ‡W'B‡ÂRæFÖvRÂR“²6öçF–çVS°Ð¢ÐÐ¢–b‚†RæÖæóò’ÂÖæ6÷7Bbb&ævUFõF&vWBâs"bb&V‚æ‡VçB’F†—2æÖ÷fT7F÷"†RÂ–Õ‚¢Rç7VVB¢GBÂ–Õ’¢Rç7VVB¢GB“°Ð¢VÇ6R–b‡&ævUFõF&vWBÂCR’F†—2æÖ÷fT7F÷"†RÂÖ–Õ‚¢3‚¢GBÂÖ–Õ’¢3‚¢GB“°Ð¢VÇ6R–b‡&ævUFõF&vWBâ3bb&V‚æ‡VçB’F†—2æÖ÷fT7F÷"†RÂ–Õ‚¢Rç7VVB¢GBÂ–Õ’¢Rç7VVB¢GB“°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†”¶–æBÓÓÒ'6¶VÆWFöå÷v—¦&B"’°Ð¢Ræ†VÄ6ööÆF÷vâÒ†Ræ†VÄ6ööÆF÷vâóò"’ÒGC°Ð¢6öç7BÆÇ’ÒF†—2æVæVÖ–W0Ð¢æf–ÇFW"€Ð¢‡’ÓâÓÒRbbæ‡âbbæw&÷WÓÓÒRæw&÷Wbbæ‡ÂæÖ„‡ÀÐ¢Ð¢ç6÷'B‚†Â"’Óâæ‡òæÖ„‡Ò"æ‡ò"æÖ„‡•³Ó°Ð¢–b†ÆÇ’bbRæ†VÄ6ööÆF÷vâÃÒ’°Ð¢ÆÇ’æ‡ÒÖF‚æÖ–â€Ð¢ÆÇ’æÖ„‡ÀÐ¢ÆÇ’æ‡²ÖF‚æÖ‚ƒ‚ÂÆÇ’æÖ„‡¢ã#‚’ÀÐ¢“°Ð¢Ræ†VÄ6ööÆF÷vâÒ#°Ð¢Ræ†VÄVffV7BÒãƒ°Ð¢F†—2æVffV7G2çW6‚‡°Ð¢ƒ¢ÆÇ’ç‚ÀÐ¢“¢ÆÇ’ç’ÀÐ¢&F—W3¢#RÀÐ¢6öÆ÷#¢"6ffSv2"ÀÐ¢Æ–fS¢ã‚ÀÐ¢FW‡C¢"²"ÀÐ¢Ò“°Ð¢ÒVÇ6R–b†Ræ6ööÆF÷vâÃÒbb&ævUFõF&vWBÂC#’°Ð¢F†—2æ'&÷w2çW6‚‡°Ð¢–C¢F†—2ææW‡D–B²²ÀÐ¢ƒ¢Rç‚ÀÐ¢“¢Rç’ÀÐ¢£¢#ÀÐ¢gƒ¢–Õ‚¢#ÀÐ¢g“¢–Õ’¢#ÀÐ¢g£¢ÀÐ¢FÖvS¢ÖF‚æÖ‚ƒÂRæFÖvRÒB’ÀÐ¢†÷7F–ÆS¢G'VRÀÐ¢–6S¢G'VRÀÐ¢Ò“°Ð¢Ræ6ööÆF÷vâÒ"ãƒ°Ð¢RæGF6²ÒãC°Ð¢ÐÐ¢–b‡&ævUFõF&vWBÂSÐ¢F†—2æÖ÷fT7F÷"†RÂÖ–Õ‚¢3R¢GBÂÖ–Õ’¢3R¢GB“°Ð¢6öçF–çVS°Ð¢ÐÐ¢Rç7—EF–ÖRÒÖF‚æÖ‚ƒÂ†Rç7—EF–ÖRÇÂ’ÒGB“°Ð¢–b†&V‚çö—6öå7—B’°Ð¢Rç7—D6ööÆF÷vâÒ†Rç7—D6ööÆF÷vâÇÂ’ÒGC°Ð¢–b†Rç7—EF–ÖRÃÒã"bbRçVæF–æu7—B’°Ð¢–b†RæfÆ6‚ÃÒbbRç7FFRÓÒ'6æ&VB"Ð¢F†—2çö—6öå6†÷G2çW6‚‡²ââæRçVæF–æu7—BÂƒ¢Rç‚Â“¢Rç’Ò“°Ð¢RçVæF–æu7—BÒçVÆÃ°Ð¢ÐÐ¢6öç7B&ævRÒF—7Fæ6R†RÂ“°Ð¢–b€Ð¢Rç7—D6ööÆF÷vâÃÒb`Ð¢&ævRâ“b`Ð¢&ævRÂ3Sb`Ð¢RçVæF–æu7—@Ð¢’°Ð¢6öç7B7VVBÒ6frç7FG2ç7—E7VVBÇÂ“°Ð¢Rç7—EF–ÖRÒãc°Ð¢Rç7—D6ööÆF÷vâÒ6frç7FG2ç7—D6ööÆF÷vâÇÂ2ãS°Ð¢RçVæF–æu7—BÒ°Ð¢gƒ¢‚‡ç‚ÒRç‚’ò&ævR’¢7VVBÀÐ¢g“¢‚‡ç’ÒRç’’ò&ævR’¢7VVBÀÐ¢Æ–fS¢"ÀÐ¢FÖvS¢6frç7FG2çö—6öäFÖvRÇÂ"ÀÐ¢GW&F–öã¢6frç7FG2çö—6öäGW&F–öâÇÂBÀÐ¢Ó°Ð¢ÐÐ¢ÐÐ¢–b†&V‚æ&ææ’°Ð¢Ræ&ææF–ÖW"Ò†Ræ&ææF–ÖW"ÇÂ’ÒGC°Ð¢–b†RçVæF–æt&ææbbRçF‡&÷uF–ÖRÃÒã#‚’°Ð¢–b†Rç7FFRÓÒ'6æ&VB"bbRæfÆ6‚ÃÒÐ¢F†—2æ&ææ2çW6‚‡²ââæRçVæF–æt&ææÂƒ¢Rç‚Â“¢Rç’Ò“°Ð¢RçVæF–æt&ææÒçVÆÃ°Ð¢ÐÐ¢6öç7B&ævRÒF—7Fæ6R†RÂ“°Ð¢–b€Ð¢Ræ&ææF–ÖW"ÃÒb`Ð¢&ævRâSb`Ð¢&ævRÂ3b`Ð¢Rç7FFRÓÒ'6æ&VB"b`Ð¢RæfÆ6‚ÃÒ Ð¢’°Ð¢6öç7BBÒ&ævRÇÂ°Ð¢RçVæF–æt&ææÒ°Ð¢ƒ¢Rç‚ÀÐ¢“¢Rç’ÀÐ¢£¢#"ÀÐ¢gƒ¢‚‡ç‚ÒRç‚’òB’¢†6frç7FG2æ&ææ7VVBÇÂƒ’ÀÐ¢g“¢‚‡ç’ÒRç’’òB’¢†6frç7FG2æ&ææ7VVBÇÂƒ’ÀÐ¢g£¢SRÀÐ¢Æ–fS¢2ÀÐ¢FÖvS¢‚ÀÐ¢Ó°Ð¢Ræ&ææF–ÖW"Ò6frç7FG2æ&ææ6ööÆF÷vâÇÂ"ãS°Ð¢RçF‡&÷uF–ÖRÒãS°Ð¢Ræf6U‚Ò‡ç‚ÒRç‚’òC°Ð¢Ræf6U’Ò‡ç’ÒRç’’òC°Ð¢ÐÐ¢ÐÐ¢–b†Ræ¶–æCÓÓÒv&ç6†VU÷VVVârbf&V‚ç&ævVB—·F–6´&ç6†VUVVVâ‡F†—2ÆRÇÆGBÆ6frç7FG2Æ&V‚“¶6öçF–çVS·Ð¢–b‚†Ræ¶–æCÓÓÒv&V†öÆFW"wÇÆRæ¶–æCÓÓÒvÆW76W%ö&V†öÆFW"r’bf&V‚ç&ævVB—·F–6´&V†öÆFW"‡F†—2ÆRÇÆGBÆ6frç7FG2“¶6öçF–çVS·Ð¢–b†&V‚ç&ævVB’°¢VæV×•V—fW"†R“°Ð¢–b†Rç7FFRÓÒw6æ&VBrbg&WG&–WfTVæV×”'&÷w2‡F†—2ÆRÆGB’–6öçF–çVS°Ð¢6öç7BBÒF—7Fæ6R†RÂ’ÇÂ°Ð¢Ræf6U‚Ò‡ç‚ÒRç‚’òC°Ð¢Ræf6U’Ò‡ç’ÒRç’’òC°Ð¢6öç7B6å6†ö÷BÒBÃÒ†6fsòç7FG2ç&ævVE&ævRÇÂ3c’bb6ÆV%6†÷B‡F†—2ÆRÇ“°Ð¢–b‚6å6†ö÷B’°Ð¢–b†&V‚æ‡VçBÓÒfÇ6R’æf–vFTVæV×’‡F†—2ÆRÇÆGB“°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†Rç7FFRÓÓÒw6æ&VBr’²RçF–ÖW"ÓÒGC²–b†RçF–ÖW#ÃÓ–Ræ‡Ó²6öçF–çVS²ÐÐ¢–b†Ræ6ööÆF÷vâÃÒbbRæ'&÷w4ÆVgCã’°Ð¢F†—2æ'&÷w2çW6‚‡°Ð¢ÖÖõG—S¢v'&÷rrÇ6†gDÆVæwFƒ£#BÀ¢–C¢F†—2ææW‡D–B²²ÀÐ¢ƒ¢Rç‚ÀÐ¢“¢Rç’ÀÐ¢£¢#ÀÐ¢gƒ¢Ræf6U‚¢#sÀÐ¢g“¢Ræf6U’¢#sÀÐ¢g£¢CRÀÐ¢FÖvS¢RæFÖvRÀÐ¢†÷7F–ÆS¢G'VRÀÐ¢Ò“°Ð¢Ræ'&÷w4ÆVgBÒÓ°Ð¢Ræ6ööÆF÷vâÒ6fsòç7FG2ç&ævVD6ööÆF÷vâÇÂ"ã3°Ð¢RæGF6²Òã3C°Ð¢ÐÐ¢–b†BÂ3’F†—2æÖ÷fT7F÷"†RÂÖRæf6U‚¢C¢GBÂÖRæf6U’¢C¢GB“°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†Rç7FFRÓÓÒ'&V6÷fW""’°Ð¢RçF–ÖW"ÓÒGC°Ð¢–b†RçF–ÖW"ÃÒ’°Ð¢Rç7FFRÒ&‡VçB#°Ð¢RçF7F–5F–ÖRÒã"²F†—2ç&æFöÒ‚’¢ãC°Ð¢ÐÐ¢6öçF–çVS°Ð¢ÐÐ¢–b†Rç7FFRÓÓÒ&fÆVR"’°Ð¢RçF–ÖW"ÓÒGC°Ð¢6öç7BBÒF—7Fæ6R†RÂ’ÇÂ°Ð¢F†—2æÖ÷fT7F÷"€Ð¢RÀÐ¢‚†Rç‚Òç‚’òB’¢Rç7VVB¢GBÀÐ¢‚†Rç’Òç’’òB’¢Rç7VVB¢GBÀÐ¢“°Ð¢–b†RçF–ÖW"ÃÒ’Rç7FFRÒ&‡VçB#°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†Rç7FFRÓÓÒ'6æ&VB"’°Ð¢RçF–ÖW"ÓÒGC°Ð¢–b†RçF–ÖW"ÃÒ’Ræ‡Ò°Ð¢6öçF–çVS°Ð¢ÐÐ¢6öç7BG&ÒF†—2çG&2æf–æB‚‡B’ÓâBæÆ–fRâbbF—7Fæ6R‡BÂR’Â3“°Ð¢–b‡G&bbG&çf&–çBÓÓÒ'6Æ÷r"’°Ð¢Rç&ö÷FVBÒÖF‚æÖ‚†Rç&ö÷FVBÇÂÂãR“°Ð¢F†—2æÖ÷fT7F÷"†RÂ‡G&ç‚ÒRç‚’¢GB¢ãÂ‡G&ç’ÒRç’’¢GB¢ã“°Ð¢ÐÐ¢–b‡G&bbG&çf&–çBÓÒ'6Æ÷r"’°Ð¢G&æÆ–fRÒ°Ð¢Rç7FFRÒG&çf&–çBÓÓÒ&–çFW''WB"ò'&V6÷fW""¢'6æ&VB#°Ð¢RçF–ÖW"ÐÐ¢G&çf&–çBÓÓÒ&–çFW''WB Ð¢òã€Ð¢¢'VÆW2æ6GW&UF–ÖR¢‡G&æ6GW&RÇÂ“°Ð¢RæfÆ6‚Òã#°Ð¢F†—2æöå6÷VæB‚'G&"“°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†Rç7FFRÓÓÒ'v–æGW"’°Ð¢RçF–ÖW"ÓÒGC°Ð¢–b†RçF–ÖW"ÃÒ’°Ð¢RæGF6²Òã3C°Ð¢–b€Ð¢”¶–æBÓÓÒ&vöÆVÒ"ÇÀÐ¢”¶–æBÓÓÒ'f–æR"ÇÀÐ¢”¶–æBÓÓÒ'6¶VÆWFöâ Ð¢’°Ð¢f÷"†6öç7BöbÆ—fRÐ¢–b€Ð¢F—7Fæ6R†RÂ’ÀÐ¢†”¶–æBÓÓÒ&vöÆVÒ Ð¢ò“PÐ¢¢”¶–æBÓÓÒ'6¶VÆWFöâ Ð¢òcPÐ¢¢#’b`Ð¢†”¶–æBÓÓÒ&vöÆVÒ"ÇÀÐ¢‚‡ç‚ÒRç‚’¢RæG‚²‡ç’ÒRç’’¢RæG’’ðÐ¢†F—7Fæ6R†RÂ’ÇÂ’àÐ¢ãcRÐ¢’°Ð¢6öç7B&Vf÷&RÒæ‡°Ð¢F†—2æ‡W'B‡ÂRæFÖvRÂR“°Ð¢–b†”¶–æBÓÓÒ&vöÆVÒ"bbæ‡Â&Vf÷&Rbbæ‡â’°Ð¢ç7GVâÒ6fsòç7FG2ç7GVäGW&F–öâóòãS°Ð¢ç7GVäÖ‚Òç7GVã°Ð¢6öç7BBÒF—7Fæ6R†RÂ’ÇÂ°Ð¢F†—2æÖ÷fT7F÷"€Ð¢ÀÐ¢‚‡ç‚ÒRç‚’òB’¢†6fsòç7FG2æ¶æö6¶&6²óòƒR’ÀÐ¢‚‡ç’ÒRç’’òB’¢†6fsòç7FG2æ¶æö6¶&6²óòƒR’ÀÐ¢“°Ð¢ÐÐ¢–b†&V‚ç&ö÷Bbb7FB‡Â'&ö÷E&W6—7B"’’ç&ö÷FVBÒãS°Ð¢ÐÐ¢–b†”¶–æBÓÓÒ'f–æR"Ð¢F†—2æ&—G2ÒF†—2æ&—G2æf–ÇFW"‚†"’ÓâF—7Fæ6R†RÂ"’â3“°Ð¢Rç7FFRÒ'&V6÷fW"#°Ð¢RçF–ÖW"Ò6fsòæVF—FV@Ð¢ò6frç7FG2ç&V6÷fW'Ð¢¢”¶–æBÓÓÒ'6¶VÆWFöâ Ð¢òã0Ð¢¢ãƒ°Ð¢Ræ6ööÆF÷vâÒ#°Ð¢F†—2æVffV7G2çW6‚‡°Ð¢ƒ¢Rç‚ÀÐ¢“¢Rç’ÀÐ¢&F—W3¢”¶–æBÓÓÒ&vöÆVÒ"ò“R¢#ÀÐ¢6öÆ÷#¢"6c&CsB"ÀÐ¢Æ–fS¢ã3RÀÐ¢Ò“°Ð¢ÒVÇ6R°Ð¢Rç7FFRÒ&6†&vR#°Ð¢–b†&V‚æ§V×—7F'D§V×†R“°Ð¢RçF–ÖW"Ò6fsòç7FG0Ð¢ò6frç7FG2æF6„F—7Fæ6RòÖF‚æÖ‚ƒÂ6frç7FG2æF6…7VVBÐ¢¢ãCƒ°Ð¢ÐÐ¢ÐÐ¢6öçF–çVS°Ð¢ÐÐ¢–b†Rç7FFRÓÓÒ&6†&vR"’°Ð¢–b†&V‚æ§V×bbRæ§V×†V–v‡B—7F'D§V×†R“°Ð¢RçF–ÖW"ÓÒGC°Ð¢6öç7BG&fVÂÒF†—2æÖ÷fT7F÷"€Ð¢RÀÐ¢RæG‚¢†6fsòç7FG2æF6…7VVBÇÂ3C’¢GBÀÐ¢RæG’¢†6fsòç7FG2æF6…7VVBÇÂ3C’¢GBÀÐ¢²&&B"Â'v7%Òæ–æ6ÇVFW2†”¶–æB’ÀÐ¢“°Ð¢–b‡G&fVÂÂGB¢ƒbb†&V‚æ§V×bfRæ§V×†V–v‡CãbfRæ§V×fVÆö6—G“ã’’RçF–ÖW"Ò°Ð¢f÷"†6öç7BöbÆ—fR’–b†F—7Fæ6R†RÂ’Â3’°Ð¢6öç7B&Vf÷&RÒæ‡°Ð¢F†—2æ‡W'B‡ÂRæFÖvRÂR“°Ð¢–b†”¶–æBÓÓÒ'G6WG6R"bbæ‡Â&Vf÷&Rbbæ‡âbb‡ç6ÆVW–ærâ’’ç6ÆVW–ærÒ3°Ð¢ÐÐ¢–b†RçF–ÖW"ÃÒ’°Ð¢Rç7FFRÒ'&V6÷fW"#°Ð¢RçF–ÖW"Ò6fsòæVF—FV@Ð¢ò6frç7FG2ç&V6÷fW'Ð¢¢”¶–æBÓÓÒ&7&ö6öF–ÆR Ð¢òã0Ð¢¢ãcS°Ð¢Ræ6ööÆF÷vâÒ6fsòç7FG2æF6„6ööÆF÷vâÇÂãƒ°Ð¢ÐÐ¢6öçF–çVS°Ð¢ÐÐ¢6öç7BBÒF—7Fæ6R†RÂ’ÀÐ¢G‚Ò‡ç‚ÒRç‚’ò†BÇÂ’ÀÐ¢G’Ò‡ç’ÒRç’’ò†BÇÂ“°Ð¢Ræf6U‚ÒGƒ°Ð¢Ræf6U’ÒG“°Ð¢6öç7B7V6–ÂÒ°Ð¢&Æ–öâ"ÀÐ¢&7&ö6öF–ÆR"ÀÐ¢&&ö""ÀÐ¢'çF†W""ÀÐ¢&vöÆVÒ"ÀÐ¢'f–æR"ÀÐ¢'6æ¶R"ÀÐ¢&&B"ÀÐ¢'v7"ÀÐ¢'G6WG6R"ÀÐ¢'6¶VÆWFöâ"ÀÐ¢Òæ–æ6ÇVFW2†”¶–æB“°Ð¢–b€Ð¢7V6–Âb`Ð¢†&V‚æF6‚ÇÀÐ¢…²'f–æR"Â&vöÆVÒ"Â'6¶VÆWFöâ%Òæ–æ6ÇVFW2†”¶–æB’bb&V‚æÖVÆVR’’b`Ð¢BÀÐ¢†6fsòæVF—FV@Ð¢ò6frç7FG2æGF6µ&ævPÐ¢¢”¶–æBÓÓÒ'f–æR Ð¢ò# Ð¢¢”¶–æBÓÓÒ'6¶VÆWFöâ Ð¢òcPÐ¢¢”¶–æBÓÓÒ&vöÆVÒ Ð¢ò“PÐ¢¢SR’b`Ð¢Ræ6ööÆF÷vâÃÒb`Ð¢‚²&Æ–öâ"Â'çF†W""Â&&B"Â'v7%Òæ–æ6ÇVFW2†”¶–æB’ÇÀÐ¢RçF7F–5F–ÖRÃÒÐ¢’°Ð¢Rç7FFRÒ'v–æGW#°Ð¢RçF–ÖW"Ò6fsòæVF—FV@Ð¢ò6frç7FG2çv–æGW Ð¢¢”¶–æBÓÓÒ&vöÆVÒ Ð¢òãÐ¢¢”¶–æBÓÓÒ'6æ¶R Ð¢òãƒPÐ¢¢ãcS°Ð¢RæG‚ÒGƒ°Ð¢RæG’ÒG“°Ð¢6öçF–çVS°Ð¢ÐÐ¢–b†Bâ#2bb&V‚æ‡VçB’°Ð¢ÆWBg‚ÒG‚ÀÐ¢g’ÒG“°Ð¢–b†&V‚æ6—&6ÆRbbBÂ##bbRçF7F–5F–ÖRâ’°Ð¢6öç7B&F–ÂÒBÂòÓãcR¢BâSRòãR¢°Ð¢g‚ÒG‚¢&F–ÂÒG’¢Ræ÷&&—C°Ð¢g’ÒG’¢&F–Â²G‚¢Ræ÷&&—C°Ð¢ÐÐ¢–b†”¶–æBÓÓÒ'6æ¶R"’°Ð¢6öç7B7v’ÒÖF‚ç6–â‡F†—2çF–ÖR¢B²Ræ–B’¢ãs°Ð¢g‚³ÒÖG’¢7v“°Ð¢g’³ÒG‚¢7v“°Ð¢ÐÐ¢–b†7&÷76W5F&ÆR†RÂ’’°Ð¢RæFWF÷W%‚óóÐÐ¢4TåDU"°Ð¢„ÖF‚ç6–vâ†Rç‚Ò4TåDU"’ÇÂRæ÷&&—B’¢…D$ÄRæ†Æev–GF‚²#"“°Ð¢–b„ÖF‚æ'2†Rç‚ÒRæFWF÷W%‚’âB’°Ð¢g‚ÒÖF‚ç6–vâ†RæFWF÷W%‚ÒRç‚“°Ð¢g’Ò°Ð¢ÒVÇ6R°Ð¢g‚Ò°Ð¢g’ÒÖF‚ç6–vâ‡ç’ÒRç’“°Ð¢ÐÐ¢ÒVÇ6RRæFWF÷W%‚ÒçVÆÃ°Ð¢6öç7Bæ÷&ÒÒÖF‚æ‡—÷B‡g‚Âg’’ÇÂ°Ð¢g‚óÒæ÷&Ó°Ð¢g’óÒæ÷&Ó°Ð¢6öç7BG&fVÂÒF†—2æÖ÷fT7F÷"€Ð¢RÀÐ¢g‚¢Rç7VVB¢GBÀÐ¢g’¢Rç7VVB¢GBÀÐ¢²&&B"Â'v7%Òæ–æ6ÇVFW2†”¶–æB’ÀÐ¢“°Ð¢–b‡G&fVÂÂRç7VVB¢GB¢ã#RbbRç7VVBâ’°Ð¢–b€Ð¢ÖF‚æ'2†Rç‚Ò4TåDU"’ÂD$ÄRæ†Æev–GF‚²"b`Ð¢ÖF‚æ'2†Rç’Ò4TåDU"’ÂD$ÄRæ†Æd†V–v‡B²3 Ð¢Ð¢F†—2æÖ÷fT7F÷"€Ð¢RÀÐ¢„ÖF‚ç6–vâ‡ç‚Ò4TåDU"’ÇÂRæ÷&&—B’¢Rç7VVB¢GBÀÐ¢ÀÐ¢“°Ð¢VÇ6PÐ¢F†—2æÖ÷fT7F÷"€Ð¢RÀÐ¢ÖG’¢Ræ÷&&—B¢Rç7VVB¢GBÀÐ¢G‚¢Ræ÷&&—B¢Rç7VVB¢GBÀÐ¢²&&B"Â'v7%Òæ–æ6ÇVFW2†”¶–æB’ÀÐ¢“°Ð¢ÐÐ¢ÐÐ¢–b†BÂ#’bbRæ6ööÆF÷vâÃÒ’°Ð¢–b†&V‚æÖVÆVRbb²'6¶VÆWFöâ"Â'f–æR%Òæ–æ6ÇVFW2†”¶–æB’’°Ð¢F†—2æ‡W'B‡ÂRæFÖvRÂR“°Ð¢–b†”¶–æCÓÓÒv&VWFÆRr–RæGF6³Òã#S°Ð¢ÐÐ¢Ræ6ööÆF÷vâÒ°Ð¢–b†&V‚ç7FVÂbbçG&2â’°Ð¢çG&2ÒÓ°Ð¢Rç7FFRÒ&fÆVR#°Ð¢RçF–ÖW"Ò"ãS°Ð¢F†—2æVffV7G2çW6‚‡°Ð¢ƒ¢Rç‚ÀÐ¢“¢Rç’Ò#RÀÐ¢FW‡C¢%5DôÄTâ"ÀÐ¢6öÆ÷#¢"6Vf3Cs"ÀÐ¢Æ–fS¢ÀÐ¢Ò“°Ð¢ÐÐ¢ÐÐ¢ÐÐ¢f÷"†6öç7BRöbF†—2æVæVÖ–W2æf–ÇFW"‚†R’ÓâRæ‡ÃÒbbRæFVfVFVB’’°Ð¢&V6÷&Dç5VW7D¶–ÆÂ‡F†—2ÆR“°¢RæFVfVFVBÒG'VS°Ð¢RæFVF…F–ÖW"Ò°Ð¢Rçv56æ&VBÒRç7FFRÓÓÒ'6æ&VB#°Ð¢òòFVF‚—2&VÂ7F÷"7FFRâ&VæFW&–ær÷vç2F†R6öÆÆ6RöfFRv–æF÷s°Ð¢òò6öÖ&BæB’Ç&VG’–væ÷&RFVfVFVB7F÷'2àÐ¢–b‚Rçv56æ&VB’°Ð¢Rç7FFRÒ&FVF‚#°Ð¢Rææ–ÖF–öä7F–öâÒ&FVF‚#°Ð¢ÐÐ¢–b†Ræf7F–öãÓÓÒvÆÇ’wÇÆ7&VGW&W5¶Ræ¶–æEÓòæf7F–öãÓÓÒvÆÇ’r—°Ð¢F†—2æÖW76vR†G¶Ræ¶–æGÒ6ö×æ–öâfVÆÂæ“°Ð¢G&÷&fVäÆö÷B‡F†—2ÆR“²òò6'&–VB&÷W'G’7W'f—fW2g&–VæG6†—æBFVF‚à¢6öçF–çVS²òòÆ÷6–ærg&–VæFÇ’7&VGW&R—2æ÷BâVæV×’¶–ÆÂ÷"Æö÷B&Wv&BàÐ¢ÐÐ¢–b†Ræ¶–æBÓÒv&VUö†—fRr—·7VÖÖöäv†÷7B‡F†—2ÆR“·7VÖÖöäæV7&öÖæ6W$öä¶–ÆÂ‡F†—2ÆR“·ÐÐ¢F†—2æ¶–ÆÆVD7&VGW&W2óóÒö&¦V7Bæ7&VFR†çVÆÂ“°Ð¢F†—2æ¶–ÆÆVD7&VGW&W5¶Ræ¶–æEÒÒ‡F†—2æ¶–ÆÆVD7&VGW&W5¶Ræ¶–æEÒÇÂ’²°Ð¢F†—2æVæV×”Æö÷B†R“°Ð¢F†—2æ6ÆV&VB²³°Ð¢F†—2æöå6÷VæB†7&VGW&T7VR†Ræ¶–æBÂvFVF‚r’ÆR“°Ð¢F†—2æVffV7G2çW6‚‡°Ð¢ƒ¢Rç‚ÀÐ¢“¢Rç’ÀÐ¢FW‡C¢Rç7FFRÓÓÒ'6æ&VB"ò%E$TB"¢$4ÄT$TB"ÀÐ¢6öÆ÷#¢"6#–Sf"ÀÐ¢Æ–fS¢ÀÐ¢Ò“°Ð¢–b‡F†—2ç&æFöÒ‚’Â†Ræ¶–æBÓÓÒ'çF†W""òã¢ãR’Ð¢F†—2ç–6·W2çW6‚‡²ƒ¢Rç‚Â“¢Rç’ÂW6VC¢fÇ6RÂÆ–fS¢CRÒ“°Ð¢–b†Ræ¶–æBÓÓÒ'çF†W""Ð¢f÷"†6öç7BöbF†—2çÆ–W'2æf–ÇFW"‡Óçæ‡ãbbç&ööÒ’’æ‡ÒÖF‚æÖ–â‡æÖ„‡ÇÃÂæ‡²#R“°Ð¢ÐÐ¢f÷"†6öç7BRöbF†—2æVæVÖ–W2’–b†Ræ‡ÃÒ’RæFVF…F–ÖW"Ò†RæFVF…F–ÖW"ÇÂ’²GC°Ð¢F†—2æVæVÖ–W2ÒF†—2æVæVÖ–W2æf–ÇFW"‚†R’Óà¢Ræ‡âÇÂ†Rçv56æ&VBòRç7FFRÓÓÒ'6æ&VB"bbfÇ6R¢†RæFVF…F–ÖW"ÇÂ’Â2ãR’À¢“°¢F–6´6†&Õ7FGW6W2‡F†—2Ã“²òò÷væW"FVF‚ög&–VæG6†—'&V·2F†R7VÆÂF†—2g&ÖRà¢òòâVæ6÷VçFW"6&B—2â7F—fRv&æ–ærÂæ÷BW&ÖæVçB&ææW"âöæ6PÐ¢òò—G27&VGW&W2&RvöæRÂ6Æ÷6R—B–ÖÖVF–FVÇ’6òF†RF—6ææ÷B6Æ–ÐÐ¢òòF†BF†R'G’—27F–ÆÂf–v‡F–ærF†B7&VGW&RG—RàÐ¢–b€Ð¢F†—2æWfVçBb`Ð¢F†—2æWfVçEF–ÖRâb`Ð¢‡F†—2æWfVçE7vä6÷VçBÇÂF†—2æWfVçBæ6÷VçB’âb`Ð¢F†—2æVæVÖ–W2ç6öÖR‚†R’ÓâRæ‡âbbRçv–ÆFÆ–fR¢’°Ð¢6öç7B6ÆV&VDWfVçBÒF†—2æWfVçBææÖS°Ð¢F†—2æWfVçEF–ÖRÒ°Ð¢F†—2ç'VäWfVçD7F–öç2‚&6ÆV&VB"“°Ð¢F†—2æÖW76vR†6ÆV&VDWfVçB²"6ÆV&VB+rF†R&V—26fRâ"“°Ð¢F†—2çW'6—7B‚“°Ð¢ÐÐ¢Ö–çF–å7–FW%vV'2‡F†—2ÂGB“°Ð¢f÷"†6öç7BBöbF†—2çG&2’BæÆ–fRÓÒGC°Ð¢F†—2çG&2ÒF†—2çG&2æf–ÇFW"‚‡B’ÓâBæÆ–fRâ“°Ð¢f÷"†6öç7BöbF†—2ç–6·W2’æÆ–fRÓÒGC°Ð¢F†—2ç–6·W2ÒF†—2ç–6·W2æf–ÇFW"‚‡’ÓâçW6VBbbæÆ–fRâ“°Ð¢f÷"†6öç7Bg‚öbF†—2æVffV7G2’g‚æÆ–fRÓÒGC°Ð¢F†—2æVffV7G2ÒF†—2æVffV7G2æf–ÇFW"‚†b’ÓâbæÆ–fRâ“°Ð¢–b‚F†—2çÆ–W'2ç6öÖR‚‡’Óâæ‡â’’°Ð¢F†—2ç†6RÒ&Æ÷7B#°Ð¢F†—2çW'6—7B‚“°Ð¢F†—2æöå6÷VæB‚&Æ÷6R"“°Ð¢ÐÐ¢ÐÐ§ÐÐ¤ö&¦V7Bæ76–vâ„vÖRç&÷F÷G—RÂGfVçGW&TÖWF†öG2Â†VÆ–ætGfVçGW&TÖWF†öG2†GfVçGW&TÖWF†öG2’“° Ð 