import {LiveEditState,liveEditScene} from './live-edit-state.mjs';
import {placementTargets,getPlacement,applyPlacement,placementOverride,restorePlacementOverrides} from './live-edit-placement.mjs';
import {terrainBrushes,terrainCellAt,applyTerrainCell} from './live-edit-terrain.mjs';
import {spawnTargets,getSpawn,applySpawn} from './live-edit-spawns.mjs';
import {headwearTargets,headwearFor,applyHeadwear,setHeadwearPicking,setHeadwearPreview,DEFAULT_HEADWEAR_FIT} from './live-edit-headwear.mjs';

const categories = [['props','Props'],['buildings','Buildings'],['trees','Trees'],['ground','Ground'],['spawns','Spawns'],['characters','Characters']];
const applyEdit = {placement:applyPlacement,terrain:applyTerrainCell,spawn:applySpawn,headwear:applyHeadwear};
const headwearScene = 'characters';
const compass = {N:'North',NE:'Northeast',E:'East',SE:'Southeast',S:'South',SW:'Southwest',W:'West',NW:'Northwest'};
const headwearFields = [['x','Offset X',-30,30,.5],['y','Offset Y',-30,30,.5],['scale','Scale',.25,3,.05],['rotation','Angle',-180,180,1]];
const isDefaultFit = fit => Object.entries(DEFAULT_HEADWEAR_FIT).every(([key,value]) => fit[key] === value);
const guides = {
  props:'Select a prop, then drag it or enter coordinates.',
  buildings:'Select a highlighted building to move its linked layout.',
  trees:'Select a trunk or its canopy, then drag to move it.',
  ground:'Choose a surface, then drag across the ground to paint.',
  spawns:'Select a spawn marker or area to adjust future spawns.',
  characters:'Select an explorer to adjust equipped headwear.',
};
const element = (tag, label, attributes = {}) => {
  const node = document.createElement(tag);
  if (label) node.textContent = label;
  for (const [name,value] of Object.entries(attributes)) node.setAttribute(name,value);
  return node;
};
const number = (value, places = 1) => Number.isFinite(value) ? Number(value.toFixed(places)) : '';
const pointFromEvent = event => ({x:event.clientX,y:event.clientY});
const endOfBounds = bounds => ({x:bounds.x+(bounds.w ?? bounds.width),y:bounds.y+(bounds.h ?? bounds.height)});
const originalGround = 'original';

export class LiveEditor {
  constructor({root, canvas, getContext, toggleProfiler, clearMouse}) {
    this.getContext = getContext;
    this.toggleProfiler = toggleProfiler;
    this.canvas = canvas;
    this.clearMouse = clearMouse;
    this.state = new LiveEditState();
    this.category = 'props';
    this.active = false;
    this.build(root);
    this.load = this.state.load().catch(error => { this.loadError = error; }).finally(() => { this.loaded = true; });
  }

