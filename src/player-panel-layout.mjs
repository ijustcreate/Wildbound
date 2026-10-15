// Keep a player's dock independent of which other menus happen to be open.
// Extra local players share the two edge rails; the middle stays playable.
const SIDE_ORDER = ['left', 'right', 'right', 'left'];
const GAP = 8;

export function panelWidth(player) {
  if (player.room && !player.ui) return 800;
  if (player.ui?.socket) return 820;
  if (player.ui?.shop === 'npc-dialogue') return 520;
  if (player.ui?.shop === 'vending') return 560;
  if (player.ui?.shop === 'robot-intro') return 440;
  if (player.ui?.loot) return ['victory', 'tv-victory'].includes(player.ui.storage) ? 440 : 620;
  if (player.ui?.shop === 'robot' || !player.ui?.shop) return 480;
  if (player.ui?.shop === 'merchant') return 560;
  return player.room ? 800 : 480;
}

export function planPlayerPanels(players, open, width, height, sizing = {}) {
  const result = new Map();
  // Trading needs reading space. Two shops share the whole window instead of
  // reserving the wide gameplay corridor used by ordinary inventory docks.
  if(open.filter(p=>p.ui?.shop==='merchant').length>=2){
    const ordered=[...open].sort((a,b)=>players.indexOf(a)-players.indexOf(b));
    const columns=ordered.length>4&&width>=1100?3:2,rows=Math.ceil(ordered.length/columns);
    const w=Math.max(1,(width-GAP*(columns+1))/columns),h=Math.max(1,(height-GAP*(rows+1))/rows);
    ordered.forEach((p,i)=>result.set(p.id,{x:GAP+(i%columns)*(w+GAP),y:GAP+Math.floor(i/columns)*(h+GAP),width:w,height:h,side:i%columns===0?'left':'right'}));
    return result;
  }
  const sides = {left: [], right: []};
  for (const player of open) {
    const index = Math.max(0, players.findIndex(p => p.id === player.id));
    sides[SIDE_ORDER[index % SIDE_ORDER.length]].push({player, index});
  }
  const hasBoth = sides.left.length > 0 && sides.right.length > 0;
  // A central strip remains clear even when both sides have large chest menus.
  const clearWidth = Math.max(240, width * .25);
  const railWidth = Math.max(1, hasBoth ? Math.min((width - clearWidth - GAP * 2) / 2, (width - GAP * 3) / 2) : width - GAP * 2);
  for (const side of ['left', 'right']) {
    const occupants = sides[side].sort((a, b) => a.index - b.index);
    const cellHeight = (height - GAP * (occupants.length + 1)) / Math.max(1, occupants.length);
    for (let row = 0; row < occupants.length; row++) {
      const {player} = occupants[row];
      const w = Math.max(1, Math.min(sizing.width?.(player) ?? panelWidth(player), railWidth));
      const h = Math.max(1, Math.min(sizing.height?.(player) ?? (player.ui?.shop === 'npc-dialogue' ? 600 : player.ui?.shop === 'robot-intro' ? 510 : player.ui?.loot && ['victory', 'tv-victory'].includes(player.ui.storage) ? 520 : 800), cellHeight));
      const bottomDock = [2, 3].includes(occupants[row].index % SIDE_ORDER.length);
      const y = bottomDock && row === occupants.length - 1
        ? height - GAP - h
        : GAP + row * (cellHeight + GAP);
      result.set(player.id, {x: side === 'left' ? GAP : width - w - GAP, y, width: w, height: h, side});
    }
  }
  return result;
}

export function openPlayArea(layout, width, height) {
  let left = 0, right = width;
  for (const box of layout.values()) {
    if (box.side === 'left') left = Math.max(left, box.x + box.width);
    else right = Math.min(right, box.x);
  }
  if (right - left < 120) return {x: width / 2, y: height / 2, width};
  return {x: (left + right) / 2, y: height / 2, width: right - left};
}
