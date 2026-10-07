import {drawTempleRoom} from './temple.mjs';
import {drawWetDrips} from './wet-weather.mjs';
import {drawBansheeSteps} from './banshee-steps.mjs';
import {merchantPanel} from './traveling-merchant.mjs';
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
        stats.append(el('span', `${delta.label} ${sign}${delta.value}  (${delta.current} → ${delta.next})`, delta.value > 0 ? 'stat-up' : 'stat-down'));
      }
      if (!stats.children.length) stats.append(el('span', 'No equipment stat change', 'item-tooltip-muted'));
      tip.append(stats);
      if(button.dataset.mode==='pack'&&salvageYield(item.type,item).length){
        tip.append(el('p','Salvage one: '+salvageYield(item.type,item).map(v=>v.qty+' '+ITEMS[v.type].name).join(' + ')+'. Hold '+(p.device==='keyboard'?'V':controllerButtonNames(liveControllerFamily(p))[7])+' for 1.25 seconds.','item-tooltip-salvage'));
      }
      if (def.set && GEAR_SETS[def.set]) {
        const set = setProgress(p, def.set), checklist = el('section', null, 'item-tooltip-set');
        checklist.append(el('strong', `${set.name} · ${set.count}/${set.checks.length}`));
        for (const part of set.checks)
          checklist.append(el('div', (part.equipped ? '✓ ' : '○ ') + part.ids.map(id => ITEMS[id].name).join(' / '), part.equipped ? 'set-active' : 'set-missing'));
        if (set.threeText) checklist.append(el('p', '3 pieces · ' + set.threeText, set.count >= 3 ? 'set-active' : 'set-missing'));
        if(set.twoText)checklist.append(el('p','2 pieces · '+set.twoText,set.count>=2?'set-active':'set-missing'));
        checklist.append(el('p', 'Complete · ' + set.fullText, set.complete ? 'set-active' : 'set-missing'));
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
        !!(p.ui && p.ui.shop !== "vending"),
      );
      panel.classList.toggle("vending-panel", p.ui?.shop === "vending");
      panel.classList.toggle("merchant-session", p.ui?.shop === "merchant");
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
        panel.classList.contains('inventory-workbench')?`${p.name} · LV ${p.level}`:p.name +
          " · " +
          (p.ui?.shop === "merchant" ? "TRADING POST" : p.ui?.storage === "victory" ? "VICTORY SPOILS" : wellForPlayer(game,p)?(wellForPlayer(game,p).mausoleum?'MAUSOLEUM CRYPT':WELL_TITLE.toUpperCase()):p.room === "temple-upper" ? "UPPER SANCTUM" : p.room ? "THE BETWEEN" : "BACKPACK") +
          " · LV " +
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
              "s · EJECTION COSTS 50% MAX HP",
            "portal-warning",
          ),
        );
      if (p.room && !p.ui) {
        const canvas = el("canvas");
        canvas.className = "room-view";
        canvas.width = 320;
        canvas.height = 240;
        panel.append(canvas);
        this.room(canvas, game, p, d, renderer);
        if(d.oldWell){panel.append(el('p',d.mausoleum?'Explore the candlelit crypt. Interact with the lantern chest and the final coffin. Use the entrance stairs to return to the cemetery.':'Explore the tunnels. Interact at the treasure chest, or at the rope in the circle of daylight to climb out.','well-help'));}
        else if(d.temple){panel.append(el("p","Upper Sanctum · walk to the ritual chest and press Interact. The south doorway returns downstairs."),button("Open ritual chest","temple-chest",()=>game.openInventory(p,"temple")));}
        else {
        const owner = game.players.find((q) => q.id === d.owner);
        panel.append(
          el(
            "p",
            owner.name +
              "’s private storage · chests are north. Move to a chest and press Interact. P / D-pad up returns.",
          ),
        );
        for (let n = 0; n < 3; n++)
          panel.append(
            button(
              chestName(owner, n) +
                " · " +
                owner.chests[n].filter(Boolean).length +
                "/24",
              "chest" + n,
              () => game.openInventory(p, n),
            ),
          );
        if(robotOnline(owner))panel.append(button('SCRAP-9 · sell / buy back','robot',()=>game.openShop(p,'robot')));
        else{
          const repair=button('Hold to repair SCRAP-9','robot-repair',()=>{});
          repair.title='Stand beside the broken robot and hold Interact, or hold this button, for 2.4 seconds. No materials required.';
          repair.className='robot-repair-button';
          const progress=el('span','','robot-repair-progress');progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Robot repair');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow','0');repair.append(progress);
          repair.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();repair.setPointerCapture(e.pointerId);p.robotRepairPointer=true;};
          const stop=()=>{p.robotRepairPointer=false;};repair.onpointerup=stop;repair.onpointercancel=stop;repair.onlostpointercapture=stop;repair.onblur=stop;
          repair.onkeydown=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();p.robotRepairPointer=true;}};repair.onkeyup=stop;
          panel.append(repair,el('small','Robot offline · walk beside it and hold Interact to repair.','robot-repair-help'));
        }
        panel.append(button('Vending machine · potions','vending',()=>game.openShop(p,'vending')));
        }
      } else if(p.ui?.shop==='robot-intro'){
        const greeting=el('div','','robot-first-meeting');greeting.setAttribute('role','dialog');greeting.setAttribute('aria-label','Meet SCRAP-9');
        const portrait=el('canvas','','robot-portrait');portrait.width=96;portrait.height=80;drawRobotPortrait(portrait,game.time);
        greeting.append(portrait,el('h2','SCRAP-9'),el('p',p.ui.robotIntroBroken?'“Bzzzt… SCRAP-9, at your service. My circuits need a hand. Hold Interact beside me to repair them—no parts needed. Once fixed, I stay fixed for this character.”':'“SCRAP-9, at your service. Welcome to the storeroom!”'),el('p','“I buy your unwanted items for gold. Changed your mind? My Buy back shelf keeps sold items at the same price. Your chests keep gear safe between expeditions.”'));
        const next=button((p.device==='keyboard'?'Enter':controllerButtonNames(liveControllerFamily(p))[0])+' · Got it','robotContinue',()=>game.inventoryAction(p,'robotContinue'));next.classList.add('selected');greeting.append(next);panel.append(greeting);
      } else if(p.ui?.shop==='merchant'){
        merchantPanel(panel,game,p,button);
      } else if (p.ui?.shop) {
        shopPanel(panel, game, p, button,(node,item)=>this.itemTooltip(panel,node,game,p,item));
      } else if (p.ui && !p.ui.shop) {
        this.storagePanels(panel, game, p, button);
      }
      this.preview(panel, p, game.time);
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
      for (const p of open) this.place(this.panels.get(p.id), p, game, renderer, bounds, open);
      this.layoutKey = layoutKey;
    }
    for(const panel of this.panels.values()){
      const selected=panel.querySelector('.storage-sheet.active .selected,.robot-item-slot.selected');
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
    panel.querySelector('header').textContent=p.name+' · '+title;
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
        b.setAttribute('aria-label',(deposit?'Backpack':'Chest')+' slot '+(index+1)+': '+(def?.name||item?.type||'Empty')+(item?' ×'+item.qty:''));
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
        const previous=button('‹','storage-page-'+mode+'-prev',()=>switchTo(mode,Math.max(0,page-1)*24));previous.disabled=page===0;
        const next=button('›','storage-page-'+mode+'-next',()=>switchTo(mode,Math.min(pages-1,page+1)*24));next.disabled=page>=pages-1;
        nav.append(previous,el('span',(page+1)+' / '+pages),next);section.append(nav);
      }
      surface.append(section);
    }
    panel.append(surface);
    const deposit=u.panel==='pack',list=deposit?p.inventory:storage,item=list[u.index],allowed=canAccess(game,p,!deposit)&&!(deposit&&protectedItem(p,item?.type));
    const controls=this.controllerText(game,p),actions=el('nav',null,'storage-popup-actions');
    const primary=button(controls.accept+' · '+(deposit?'Deposit selected →':reusable?'← Withdraw selected':'Take selected'),'storage-transfer',()=>game.inventoryAction(p,'use'));
    primary.disabled=!item||!allowed;actions.append(primary);
    const all=button(deposit?'Deposit all':reusable?'Withdraw all':'Loot all','lootAll',()=>game.inventoryAction(p,'lootAll'));all.disabled=!list.some(Boolean)||!canAccess(game,p,!deposit);actions.append(all);
    const notice=el('p',u.notice||(!storage.some(Boolean)?reusable?'Chest empty. Select an item in your backpack to deposit.':'No loot remaining.':'Select an item to transfer.'),'loot-notice');
    panel.append(actions,notice);
    panel.append(el('small',reusable?`${controls.select}: select · ${controls.tabs}: switch container · ${controls.accept}: transfer · ${controls.close}: close`:`${controls.select}: select · ${controls.accept}: take · ${controls.close}: close`,'storage-help'));
    if(u.storage==='starter')panel.append(el('small','Your starter selection · restocked each new level · deposited items are kept.','storage-help'));
    if(u.storage==='victory'){const nav=el('nav',null,'victory-loot-actions');for(const [text,action]of [['Restart this level','restart'],['Return to lobby','lobby']])nav.append(button(text,'victory-'+action,()=>panel.dispatchEvent(new CustomEvent('victory-action',{bubbles:true,detail:action}))));panel.append(nav);}
    if(u.storage==='tv-victory'){
      const nav=el('nav',null,'victory-loot-actions'),back=button(controls.accept+' · Return to lobby','tvReturn',()=>game.inventoryAction(p,'tvReturn'));
      back.disabled=storage.some(Boolean);nav.append(back);panel.append(nav);
      panel.append(el('small',storage.some(Boolean)?'Shared party treasure · loot before leaving. Backpack full? Close this chest and open your inventory to make room.':'Treasure collected. Confirm to return to the lobby.','storage-help'));
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
            " · " +
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
        portrait.setAttribute('aria-label',p.name+' · live equipped character');
        previewFrame=el('div',null,'inventory-character');
        const scene=el('canvas',null,'inventory-scene');scene.setAttribute('aria-hidden','true');previewFrame.append(scene);
        const rotate=delta=>{u.previewDirection=((u.previewDirection||0)+delta+8)%8;};
        const previous=button('‹','preview-left',()=>rotate(-1));
        const next=button('›','preview-right',()=>rotate(1));
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
            (item?.qty > 1 ? " ×" + item.qty : ""),
          action,
          () => { select(mode, n); if (def?.bag) u.bag = {mode, index:n, selected:0}; },
        );
        b.classList.toggle("selected", active && n === index);
        b.classList.toggle('carried-source',!!u.carry&&u.carry.from.mode===mode&&(gear?u.carry.from.slot===item.slot:u.carry.from.index===n));
        b.classList.toggle('carry-target',!!u.carry&&active&&n===index);
        b.dataset.index = n;
        b.dataset.mode = mode;
        if (def?.bag) b.ondblclick = () => { select(mode, n); u.bag = {mode, index:n}; };
        b.setAttribute('aria-label',(gear?item.slot+': ':'')+(def?.name||'Empty slot')+(item?.qty>1?' ×'+item.qty:''));
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
            " · " +
            itemStats(displayItem.type) +
            " · " +
            compareItem(p, displayItem.type) +
            (def.relic && mode === "chest"
              ? " · Stored relics give no bonuses"
              : "") +
            (gear
              ? " · Drag to backpack to unequip"
              : " · Drag onto an equipment slot")
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
          for(let arrow=0;arrow<loaded;arrow++)ammo.append(el('i','➶'));
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
                " · " +
                itemStats(item.type) +
                " · " +
                compareItem(p, item.type) +
                (def.relic && mode === "chest"
                  ? " · Stored relics give no bonuses"
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
    panel.append(el('small',u.carry?`Moving ${u.carry.name} · ${p.device==='keyboard'?'M / Enter':'LS / A'}: place · ${controls.close}: cancel`:`${controls.select}: select · ${controls.tabs}: equipment / bag · ${controls.close}: close`,'inventory-help'));
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
      b.disabled=!!option.reason;b.setAttribute('aria-label',option.label+' · '+option.key+(option.reason?' · '+option.reason:''));b.title=option.reason||option.label+' · '+option.key;
      const badge=option.key.replace(/Triangle/g,'△').replace(/Square/g,'□').replace(/Circle/g,'○').replace(/Cross/g,'×').replace(/Shift\+Del/g,'⇧Del');
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
  }

  inventoryPopovers(panel, game, p, button) {
    const u = p.ui;
    const anchorPopup = (popup, mode, index) => {
      panel.querySelector('.item-tooltip')?.remove();
      panel.append(popup);
      popup.setAttribute('role', 'dialog');
      const anchor = panel.querySelector(`[data-mode="${mode}"][data-index="${index}"]`);
      const r = anchor?.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      popup.style.left = Math.max(6, Math.min(panel.clientWidth - popup.offsetWidth - 6, (r?.left || pr.left) - pr.left)) + 'px';
      popup.style.top = Math.max(6, Math.min(panel.clientHeight - popup.offsetHeight - 6, (r?.top || pr.top) - pr.top - popup.offsetHeight - 6)) + 'px';
      popup.onkeydown = e => { e.stopPropagation(); if (e.key === 'Escape') { delete u.split; delete u.bag; panel.uiSignature = null; } };
    };
    if (u.split) {
      const s = u.split, list = s.panel === 'chest' ? game.storageFor(p) : p.inventory;
      const item = list?.[s.index];
      if (!item || item.qty < 2) { delete u.split; return; }
      const popup = el('form', null, 'inventory-popover split-popover');
      popup.setAttribute('aria-label', 'Split stack');
      const splitName=el('strong','Split '+ITEMS[item.type].name);
      splitName.style.color=RARITIES[ITEMS[item.type].rarity]||RARITIES.common;
      popup.append(splitName);
      const row = el('div', null, 'split-stepper'), amount = el('input');
      amount.type = 'number'; amount.min = 1; amount.max = item.qty - 1; amount.value = s.amount;
      amount.setAttribute('aria-label', 'Amount to split');
      amount.oninput = () => { s.amount = Math.max(1, Math.min(item.qty - 1, Number(amount.value) || 1)); };
      const step = (label, delta) => { const b = button(label, 'split-step-' + delta, () => { amount.value = Math.max(1, Math.min(item.qty - 1, Number(amount.value) + delta)); amount.oninput(); }); b.type = 'button'; return b; };
      row.append(step('\u2212', -1), amount, step('+', 1)); popup.append(row);
      const confirm = el('button', 'Split'); confirm.type = 'submit';
      const cancel = button('Cancel', 'split-cancel', () => { delete u.split; panel.uiSignature = null; }); cancel.type = 'button';
      popup.append(confirm, cancel);
      popup.onsubmit = e => { e.preventDefault(); u.panel = s.panel; u.index = s.index; game.inventoryAction(p, 'split:' + s.amount); };
      anchorPopup(popup, s.panel, s.index);
    }
    if (u.bag) {
      const s = u.bag, list = s.mode === 'chest' ? game.storageFor(p) : p.inventory, bag = list?.[s.index], rule = ITEMS[bag?.type]?.bag;
      if (!rule) { delete u.bag; return; }
      const popup = el('section', null, 'inventory-popover bag-popover');
      popup.setAttribute('aria-label', ITEMS[bag.type].name);
      const bagName=el('strong',ITEMS[bag.type].name);
      bagName.style.color=RARITIES[ITEMS[bag.type].rarity]||RARITIES.common;
      popup.append(bagName, button('\u00d7', 'bag-close', () => { delete u.bag; panel.uiSignature = null; }));
      const grid = el('div', null, 'bag-grid');
      const changed = ok => { u.notice = ok ? 'Item moved.' : 'No room, or this bag cannot hold that item.'; game.persist(); panel.uiSignature = null; };
      const canStore = item => !protectedItem(p, item?.type) && (s.mode !== 'chest' || canAccess(game, p, false));
      for (let n = 0; n < rule.slots; n++) {
        const item = bag.contents?.[n], b = button(item ? String(item.qty) : '+', 'bag-slot-' + n, () => { if (item) changed((s.mode !== 'chest' || canAccess(game,p,true)) && takeFromBag(bag, n, p.inventory)); });
        b.classList.toggle('selected', n === (s.selected || 0));
        b.setAttribute('aria-label', item ? 'Take ' + ITEMS[item.type].name : 'Empty bag slot');
        if (item) { const icon = el('canvas'); icon.width = icon.height = 24; drawItem(icon.getContext('2d'), item.type, 12, 12, 24); b.prepend(icon); this.itemTooltip(panel, b, game, p, item); }
        grid.append(b);
      }
      grid.ondragover = e => { if (this.dragItem?.player === p) e.preventDefault(); };
      grid.ondrop = e => { e.preventDefault(); const source = this.dragItem; this.dragItem = null; if (source?.player !== p || source.from.mode === 'gear') return; const from = source.from.mode === 'pack' ? p.inventory : game.storageFor(p); if (from?.[source.from.index] !== source.ref) return; changed(canStore(source.ref) && (source.from.mode !== 'chest' || canAccess(game,p,true)) && storeInBag(from, bag, source.from.index)); };
      popup.append(grid, el('small', `${(bag.contents || []).filter(Boolean).length} / ${rule.slots}`));
      const eligible = p.inventory.map((item, index) => ({item, index})).filter(({item}) => bagAccepts(bag, item));
      if (eligible.length) {
        const choices = el('select'); choices.setAttribute('aria-label', 'Item to store');
        for (const {item, index} of eligible) { const o = el('option', ITEMS[item.type].name + ' x' + item.qty); o.value = index; choices.append(o); }
        popup.append(choices, button('Store', 'bag-store', () => changed(canStore(p.inventory[Number(choices.value)]) && storeInBag(p.inventory, bag, Number(choices.value)))));
      }
      anchorPopup(popup, s.mode, s.index);
    }
  }

  preview(panel, p, time) {
    const canvas = panel.querySelector(".equipment-preview");
    if (!canvas) return;
    // Preview keeps breathing even while the lobby/game simulation is paused.
    time=performance.now()/1000;
    // Crop a single atlas tile to the live frame. Scaling the whole atlas to
    // 300% × 200% distorted rooms whenever the inventory aspect ratio changed.
    const scene=panel.querySelector('.inventory-scene');
    if(scene){
      this.inventorySceneArt??=new Image();
      if(!this.inventorySceneArt.src)this.inventorySceneArt.src=new URL('../assets/inventory-environments-blocky.png',import.meta.url).href;
      this.inventoryBeachArt??=new Image();
      if(!this.inventoryBeachArt.src)this.inventoryBeachArt.src=new URL('../assets/beach-background-v1.png',import.meta.url).href;
      const frame=scene.parentElement,width=Math.max(1,Math.ceil(frame.clientWidth)),height=Math.max(1,Math.ceil(frame.clientHeight));
      if(scene.width!==width||scene.height!==height){scene.width=width;scene.height=height;}
      const ctx=scene.getContext('2d'),env=panel.dataset.environment,beach=env==='beach',art=beach?this.inventoryBeachArt:this.inventorySceneArt;
      ctx.imageSmoothingEnabled=false;ctx.fillStyle='#20382c';ctx.fillRect(0,0,width,height);
      if(art.complete&&art.naturalWidth){
        const tile=({lobby:0,forest:1,desert:2,ice:3,temple:4,house:5})[env]??0,sw=art.naturalWidth/(beach?1:3),sh=art.naturalHeight/(beach?1:2),scale=Math.max(width/sw,height/sh),cw=width/scale,ch=height/scale;
        ctx.drawImage(art,(beach?0:tile%3*sw)+(sw-cw)/2,(beach?0:Math.floor(tile/3)*sh)+(sh-ch)/2,cw,ch,0,0,width,height);
      }
    }
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.translate(canvas.width / 2, canvas.height-14);
    c.scale(4.1, 4.1);
    drawPlayer(
      c,
      {
        ...p,
        faceX: Math.sin((p.ui?.previewDirection||0)*Math.PI/4),
        faceY: Math.cos((p.ui?.previewDirection||0)*Math.PI/4),
        animationAction: 'idle',
        attack:0,spin:0,charge:0,bowAiming:false,bowAimBlend:0,gatherTime:0,
        moving: false,
        playerFrame: undefined,
      },
      time,
    );
    c.restore();
  }
  place(panel, p, game, r, bounds = this.root.getBoundingClientRect(), open = game.players.filter((q) => q.ui || q.room)) {
    if(p.ui?.shop==='robot-intro'){const index=Math.max(0,open.indexOf(p)),cols=Math.min(3,open.length),rows=Math.ceil(open.length/cols),width=Math.min(440,bounds.width/cols-16),height=Math.min(510,bounds.height/rows-16);panel.style.width=width+'px';panel.style.height=height+'px';panel.style.maxHeight=height+'px';panel.style.left=8+(index%cols)*bounds.width/cols+'px';panel.style.top=8+Math.floor(index/cols)*bounds.height/rows+'px';return;}
    if(p.ui?.shop==='vending'){const index=Math.max(0,open.indexOf(p)),cols=Math.min(3,open.length),rows=Math.ceil(open.length/cols),width=Math.min(680,bounds.width/cols-16),height=Math.min(780,bounds.height/rows-16);panel.style.width=width+'px';panel.style.height=height+'px';panel.style.maxHeight=height+'px';panel.style.left=8+(index%cols)*bounds.width/cols+'px';panel.style.top=8+Math.floor(index/cols)*bounds.height/rows+'px';return;}
    if(p.ui?.loot){const victory=['victory','tv-victory'].includes(p.ui.storage),index=Math.max(0,open.indexOf(p)),cols=Math.min(3,open.length),rows=Math.ceil(open.length/cols),width=Math.min(victory?440:620,bounds.width/cols-16),height=Math.min(victory?520:740,bounds.height/rows-16);panel.classList.toggle('loot-compact',height<=460);panel.classList.toggle('loot-tight',height<=360);if(p.ui.storage==='starter')p.ui.storageColumns=height<=360?6:4;panel.style.width=width+'px';panel.style.height=height+'px';panel.style.maxHeight=height+'px';panel.style.left=8+(index%cols)*(bounds.width/cols)+'px';panel.style.top=8+Math.floor(index/cols)*(bounds.height/rows)+'px';return;}
    if(panel.classList.contains('storage-session')&&(!p.ui?.shop||['merchant','robot'].includes(p.ui.shop))){
      const playerIndex=Math.max(0,game.players.findIndex(q=>q.id===p.id)),multiple=open.length>1,slot=multiple?playerIndex%4:0,cols=multiple?2:1,rows=multiple?2:1;
      const width=Math.min(panel.classList.contains('inventory-workbench')||p.ui?.shop==='robot'?480:560,(bounds.width-16)/cols-8),height=Math.min(800,(bounds.height-16)/rows);
      panel.classList.toggle('inventory-compact',height<=580);
      panel.classList.toggle('inventory-tight',height<=460);
      panel.classList.toggle('inventory-narrow',width<=380);
      const left=slot%2===0?8:bounds.width-width-8,top=slot<2?8:bounds.height-height-8;
      panel.classList.toggle('party-panel',open.length>1);panel.style.width=width+'px';panel.style.height=height+'px';panel.style.maxHeight=height+'px';panel.style.left=left+'px';panel.style.top=top+'px';return;
    }
    panel.style.height='';
    const compactRobot = p.ui?.shop === "robot" && bounds.height < 760,
      w = Math.min(
        panel.classList.contains("storage-session")
          ? game.storageFor(p)
            ? 1160
            : 820
          : p.room && !p.ui
            ? Math.min(
                800,
                Math.max(410, ((bounds.height - 260) * 320) / 240 + 28),
              )
            : 410,
        bounds.width - 20,
      ),
      h = Math.min(panel.scrollHeight, Math.max(240, bounds.height - 40));
    panel.classList.toggle("compact-robot-shop", compactRobot);
    panel.style.width = w + "px";
    panel.style.maxHeight = bounds.height - 30 + "px";
    if (p.ui?.shop === "vending") {
      const machine = panel.querySelector(".vending-machine");
      if (machine) {
        const chrome =
          panel.scrollHeight - machine.getBoundingClientRect().height;
        machine.style.width =
          Math.min(
            360,
            w - 32,
            (Math.max(100, bounds.height - 55 - chrome) * 360) / 520,
          ) + "px";
      }
    }
    const anchors = ["top-left", "top-right", "bottom-left", "bottom-right"];
    const positions = {
      "top-left": [12, 12],
      "top-right": [bounds.width - w - 12, 12],
      "bottom-left": [12, bounds.height - h - 12],
      "bottom-right": [bounds.width - w - 12, bounds.height - h - 12],
      center: [(bounds.width - w) / 2, (bounds.height - h) / 2],
    };
    if (!panel.dataset.anchor) {
      let anchor = this.panelAnchors.get(p.id);
      if (!anchor) {
        const index = Math.max(
          0,
          game.players.findIndex((q) => q.id === p.id),
        );
        anchor = anchors[index % anchors.length];
        this.panelAnchors.set(p.id, anchor);
      }
      panel.dataset.anchor = anchor;
    }
    panel.classList.remove("party-panel");
    const [x, y] = positions[panel.dataset.anchor] || positions["top-left"];
    panel.style.left = Math.max(0, Math.min(bounds.width - w, x)) + "px";
    panel.style.top = Math.max(0, Math.min(bounds.height - h, y)) + "px";
  }
  room(canvas, g, p, d, renderer) {
    const c = canvas.getContext("2d");
    // Lobby storage can open before the main expedition renderer exists.
    const animator=renderer?.animator||(this.roomAnimator||=new Animator());
    if(d?.oldWell){drawOldWellRoom(c,g,p,animator);return;}
    if(d?.temple){drawTempleRoom(c,g,p,animator);drawRoomSpellEffects(c,g,p.room);drawWetDrips(c,g,p.room);return;}
    c.imageSmoothingEnabled = false;
    drawStorageBackdrop(c);
    const roomTime=g.phase==='lobby'?performance.now()/1000:g.time,owner=g.players.find(q=>q.id===d.owner),online=robotOnline(owner);
    drawBansheeSteps(c,g,{room:p.room,time:roomTime,spacing:10});
    // Fixed room coordinates show every chest, shop and exit at once.
    canvas.dataset.roomFit = "true";
    c.save();
    drawStorageLight(c,roomTime,d.owner||0);
    c.fillStyle = "#b487db";
    drawPortal(
      c,
      {
        x: 160,
        y: 214,
        closing: d.closing,
        color: g.players.find((p) => p.id === d.owner)?.color || d.color,
      },
      roomTime,
      "RETURN",
    );
    [60, 160, 260].forEach((x, i) => {
      const active=g.players.some(q=>q.room===d.id&&q.ui?.storage===i),near=Math.hypot(x-p.roomX,80-p.roomY)<50;
      drawStorageChest(c,x,94,i,active,near);c.fillStyle=near?'#edcd83':'#d4bd80';
      c.font = "8px monospace";
      c.textAlign = "center";
      c.fillText(
        chestName(
          g.players.find((q) => q.id === d.owner),
          i,
        ).toUpperCase(),
        x,
        52,
        86,
      );
    });
    // SCRAP-9 uses the same humanoid pose evaluator, joint anchors and renderer.
    const robot = ROOM_STATIONS.robot;
    drawStorageRobot(c,robot,p,roomTime,online);
    const nearRobot = nearStorageRobot(p);
    c.fillStyle = nearRobot ? "#f0d383" : "#bed7d6";
    c.fillRect(robot.x - 10, robot.y - 76, 20, 12);
    c.fillRect(robot.x - 3, robot.y - 64, 4, 3);
    c.fillStyle = "#20343c";
    c.font = "bold 7px monospace";
    c.textAlign = "center";
    c.fillText(
      nearRobot ? online?g.controlLabels?.interact || "E / Y":"HOLD" : online?"···":"FIX",
      robot.x,
      robot.y - 67,
    );
    if(!online){c.fillStyle='#d5bd7a';c.font='6px monospace';c.fillText('OFFLINE · REPAIR',robot.x,robot.y+11);}
    if(p.robotRepair?.progress>0){c.fillStyle='#263d35';c.fillRect(robot.x-23,robot.y-54,46,5);c.fillStyle='#d9c081';c.fillRect(robot.x-22,robot.y-53,Math.max(1,Math.round(44*p.robotRepair.progress/ROBOT_REPAIR_SECONDS)),3);}
    c.save();
    c.translate(0, 23);
    c.fillStyle = "#7a527f";
    c.fillRect(244, 105, 23, 36);
    c.fillStyle = "#263442";
    c.fillRect(247, 109, 13, 19);
    c.fillStyle = "#ef698b";
    c.fillRect(251, 114, 5, 9);
    c.fillStyle = "#ffdb78";
    c.fillRect(262, 114, 2, 3);
    c.fillRect(248, 132, 13, 3);
    c.font = "7px monospace";
    c.textAlign = "center";
    c.fillStyle = "#ebd9b3";
    c.fillText("SCRAP-9", robot.x, robot.y - 13);
    const nearMachine = Math.hypot(p.roomX - 255, p.roomY - 158) < 35;
    c.fillStyle = nearMachine ? "#f0d383" : "#bed7d6";
    c.fillRect(239, 82, 32, 12);
    c.fillRect(253, 94, 4, 3);
    c.fillStyle = "#20343c";
    c.font = "bold 6px monospace";
    c.fillText(
      nearMachine ? g.controlLabels?.interact || "E / Y" : "SHOP",
      255,
      90,
    );
    c.restore();
    for (const q of g.players
      .filter((q) => q.room === d.id)
      .sort((a, b) => a.roomY - b.roomY)) {
      c.fillStyle = "#091c1680";
      c.beginPath();
      c.ellipse(q.roomX, q.roomY + 1, 43 * 0.31, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = q.color;
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(q.roomX, q.roomY + 1, 18, 8, 0, 0, Math.PI * 2);
      c.stroke();
      animator.draw(
        c,
        {
          ...q,
          ...storageVisualActor(q),
        },
        roomTime,
        43,
      );
      c.fillStyle = q.color;
      c.textAlign = "center";
      c.font = "8px monospace";
      c.fillText(q.name, q.roomX, q.roomY + 12);
    }
    drawStorageDust(c,roomTime,d.owner||0);
    drawRoomSpellEffects(c,g,p.room);
    drawWetDrips(c,g,p.room);
    c.restore();
  }
}