  build(root) {
    this.toggle = element('button','Edit',{'type':'button','class':'live-edit-toggle','aria-expanded':'false','aria-controls':'live-edit-inspector','hidden':''});
    this.toggle.onclick = () => this.setActive(!this.active);
    this.overlay = element('canvas','',{'class':'live-edit-overlay','aria-hidden':'true'});
    this.overlay.hidden = true;
    this.panel = element('section','',{'id':'live-edit-inspector','aria-label':'Live editor'});
    this.panel.hidden = true;
    const header = element('header','',{'class':'live-edit-header'});
    this.sceneName = element('small');
    const heading = element('div');
    heading.append(element('h2','Live editor'),this.sceneName);
    const close = this.button('×',() => this.setActive(false),'Close live editor');
    header.append(heading,close);
    const tabs = element('div','',{'class':'live-edit-categories','aria-label':'What to edit'});
    this.tabs = new Map(categories.map(([id,label]) => {
      const tab = this.button(label,() => this.choose(id));
      tab.dataset.category = id;
      tabs.append(tab);
      return [id,tab];
    }));
    this.inspector = element('div','',{'class':'live-edit-fields'});
    this.status = element('p','',{'class':'live-edit-status','role':'status'});
    const footer = element('footer');
    this.undo = this.button('Undo',() => this.history(true));
    this.redo = this.button('Redo',() => this.history(false));
    this.save = this.button('Save',() => this.saveEdits());
    footer.append(this.undo,this.redo,this.save);
    const options = element('div','',{'class':'live-edit-options'});
    const hold = element('label');
    this.hold = element('input','',{type:'checkbox'});
    hold.append(this.hold,document.createTextNode(' Hold simulation'));
    this.profile = this.button('Performance',() => {
      this.profile.setAttribute('aria-pressed',String(!!this.toggleProfiler()));
    });
    this.profile.setAttribute('aria-pressed','false');
    options.append(hold,this.profile);
    this.panel.append(header,tabs,this.inspector,this.status,footer,options);
    root.append(this.toggle,this.overlay,this.panel);
    header.addEventListener('pointerdown',event => this.panelDrag(event,header));
    window.addEventListener('pointermove',event => this.pointerMove(event));
    window.addEventListener('pointerup',event => this.pointerEnd(event));
    window.addEventListener('pointercancel',event => this.pointerEnd(event,true));
    window.addEventListener('resize',() => this.fitPanel());
  }

  button(label,onClick,ariaLabel) {
    const button = element('button',label,{type:'button'});
    if (ariaLabel) button.setAttribute('aria-label',ariaLabel);
    button.onclick = onClick;
    return button;
  }

  setActive(active) {
    const {available} = this.getContext();
    if (active && (!available || !this.loaded)) return;
    if (!active) {
      this.finishGesture();
      this.clearHatPreview();
    }
    this.active = !!active;
    this.panel.hidden = this.overlay.hidden = !this.active;
    this.toggle.textContent = this.active ? 'Done editing' : 'Edit';
    this.toggle.setAttribute('aria-expanded',String(this.active));
    this.canvas.classList.toggle('live-edit-active',this.active);
    setHeadwearPicking(this.game,this.active && this.category === 'characters');
    this.clearMouse?.();
    if (this.active) {
      this.fitPanel();
      this.refresh();
    }
  }

  get holding() { return this.active && this.hold.checked; }

  choose(category) {
    this.finishGesture();
    this.clearHatPreview();
    this.category = category;
    this.selected = null;
    this.hatOpen = false;
    this.message = '';
    setHeadwearPicking(this.game,this.active && category === 'characters');
    this.refresh();
  }

  tick() {
    const {game,renderer,available,label} = this.getContext();
    if (this.toggle.hidden === available) this.toggle.hidden = !available;
    if (this.toggle.disabled === !!this.loaded) this.toggle.disabled = !this.loaded;
    if (!available) { if (this.active) this.setActive(false); return; }
    if (!this.loaded || !game || !renderer) return;
    if (this.loadError) this.message = `Could not load edits. ${this.loadError.message}`;
    const scene = liveEditScene(game), design = game.trainTest?.design || null;
    if (scene !== this.scene || game !== this.game || design !== this.design) {
      this.finishGesture();
      this.clearHatPreview();
      if (game !== this.game) {
        setHeadwearPicking(this.game,false);
        for (const [key,value] of Object.entries(this.state.records(headwearScene,'headwear') || {})) applyHeadwear(game,key,value);
      }
      this.game = game;
      this.design = design;
      this.scene = scene;
      this.selected = null;
      this.hatOpen = false;
      this.cursor = null;
      this.sceneName.textContent = label || 'Current scene';
      const placement = this.state.records(scene,'placement');
      if (placement) restorePlacementOverrides(game,placement);
      for (const kind of ['terrain','spawn']) {
        for (const [id,value] of Object.entries(this.state.records(scene,kind) || {})) applyEdit[kind](game,id,value);
      }
      setHeadwearPicking(game,this.active && this.category === 'characters');
      if (this.active) this.refresh();
    }
    if (!this.active) return;
    if (this.pending && this.gesture) {
      const position = this.pending;
      this.pending = null;
      this.applyGesture(position);
    }
  }

  clearHatPreview() {
    if (this.hatDirection && this.selected) setHeadwearPreview(this.game,this.selected.id,null);
    this.hatDirection = null;
    this.hatKey = null;
  }

  inspectHatFacing(target,direction) {
    setHeadwearPreview(this.game,target.id,direction);
    this.hatDirection = direction;
    this.message = '';
    this.refresh();
    const control = direction ? this.inspector.querySelector(`[data-facing="${direction}"]`) : this.inspector.querySelector('.live-edit-follow');
    control?.focus({preventScroll:true});
  }

  keyboard(event) {
    if (!this.active) return false;
    if (event.key === 'Escape') {
      this.setActive(false);
      this.toggle.focus();
      return true;
    }
    if (event.target instanceof Element && event.target.matches('input,select,textarea,[contenteditable]') && this.panel.contains(event.target)) return false;
    if ((event.ctrlKey || event.metaKey) && (event.code === 'KeyZ' || event.code === 'KeyY')) {
      if (!event.repeat) this.history(event.code === 'KeyZ' && !event.shiftKey);
      return true;
    }
    return false;
  }

  panelDrag(event, header) {
    if (event.button !== 0 || event.target.closest('button')) return;
    event.preventDefault();
    header.setPointerCapture(event.pointerId);
    const rect = this.panel.getBoundingClientRect();
    this.panelMove = {pointer:event.pointerId,x:event.clientX-rect.left,y:event.clientY-rect.top};
  }

  fitPanel(x,y) {
    if (this.panel.hidden || (!this.panel.style.left && x == null)) return;
    const rect = this.panel.getBoundingClientRect();
    this.panel.style.left = `${Math.max(8,Math.min(innerWidth-rect.width-8,x ?? rect.left))}px`;
    this.panel.style.top = `${Math.max(8,Math.min(innerHeight-rect.height-8,y ?? rect.top))}px`;
    this.panel.style.right = 'auto';
  }

  pointerDown(event) {
    if (!this.active) return false;
    if (event.button !== 0 || !this.game) return true;
    const renderer = this.getContext().renderer;
    const position = pointFromEvent(event), point = renderer.screenToWorld(position.x,position.y);
    this.cursor = position;
    this.message = '';
    this.canvas.setPointerCapture(event.pointerId);
    this.gesture = {pointer:event.pointerId,scene:this.scene,position,point,last:point,changes:new Map()};
    if (this.category === 'ground') {
      this.applyGesture(position);
    } else {
      const candidates = this.targets(point);
      const target = candidates[0] || null;
      if (target?.id !== this.selected?.id) {
        this.clearHatPreview();
        this.hatOpen = false;
      }
      else if (target && this.category === 'characters') {
        const bounds = headwearFor(this.game,target.id)?.bounds;
        if (bounds) {
          const end = endOfBounds(bounds);
          if (point.x >= bounds.x && point.x <= end.x && point.y >= bounds.y && point.y <= end.y) this.hatOpen = true;
        }
      }
      this.selected = target;
      this.gesture.target = this.selected;
    }
    this.refresh();
    return true;
  }

  pointerMove(event) {
    if (this.panelMove?.pointer === event.pointerId) {
      this.fitPanel(event.clientX-this.panelMove.x,event.clientY-this.panelMove.y);
      return;
    }
    if (!this.active || (event.target !== this.canvas && this.gesture?.pointer !== event.pointerId)) return;
    this.cursor = pointFromEvent(event);
    if (this.gesture?.pointer === event.pointerId) this.pending = this.cursor;
  }

  pointerEnd(event,cancel = false) {
    if (this.panelMove?.pointer === event.pointerId) this.panelMove = null;
    if (this.gesture?.pointer !== event.pointerId) return;
    if (!cancel && this.pending) this.applyGesture(this.pending);
    this.finishGesture(cancel);
  }

  targets(point) {
    if (this.category === 'characters') return headwearTargets(this.game,point);
    if (this.category === 'spawns') return spawnTargets(this.game,point);
    if (this.category === 'ground') return [];
    return placementTargets(this.game,point,this.category);
  }

  currentTarget() {
    if (!this.selected) return null;
    if (this.category === 'characters') return headwearTargets(this.game).find(target => target.id === this.selected.id) || null;
    return this.category === 'spawns' ? getSpawn(this.game,this.selected.id) : getPlacement(this.game,this.selected.id);
  }

  applyGesture(position) {
    const gesture = this.gesture;
    if (!gesture || gesture.scene !== this.scene) return;
    const renderer = this.getContext().renderer, point = renderer.screenToWorld(position.x,position.y);
    if (this.category === 'ground') {
      const last = gesture.last;
      const steps = Math.min(192,Math.max(1,Math.ceil(Math.hypot(point.x-last.x,point.y-last.y)/12)));
      for (let i=1;i<=steps;i++) {
        const cell = terrainCellAt(this.game,{x:last.x+(point.x-last.x)*i/steps,y:last.y+(point.y-last.y)*i/steps});
        if (cell && this.brush && !gesture.changes.has(cell.id)) {
          this.preview('terrain',cell.id,cell.brush ?? null,this.brush === originalGround ? null : this.brush);
        }
      }
      gesture.last = point;
    } else if (gesture.target && this.category !== 'characters' && Math.hypot(position.x-gesture.position.x,position.y-gesture.position.y) > 3) {
      const {id,x,y,radius} = gesture.target;
      const before = radius == null ? {x,y} : {x,y,radius};
      const delta = {x:Math.round(x+point.x-gesture.point.x),y:Math.round(y+point.y-gesture.point.y)};
      const kind = this.category === 'spawns' ? 'spawn' : 'placement';
      this.preview(kind,id,before,{...before,...delta});
    }
  }

  preview(kind,id,before,after) {
    if (!applyEdit[kind](this.game,id,after)) {
      this.message = 'That position or surface is unavailable.';
      return false;
    }
    this.message = '';
    const change = {kind,id,before,after};
    if (kind === 'placement') change.record = placementOverride(this.game,id,after);
    if (this.gesture) this.gesture.changes.set(id,change);
    else this.state.remember(kind === 'headwear' ? headwearScene : this.scene,[change]);
    return true;
  }

  finishGesture(cancel = false) {
    this.pending = null;
    if (!this.gesture) return;
    const {changes,scene} = this.gesture;
    this.gesture = null;
    if (cancel) for (const edit of changes.values()) applyEdit[edit.kind](this.game,edit.id,edit.before);
    else this.state.remember(scene,[...changes.values()]);
    this.refresh();
  }

  history(reverse) {
    this.finishGesture();
    this.message = '';
    if (!this.state.step(reverse,(command,undo) => {
      if (command.scene !== this.scene && command.scene !== headwearScene) {
        this.message = 'Return to the edited scene to undo or redo that change.';
        return false;
      }
      const applied = [];
      for (const edit of command.entries) {
        if (!applyEdit[edit.kind](this.game,edit.id,undo ? edit.before : edit.after)) {
          for (const old of applied.reverse()) applyEdit[old.kind](this.game,old.id,undo ? old.after : old.before);
          this.message = 'The selected edit is unavailable in this scene.';
          return false;
        }
        applied.push(edit);
      }
      return true;
    })) return this.refresh();
    this.refresh();
  }

  async saveEdits() {
    this.finishGesture();
    this.saving = true;
    this.message = '';
    this.refresh();
    try { await this.state.save(); this.message = 'Edits saved.'; }
    catch (error) { this.message = `Save failed. ${error.message}`; }
    this.saving = false;
    this.refresh();
  }

  field(label,value,callback,{min,max,step=1} = {}) {
    const row = element('label',label);
    const input = element('input','',{type:'number',step});
    if (min != null) input.min = min;
    if (max != null) input.max = max;
    input.value = number(value,2);
    input.onchange = () => {
      if (input.value !== '' && input.checkValidity()) value = callback(input.valueAsNumber) ?? value;
      input.value = number(value,2);
    };
    row.append(input);
    return row;
  }

  renderHeadwear(target) {
    const hat = headwearFor(this.game,target.id,this.hatDirection ?? undefined);
    if (!hat) {
      this.inspector.append(element('p','Equip a hat to adjust its fit.'));
      return;
    }
    if (!this.hatOpen) {
      this.inspector.append(this.button(hat.label,() => { this.hatOpen = true; this.refresh(); }));
      return;
    }
    this.hatKey = hat.key;
    this.inspector.append(element('p',`${hat.label} · ${compass[hat.direction]}`));
    const facings = element('div','',{'class':'live-edit-facings','role':'group','aria-label':'Hat facing'});
    for (const [direction,name] of Object.entries(compass)) {
      const button = this.button(direction,() => this.inspectHatFacing(target,direction),`Preview ${name.toLowerCase()}`);
      button.dataset.facing = direction;
      button.title = name;
      button.setAttribute('aria-pressed',String(hat.direction === direction));
      if (headwearFor(this.game,target.id,direction)?.savedValues) button.dataset.adjusted = 'true';
      facings.append(button);
    }
    this.inspector.append(facings);
    const fields = element('div','',{'class':'live-edit-numbers'});
    for (const [key,label,min,max,step] of headwearFields) {
      fields.append(this.field(label,hat.values[key],value => {
        const current = headwearFor(this.game,target.id,hat.direction);
        if (current?.key !== hat.key) { this.refresh(); return; }
        const changed = this.preview('headwear',hat.key,current.savedValues,{...current.values,[key]:value});
        if (changed) facings.querySelector(`[data-facing="${hat.direction}"]`).dataset.adjusted = 'true';
        reset.disabled = isDefaultFit(headwearFor(this.game,target.id,hat.direction).values);
        this.refreshStatus();
        return changed ? value : current.values[key];
      },{min,max,step}));
    }
    const actions = element('div','',{'class':'live-edit-fitting-actions'});
    const follow = this.button('Follow facing',() => this.inspectHatFacing(target,null));
    follow.className = 'live-edit-follow';
    follow.setAttribute('aria-pressed',String(!this.hatDirection));
    const reset = this.button('Reset facing',() => {
      const current = headwearFor(this.game,target.id,hat.direction);
      if (current?.key === hat.key) {
        const base = headwearFor(this.game,target.id,'all').values;
        this.preview('headwear',hat.key,current.savedValues,isDefaultFit(base) ? null : DEFAULT_HEADWEAR_FIT);
      }
      this.refresh();
    });
    reset.className = 'live-edit-reset-facing';
    reset.disabled = isDefaultFit(hat.values);
    actions.append(follow,reset);
    this.inspector.append(fields,actions);
  }

  refresh() {
    if (!this.active) return;
    for (const [id,button] of this.tabs) button.setAttribute('aria-pressed',String(id === this.category));
    this.inspector.replaceChildren();
    this.hatKey = null;
    const target = this.currentTarget();
    if (target) this.inspector.append(element('h3',target.label));
    if (this.category === 'ground') {
      const brushes = terrainBrushes(this.game);
      const select = element('select','',{'aria-label':'Ground material'});
      for (const {id,label} of brushes) select.append(element('option',label,{value:id}));
      select.append(element('option','Original ground',{value:originalGround}));
      if (this.brush !== originalGround && !brushes.some(brush => brush.id === this.brush)) this.brush = brushes[0]?.id;
      select.value = this.brush || '';
      select.onchange = () => { this.brush = select.value; };
      if (brushes.length) this.inspector.append(select);
      this.inspector.append(element('p',brushes.length ? guides.ground : 'Ground painting is available outdoors in the Wild Lands.'));
    } else if (target && this.category === 'characters') {
      this.renderHeadwear(target);
    } else if (target) {
      const {id,x,y,radius} = target, kind = this.category === 'spawns' ? 'spawn' : 'placement';
      const before = radius == null ? {x,y} : {x,y,radius};
      const fields = element('div','',{'class':'live-edit-numbers'});
      for (const [key,value] of Object.entries(before)) {
        const label = {x:'World X',y:'World Y',radius:'Area radius'}[key];
        fields.append(this.field(label,value,next => {
          const current = this.currentTarget();
          if (!current) { this.refresh(); return; }
          const {x,y,radius} = current, previous = radius == null ? {x,y} : {x,y,radius};
          this.preview(kind,id,previous,{...previous,[key]:next});
          this.refreshStatus();
          return this.currentTarget()?.[key];
        }));
      }
      this.inspector.append(fields);
    }
    if (!target && this.category !== 'ground') {
      const scope = this.category === 'characters' || this.design?.wildLands && !this.design.activeRoom;
      this.inspector.append(element('p',scope ? guides[this.category] : 'This tool is available outdoors in the Wild Lands.'));
    }
    this.refreshStatus();
  }

  refreshStatus() {
    const dirty = this.state.dirty;
    this.toggle.classList.toggle('has-edits',dirty);
    this.status.textContent = this.message || (this.saving ? 'Saving…' : dirty ? 'Unsaved edits' : 'All edits saved');
    this.undo.disabled = !this.state.undo.length;
    this.redo.disabled = !this.state.redo.length;
    this.save.disabled = !dirty || this.saving || !!this.loadError;
  }

  draw(renderer) {
    const width = innerWidth,height = innerHeight;
    if (this.overlay.width !== width || this.overlay.height !== height) {
      this.overlay.width = width;
      this.overlay.height = height;
    }
    const ctx = this.overlay.getContext('2d');
    ctx.clearRect(0,0,width,height);
    if (!this.cursor && this.category !== 'spawns') return;
    const screen = this.cursor || {x:width/2,y:height/2}, point = renderer.screenToWorld(screen.x,screen.y);
    const project = world => renderer.worldToClient(world,screen);
    const cell = this.category === 'ground' ? terrainCellAt(this.game,point) : null;
    const selected = this.currentTarget();
    if (selected && this.category === 'characters' && this.hatOpen && !this.inspector.querySelector('.live-edit-numbers input:focus')) {
      const key = headwearFor(this.game,selected.id,this.hatDirection ?? undefined)?.key ?? null;
      if (key !== this.hatKey) this.refresh();
    }
    const target = selected || (this.category !== 'ground' ? this.targets(point)[0] : null);
    if (this.category === 'spawns') {
      ctx.strokeStyle = '#d7e89f';
      ctx.lineWidth = 1;
      ctx.setLineDash([3,3]);
      for (const spawn of spawnTargets(this.game)) {
        if (spawn.id === target?.id) continue;
        const center = project(spawn);
        const size = spawn.radius ? Math.abs(project({x:spawn.x+spawn.radius,y:spawn.y}).x-center.x) : 5;
        if (center.x+size < 0 || center.x-size > width || center.y+size < 0 || center.y-size > height) continue;
        ctx.beginPath();
        ctx.arc(center.x,center.y,size,0,Math.PI*2);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = target && this.selected ? '#ffe09b' : '#a9edc7';
    ctx.lineWidth = 2;
    ctx.setLineDash(target && this.selected ? [] : [5,3]);
    if (cell) {
      const a = project(cell), b = project({x:cell.x+cell.size,y:cell.y+cell.size});
      ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    }
    if (!target) return;
    const anchor = project(target), bounds = target.bounds;
    if (bounds) {
      const a = project(bounds), b = project(endOfBounds(bounds));
      ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    } else {
      const size = target.radius ? Math.abs(project({x:target.x+target.radius,y:target.y}).x-anchor.x) : 13;
      ctx.beginPath();
      ctx.arc(anchor.x,anchor.y,Math.max(8,size),0,Math.PI*2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeRect(anchor.x-2,anchor.y-2,4,4);
  }
}
